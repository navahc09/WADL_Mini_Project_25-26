const bcrypt = require("bcryptjs");
const { query, withTransaction } = require("../db");
const {
  exportApplicantsToExcel,
  getCompanyTemplate,
  upsertCompanyTemplate,
  getAvailableColumns,
} = require("../services/export.service");
const {
  buildPreview,
  bulkInsertStudents,
  checkDuplicatesForPayload,
  DB_FIELDS,
} = require("../services/bulkImport.service");
const {
  formatDateLabel,
  mapApplicantStatus,
  mapJobRow,
  parseNumber,
} = require("../services/presentation.service");
const { sendEmail } = require("../services/email.service");
const {
  generateAndStoreToken,
  sendSetupEmail,
  sendResetEmail,
} = require("./auth.controller");
const { createAuditLog, getAuditLogs } = require("../services/audit.service");
const { checkJD } = require("../services/jdChecker.service");
const { checkEligibility } = require("../services/criteriaEngine.service");

function normalizeList(value, splitter = /\r?\n|[.;]+/g) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return String(value)
    .split(splitter)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeCsv(value) {
  return normalizeList(value, /,/g);
}

function mapJobType(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "full-time") return "full_time";
  return normalized.replace(/-/g, "_");
}

function mapWorkMode(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "on-site") return "on_site";
  return normalized.replace(/-/g, "_");
}

function toApplicationStatus(value) {
  if (value === "Shortlisted") return "shortlisted";
  if (value === "Rejected") return "rejected";
  if (value === "Offered") return "offered";
  return "applied";
}

function buildApplicantNote(snapshot) {
  const skills = (snapshot.skills || []).slice(0, 3).join(", ");
  if (skills) {
    return `Snapshot shows strong alignment in ${skills}.`;
  }

  if ((snapshot.certifications || []).length > 0) {
    return `Certified in ${(snapshot.certifications[0]?.name || "a relevant domain")}.`;
  }

  return "Snapshot is ready for recruiter review.";
}

async function fetchAdminJobs(limit) {
  const params = [];
  const limitClause = limit ? `LIMIT $1` : "";
  if (limit) {
    params.push(limit);
  }

  const { rows } = await query(
    `
      SELECT
        j.*,
        c.name AS company_name,
        COUNT(a.id)::int AS applicant_count,
        COUNT(*) FILTER (WHERE a.status IN ('shortlisted', 'interview_scheduled', 'interview_completed', 'offered', 'accepted'))::int AS shortlisted_count,
        COUNT(*) FILTER (WHERE a.applied_at >= NOW() - INTERVAL '7 days')::int AS new_applicants
      FROM jobs j
      JOIN companies c ON c.id = j.company_id
      LEFT JOIN applications a ON a.job_id = j.id
      GROUP BY j.id, c.name
      ORDER BY j.created_at DESC
      ${limitClause}
    `,
    params,
  );

  return rows.map((row) =>
    mapJobRow(row, {
      applicantCount: row.applicant_count,
      shortlistRate:
        parseNumber(row.applicant_count) > 0
          ? parseNumber(row.shortlisted_count) / parseNumber(row.applicant_count)
          : 0,
      newApplicants: row.new_applicants,
    }),
  );
}

async function getDashboard(_req, res, next) {
  try {
    const [
      studentCountResult,
      placedCountResult,
      salaryResult,
      activeJobsResult,
      pendingReviewsResult,
      newApplicationsResult,
      deadlineResult,
      latestApplicationResult,
      latestJobResult,
      jobs,
    ] = await Promise.all([
      query("SELECT COUNT(*)::int AS count FROM student_profiles"),
      query(
        `
          SELECT COUNT(DISTINCT student_id)::int AS count
          FROM applications
          WHERE status IN ('offered', 'accepted')
        `,
      ),
      query(
        `
          SELECT AVG(j.salary_lpa)::numeric(10,2) AS avg_salary
          FROM applications a
          JOIN jobs j ON j.id = a.job_id
          WHERE a.status IN ('offered', 'accepted')
        `,
      ),
      query("SELECT COUNT(*)::int AS count FROM jobs WHERE status = 'open'"),
      query("SELECT COUNT(*)::int AS count FROM applications WHERE status = 'applied'"),
      query("SELECT COUNT(*)::int AS count FROM applications WHERE applied_at::date = CURRENT_DATE"),
      query(
        `
          SELECT COUNT(*)::int AS count
          FROM jobs
          WHERE status = 'open'
            AND application_deadline::date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
        `,
      ),
      query(
        `
          SELECT j.title, c.name AS company_name, a.updated_at
          FROM applications a
          JOIN jobs j ON j.id = a.job_id
          JOIN companies c ON c.id = j.company_id
          ORDER BY a.updated_at DESC
          LIMIT 1
        `,
      ),
      query(
        `
          SELECT j.title, c.name AS company_name, j.created_at
          FROM jobs j
          JOIN companies c ON c.id = j.company_id
          ORDER BY j.created_at DESC
          LIMIT 1
        `,
      ),
      fetchAdminJobs(4),
    ]);

    const totalStudents = studentCountResult.rows[0]?.count || 0;
    const totalPlaced = placedCountResult.rows[0]?.count || 0;

    res.json({
      overview: {
        totalStudents,
        totalPlaced,
        placementRate: totalStudents ? Number(((totalPlaced / totalStudents) * 100).toFixed(1)) : 0,
        avgSalary: parseNumber(salaryResult.rows[0]?.avg_salary).toFixed(2),
        activeJobs: activeJobsResult.rows[0]?.count || 0,
        pendingReviews: pendingReviewsResult.rows[0]?.count || 0,
        newApplicationsToday: newApplicationsResult.rows[0]?.count || 0,
        upcomingDeadlines: deadlineResult.rows[0]?.count || 0,
      },
      jobs,
      feed: [
        latestApplicationResult.rows[0]
          ? {
            id: "feed-latest-application",
            title: `${latestApplicationResult.rows[0].company_name} applicant pipeline updated`,
            detail: `${latestApplicationResult.rows[0].title} received fresh application activity.`,
            time: formatDateLabel(latestApplicationResult.rows[0].updated_at),
          }
          : null,
        latestJobResult.rows[0]
          ? {
            id: "feed-latest-job",
            title: `${latestJobResult.rows[0].company_name} role posted`,
            detail: `${latestJobResult.rows[0].title} is live in the placement board.`,
            time: formatDateLabel(latestJobResult.rows[0].created_at),
          }
          : null,
        {
          id: "feed-summary",
          title: "Deadline watch",
          detail: `${deadlineResult.rows[0]?.count || 0} open job(s) close within the next 7 days.`,
          time: "Today",
        },
      ].filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
}

async function listJobs(_req, res, next) {
  try {
    res.json(await fetchAdminJobs());
  } catch (error) {
    next(error);
  }
}

async function createJob(req, res, next) {
  try {
    const deadline = new Date(req.body.deadline);
    if (Number.isNaN(deadline.getTime())) {
      return res.status(400).json({ error: "Invalid application deadline" });
    }

    const job = await withTransaction(async (client) => {
      const companyName = req.body.company.trim();
      const companyResult = await client.query(
        `
          INSERT INTO companies (name)
          VALUES ($1)
          ON CONFLICT (name)
          DO UPDATE SET name = EXCLUDED.name
          RETURNING id, name
        `,
        [companyName],
      );

      const insertResult = await client.query(
        `
          INSERT INTO jobs (
            company_id,
            created_by,
            title,
            description,
            job_type,
            work_mode,
            location,
            salary_label,
            min_cgpa,
            max_active_backlogs,
            allowed_branches,
            required_skills,
            tags,
            featured,
            openings,
            about_company,
            responsibilities,
            requirements,
            perks,
            process,
            status,
            application_deadline
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::text[], $12::text[], $13::text[],
            FALSE, 1, $14, $15::text[], $16::text[], $17::text[], $18::text[],
            'open', $19
          )
          RETURNING *
        `,
        [
          companyResult.rows[0].id,
          req.user.id,
          req.body.title,
          req.body.description,
          mapJobType(req.body.type),
          mapWorkMode(req.body.mode),
          req.body.location,
          req.body.salaryLabel || req.body.jobPackage || null,
          Number(req.body.minCgpa),
          Number(req.body.maxActiveBacklogs ?? 0),
          normalizeCsv(req.body.branches),
          normalizeCsv(req.body.skills || req.body.tags),
          normalizeCsv(req.body.tags || req.body.skills),
          req.body.aboutCompany ||
          `${companyName} is hiring through the placement cell for a curated campus opportunity with growth-oriented project exposure.`,
          normalizeList(req.body.responsibilities),
          normalizeList(req.body.requirements).length
            ? normalizeList(req.body.requirements)
            : [`Minimum CGPA ${req.body.minCgpa} with eligible branches: ${normalizeCsv(req.body.branches).join(", ")}`],
          normalizeList(req.body.perks).length
            ? normalizeList(req.body.perks)
            : ["Placement-cell coordinated hiring flow", "Mentorship and recruiter feedback visibility"],
          normalizeList(req.body.process).length
            ? normalizeList(req.body.process)
            : ["Resume shortlist", "Technical evaluation", "Final recruiter discussion"],
          deadline.toISOString(),
        ],
      );

      return {
        ...insertResult.rows[0],
        company_name: companyResult.rows[0].name,
        applicant_count: 0,
        shortlisted_count: 0,
        new_applicants: 0,
      };
    });

    res.status(201).json(
      mapJobRow(job, {
        applicantCount: 0,
        shortlistRate: 0,
        newApplicants: 0,
      }),
    );
  } catch (error) {
    next(error);
  }
}

async function getApplicants(req, res, next) {
  try {
    const [appResult, jobResult] = await Promise.all([
      query(
        `SELECT a.id, a.status, a.match_score, a.snapshot_data
         FROM applications a
         WHERE a.job_id = $1
         ORDER BY a.applied_at ASC`,
        [req.params.id],
      ),
      query(
        `SELECT j.min_cgpa, j.max_active_backlogs, j.allowed_branches, j.graduation_year
         FROM jobs j WHERE j.id = $1`,
        [req.params.id],
      ),
    ]);

    const job = jobResult.rows[0] || {};

    res.json(
      appResult.rows.map((row) => {
        const snap = row.snapshot_data || {};
        const { eligible, hardFailures } = checkEligibility(snap, job);
        return {
          id: row.id,
          name: snap.full_name,
          rollNumber: snap.roll_number,
          branch: snap.branch,
          cgpa: snap.cgpa,
          status: mapApplicantStatus(row.status),
          // Fit score only shown for eligible candidates
          score: eligible ? row.match_score : null,
          eligible,
          hardFailures,
          note: buildApplicantNote(snap),
          resumeUrl: snap.resume_url || null,
          email: snap.email || null,
        };
      }),
    );
  } catch (error) {
    next(error);
  }
}

async function patchApplicantStatus(req, res, next) {
  try {
    const nextStatus = toApplicationStatus(req.body.status);
    const reason = req.body.reason || null;

    const result = await withTransaction(async (client) => {
      const applicationResult = await client.query(
        `SELECT a.id, a.status, a.snapshot_data, a.match_score,
                sp.user_id, u.email,
                j.id AS job_id, j.title,
                c.name AS company_name
         FROM applications a
         JOIN student_profiles sp ON sp.id = a.student_id
         JOIN users u ON u.id = sp.user_id
         JOIN jobs j ON j.id = a.job_id
         JOIN companies c ON c.id = j.company_id
         WHERE a.id = $1 AND a.job_id = $2`,
        [req.params.applicantId, req.params.id],
      );

      const application = applicationResult.rows[0];
      if (!application) {
        const error = new Error("Applicant not found");
        error.statusCode = 404;
        throw error;
      }

      const prevStatus = application.status;

      const updateResult = await client.query(
        `UPDATE applications SET status = $1 WHERE id = $2
         RETURNING id, status, match_score, snapshot_data`,
        [nextStatus, application.id],
      );

      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, metadata)
         VALUES ($1, $2, $3, 'status_update', $4::jsonb)`,
        [
          application.user_id,
          "Application status updated",
          `Your application for ${application.title} at ${application.company_name} is now ${req.body.status}.${reason ? ` Note: ${reason}` : ""}`,
          JSON.stringify({ job_id: application.job_id, application_id: application.id }),
        ],
      );

      return {
        updated: updateResult.rows[0],
        prevStatus,
        email: application.email,
        fullName: application.snapshot_data?.full_name,
        title: application.title,
        companyName: application.company_name,
        applicationId: application.id,
      };
    });

    // Write audit log (non-blocking, errors swallowed in service)
    await createAuditLog({
      entityType: "application",
      entityId: result.applicationId,
      action: "status_changed",
      changedBy: req.user.id,
      oldValue: { status: result.prevStatus },
      newValue: { status: nextStatus },
      reason,
      ip: req.ip,
    });

    await sendEmail({
      to: result.email,
      subject: `Application update: ${result.companyName} - ${result.title}`,
      text: `Hello ${result.fullName}, your application for ${result.title} at ${result.companyName} is now marked as ${req.body.status}.`,
    });

    res.json({
      id: result.updated.id,
      status: mapApplicantStatus(result.updated.status),
      score: result.updated.match_score,
    });
  } catch (error) {
    next(error);
  }
}

async function exportApplicants(req, res, next) {
  try {
    const file = await exportApplicantsToExcel(req.params.id);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
    res.send(Buffer.from(file.buffer));
  } catch (error) {
    next(error);
  }
}

// ── Export Template CRUD ──────────────────────────────────────────────────────

async function getExportTemplate(req, res, next) {
  try {
    const { companyId } = req.params;
    const template = await getCompanyTemplate(companyId);
    const columns  = getAvailableColumns();
    res.json({ template: template || null, availableColumns: columns });
  } catch (error) {
    next(error);
  }
}

async function saveExportTemplate(req, res, next) {
  try {
    const { companyId } = req.params;
    const template = await upsertCompanyTemplate(companyId, req.body);
    res.json({ template });
  } catch (error) {
    next(error);
  }
}

async function getAnalytics(_req, res, next) {
  try {
    const [
      totalsResult,
      salaryResult,
      branchStatsResult,
      statusDistributionResult,
      monthlyTrendResult,
      salaryBandsResult,
    ] = await Promise.all([
      query(
        `
          SELECT
            (SELECT COUNT(*)::int FROM student_profiles) AS total_students,
            (SELECT COUNT(DISTINCT student_id)::int FROM applications WHERE status IN ('offered', 'accepted')) AS total_placed
        `,
      ),
      query(
        `
          SELECT AVG(j.salary_lpa)::numeric(10,2) AS avg_salary
          FROM applications a
          JOIN jobs j ON j.id = a.job_id
          WHERE a.status IN ('offered', 'accepted')
        `,
      ),
      query(
        `
          SELECT
            sp.branch,
            COUNT(*) FILTER (
              WHERE EXISTS (
                SELECT 1
                FROM applications a
                WHERE a.student_id = sp.id
                  AND a.status IN ('offered', 'accepted')
              )
            )::int AS placed,
            COUNT(*) FILTER (
              WHERE NOT EXISTS (
                SELECT 1
                FROM applications a
                WHERE a.student_id = sp.id
                  AND a.status IN ('offered', 'accepted')
              )
            )::int AS not_placed
          FROM student_profiles sp
          GROUP BY sp.branch
          ORDER BY sp.branch
        `,
      ),
      query(
        `
          SELECT
            CASE
              WHEN status IN ('interview_scheduled', 'interview_completed') THEN 'Interview'
              WHEN status IN ('offered', 'accepted') THEN 'Offer'
              WHEN status = 'shortlisted' THEN 'Shortlisted'
              WHEN status = 'rejected' THEN 'Rejected'
              ELSE 'Applied'
            END AS status,
            COUNT(*)::int AS count
          FROM applications
          GROUP BY 1
          ORDER BY 1
        `,
      ),
      query(
        `
          SELECT
            TO_CHAR(DATE_TRUNC('month', applied_at), 'Mon') AS month,
            COUNT(*)::int AS applications,
            COUNT(*) FILTER (WHERE status IN ('offered', 'accepted'))::int AS offers
          FROM applications
          GROUP BY DATE_TRUNC('month', applied_at)
          ORDER BY DATE_TRUNC('month', applied_at)
        `,
      ),
      query(
        `
          SELECT
            CASE
              WHEN j.salary_lpa < 10 THEN '6-10 LPA'
              WHEN j.salary_lpa < 15 THEN '10-15 LPA'
              WHEN j.salary_lpa < 20 THEN '15-20 LPA'
              ELSE '20+ LPA'
            END AS band,
            COUNT(*)::int AS count
          FROM applications a
          JOIN jobs j ON j.id = a.job_id
          WHERE a.status IN ('offered', 'accepted')
          GROUP BY 1
          ORDER BY MIN(j.salary_lpa)
        `,
      ),
    ]);

    const totals = totalsResult.rows[0];
    const totalStudents = totals?.total_students || 0;
    const totalPlaced = totals?.total_placed || 0;

    res.json({
      total_students: totalStudents,
      total_placed: totalPlaced,
      placement_rate: totalStudents ? Number(((totalPlaced / totalStudents) * 100).toFixed(1)) : 0,
      avg_salary_lpa: parseNumber(salaryResult.rows[0]?.avg_salary),
      branch_stats: branchStatsResult.rows,
      status_distribution: statusDistributionResult.rows,
      monthly_trend: monthlyTrendResult.rows,
      salary_bands: salaryBandsResult.rows,
    });
  } catch (error) {
    next(error);
  }
}

async function updateJob(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body;

    const job = await withTransaction(async (client) => {
      const existingResult = await client.query(
        "SELECT * FROM jobs WHERE id = $1",
        [id],
      );
      const existing = existingResult.rows[0];
      if (!existing) {
        const error = new Error("Job not found");
        error.statusCode = 404;
        throw error;
      }

      let companyId = existing.company_id;
      if (body.company) {
        const companyResult = await client.query(
          `INSERT INTO companies (name)
           VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [body.company.trim()],
        );
        companyId = companyResult.rows[0].id;
      }

      const deadline = body.deadline ? new Date(body.deadline) : null;
      if (deadline && Number.isNaN(deadline.getTime())) {
        const error = new Error("Invalid application deadline");
        error.statusCode = 400;
        throw error;
      }

      const updateResult = await client.query(
        `UPDATE jobs SET
           company_id           = COALESCE($1, company_id),
           title                = COALESCE($2, title),
           description          = COALESCE($3, description),
           job_type             = COALESCE($4, job_type),
           work_mode            = COALESCE($5, work_mode),
           location             = COALESCE($6, location),
           salary_label         = COALESCE($7, salary_label),
           min_cgpa             = COALESCE($8, min_cgpa),
           max_active_backlogs  = COALESCE($9, max_active_backlogs),
           allowed_branches     = COALESCE($10, allowed_branches),
           required_skills      = COALESCE($11, required_skills),
           tags                 = COALESCE($12, tags),
           about_company        = COALESCE($13, about_company),
           responsibilities     = COALESCE($14, responsibilities),
           requirements         = COALESCE($15, requirements),
           perks                = COALESCE($16, perks),
           process              = COALESCE($17, process),
           application_deadline = COALESCE($18, application_deadline),
           updated_at           = NOW()
         WHERE id = $19
         RETURNING *`,
        [
          companyId,
          body.title || null,
          body.description || null,
          body.type ? mapJobType(body.type) : null,
          body.mode ? mapWorkMode(body.mode) : null,
          body.location || null,
          body.salaryLabel || body.jobPackage || null,
          body.minCgpa !== undefined ? Number(body.minCgpa) : null,
          body.maxActiveBacklogs !== undefined ? Number(body.maxActiveBacklogs) : null,
          body.branches ? normalizeCsv(body.branches) : null,
          body.skills ? normalizeCsv(body.skills) : null,
          body.tags ? normalizeCsv(body.tags) : null,
          body.aboutCompany || null,
          body.responsibilities ? normalizeList(body.responsibilities) : null,
          body.requirements ? normalizeList(body.requirements) : null,
          body.perks ? normalizeList(body.perks) : null,
          body.process ? normalizeList(body.process) : null,
          deadline ? deadline.toISOString() : null,
          id,
        ],
      );

      const companyRow = await client.query("SELECT name FROM companies WHERE id = $1", [companyId]);
      return { ...updateResult.rows[0], company_name: companyRow.rows[0]?.name };
    });

    res.json(
      mapJobRow(job, {
        applicantCount: 0,
        shortlistRate: 0,
        newApplicants: 0,
      }),
    );
  } catch (error) {
    next(error);
  }
}

async function closeJob(req, res, next) {
  try {
    const { rows } = await query(
      "UPDATE jobs SET status = 'closed', updated_at = NOW() WHERE id = $1 RETURNING id, status",
      [req.params.id],
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json({ id: rows[0].id, status: "Closed" });
  } catch (error) {
    next(error);
  }
}

async function reopenJob(req, res, next) {
  try {
    const { rows } = await query(
      "UPDATE jobs SET status = 'open', updated_at = NOW() WHERE id = $1 RETURNING id, status",
      [req.params.id],
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json({ id: rows[0].id, status: "Open" });
  } catch (error) {
    next(error);
  }
}

async function deleteJob(req, res, next) {
  try {
    const countResult = await query(
      "SELECT COUNT(*)::int AS count FROM applications WHERE job_id = $1",
      [req.params.id],
    );
    if (countResult.rows[0]?.count > 0) {
      return res.status(409).json({
        error: "Cannot delete a job that has applicants. Close it instead.",
      });
    }

    const { rows } = await query(
      "DELETE FROM jobs WHERE id = $1 RETURNING id",
      [req.params.id],
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json({ id: rows[0].id, deleted: true });
  } catch (error) {
    next(error);
  }
}

async function validateJD(req, res, _next) {
  const result = checkJD(req.body);
  res.json(result);
}

async function getEntityAuditLogs(req, res, next) {
  try {
    const { entityType, entityId } = req.query;
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
    const logs = await getAuditLogs({ entityType, entityId, limit });
    res.json(logs);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
  listJobs,
  createJob,
  getApplicants,
  patchApplicantStatus,
  exportApplicants,
  getAnalytics,
  updateJob,
  closeJob,
  reopenJob,
  deleteJob,
  validateJD,
  getEntityAuditLogs,
  // export templates
  getExportTemplate,
  saveExportTemplate,
  // student management
  createStudent,
  listStudents,
  sendStudentSetupLink,
  sendStudentResetLink,
  updateStudent,
  // bulk student operations
  bulkUploadPreview,
  bulkConfirmImport,
  bulkActivateStudents,
  bulkDeactivateStudents,
  bulkAssignBranch,
  checkDuplicates,
  getImportFieldDefs,
};

// ── Student Management ────────────────────────────────────────────────────────

async function createStudent(req, res, next) {
  try {
    const {
      fullName,
      email,
      enrollmentNo,
      phone,
      branch,
      graduationYear,
      cgpa,
      gender,
      dateOfBirth,
      tenthPercent,
      twelfthPercent,
      city,
    } = req.body;

    // Check for duplicate email or enrollment number
    const dupEmail = await query("SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    if (dupEmail.rows[0]) {
      return res.status(409).json({ error: "A student with this email already exists." });
    }

    const dupEnroll = await query(
      "SELECT 1 FROM student_profiles WHERE UPPER(roll_number) = UPPER($1)",
      [enrollmentNo],
    );
    if (dupEnroll.rows[0]) {
      return res.status(409).json({ error: "A student with this enrollment number already exists." });
    }

    // Derive branch_code from first letters of each word
    const branchCode = branch
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

    // Create with a sentinel password_hash that can never match any real password.
    // Student must set their password via the setup link.
    const sentinelHash = await bcrypt.hash(`__unset__${Date.now()}__`, 10);

    const user = await withTransaction(async (client) => {
      const userResult = await client.query(
        `INSERT INTO users (display_name, email, password_hash, role, is_active, email_verified)
         VALUES ($1, $2, $3, 'student', TRUE, TRUE)
         RETURNING id, display_name, email, role, is_active, email_verified`,
        [fullName, email, sentinelHash],
      );

      await client.query(
        `INSERT INTO student_profiles (
           user_id, full_name, phone, city, roll_number, branch, branch_code,
           graduation_year, cgpa, gender, date_of_birth, tenth_percent,
           twelfth_percent, skills, preferred_locations, preferred_domains,
           expected_salary_label, headline, about, profile_complete
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
           '{}', '{}', '{}', '', '', '', FALSE
         )`,
        [
          userResult.rows[0].id,
          fullName,
          phone || null,
          city || null,
          enrollmentNo.toUpperCase(),
          branch,
          branchCode,
          Number(graduationYear),
          Number(cgpa),
          gender || null,
          dateOfBirth || null,
          tenthPercent ? Number(tenthPercent) : null,
          twelfthPercent ? Number(twelfthPercent) : null,
        ],
      );

      return userResult.rows[0];
    });

    return res.status(201).json({
      message: "Student account created. Send the setup link to their email.",
      student: {
        id: user.id,
        name: user.display_name,
        email: user.email,
        enrollmentNo: enrollmentNo.toUpperCase(),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function listStudents(req, res, next) {
  try {
    const search = req.query.search || "";
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = 20;
    const offset = (page - 1) * limit;

    const { rows } = await query(
      `SELECT u.id, u.display_name AS name, u.email, u.is_active,
              sp.roll_number AS enrollment_no, sp.branch, sp.graduation_year,
              sp.cgpa, sp.profile_complete,
              (u.password_hash IS NOT NULL) AS has_password
       FROM users u
       JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.role = 'student'
         AND (
           $1 = ''
           OR LOWER(u.display_name) LIKE LOWER('%' || $1 || '%')
           OR LOWER(sp.roll_number) LIKE LOWER('%' || $1 || '%')
           OR LOWER(u.email) LIKE LOWER('%' || $1 || '%')
         )
       ORDER BY sp.roll_number
       LIMIT $2 OFFSET $3`,
      [search, limit, offset],
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM users u
       JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.role = 'student'
         AND (
           $1 = ''
           OR LOWER(u.display_name) LIKE LOWER('%' || $1 || '%')
           OR LOWER(sp.roll_number) LIKE LOWER('%' || $1 || '%')
           OR LOWER(u.email) LIKE LOWER('%' || $1 || '%')
         )`,
      [search],
    );

    return res.json({
      students: rows,
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
    });
  } catch (error) {
    return next(error);
  }
}

async function sendStudentSetupLink(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await query(
      `SELECT u.id, u.display_name AS name, u.email, u.role
       FROM users u WHERE u.id = $1 AND u.role = 'student'`,
      [id],
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Student not found." });
    }

    const { name, email } = rows[0];
    const token = await generateAndStoreToken(id, "setup");
    await sendSetupEmail(email, name, token);

    return res.json({ message: `Password setup link sent to ${email}.` });
  } catch (error) {
    return next(error);
  }
}

async function sendStudentResetLink(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await query(
      `SELECT u.id, u.display_name AS name, u.email, u.role
       FROM users u WHERE u.id = $1 AND u.role = 'student'`,
      [id],
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Student not found." });
    }

    const { name, email } = rows[0];
    const token = await generateAndStoreToken(id, "reset");
    await sendResetEmail(email, name, token);

    return res.json({ message: `Password reset link sent to ${email}.` });
  } catch (error) {
    return next(error);
  }
}

async function updateStudent(req, res, next) {
  try {
    const { id } = req.params;
    const {
      fullName, email, phone, city, branch, graduationYear, cgpa,
      gender, dateOfBirth, tenthPercent, twelfthPercent, isActive,
    } = req.body;

    const { rows } = await query(
      `SELECT u.id, sp.id AS profile_id FROM users u
       JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1 AND u.role = 'student'`,
      [id],
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Student not found." });
    }

    const branchCode = branch
      ? branch.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase()
      : undefined;

    await withTransaction(async (client) => {
      if (fullName || email || isActive !== undefined) {
        await client.query(
          `UPDATE users SET
             display_name = COALESCE($1, display_name),
             email = COALESCE($2, email),
             is_active = COALESCE($3, is_active),
             updated_at = NOW()
           WHERE id = $4`,
          [fullName || null, email || null, isActive ?? null, id],
        );
      }
      await client.query(
        `UPDATE student_profiles SET
           full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           city = COALESCE($3, city),
           branch = COALESCE($4, branch),
           branch_code = COALESCE($5, branch_code),
           graduation_year = COALESCE($6, graduation_year),
           cgpa = COALESCE($7, cgpa),
           gender = COALESCE($8, gender),
           date_of_birth = COALESCE($9, date_of_birth),
           tenth_percent = COALESCE($10, tenth_percent),
           twelfth_percent = COALESCE($11, twelfth_percent),
           updated_at = NOW()
         WHERE user_id = $12`,
        [
          fullName || null, phone || null, city || null,
          branch || null, branchCode || null,
          graduationYear ? Number(graduationYear) : null,
          cgpa ? Number(cgpa) : null,
          gender || null,
          dateOfBirth || null,
          tenthPercent ? Number(tenthPercent) : null,
          twelfthPercent ? Number(twelfthPercent) : null,
          id,
        ],
      );
    });

    return res.json({ message: "Student details updated." });
  } catch (error) {
    return next(error);
  }
}

// ── Bulk Student Operations ───────────────────────────────────────────────────

async function bulkUploadPreview(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const ext = (req.file.originalname || "").split(".").pop().toLowerCase();
    const mimeType = ext === "xlsx" ? "xlsx" : "csv";

    // mapping array may be sent as JSON body (for CSV re-map step)
    let mapping = null;
    if (req.body.mapping) {
      try { mapping = JSON.parse(req.body.mapping); } catch (_) { /* ignore */ }
    }

    const result = await buildPreview(req.file.buffer, mimeType, mapping);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function bulkConfirmImport(req, res, next) {
  try {
    const { rows } = req.body; // array of validated row objects
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "No rows provided." });
    }

    // Only insert rows that passed validation (client should already filter,
    // but we double-check required fields server-side)
    const validRows = rows.filter(
      (r) => r.fullName && r.email && r.enrollmentNo && r.branch && r.graduationYear && r.cgpa,
    );

    if (validRows.length === 0) {
      return res.status(400).json({ error: "No valid rows to import." });
    }

    const result = await bulkInsertStudents(validRows);
    res.json({
      created: result.created.length,
      failed:  result.failed.length,
      details: result,
    });
  } catch (error) {
    next(error);
  }
}

async function bulkActivateStudents(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No student IDs provided." });
    }
    await query(
      "UPDATE users SET is_active = TRUE, updated_at = NOW() WHERE id = ANY($1) AND role = 'student'",
      [ids],
    );
    res.json({ updated: ids.length });
  } catch (error) {
    next(error);
  }
}

async function bulkDeactivateStudents(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No student IDs provided." });
    }
    await query(
      "UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = ANY($1) AND role = 'student'",
      [ids],
    );
    res.json({ updated: ids.length });
  } catch (error) {
    next(error);
  }
}

async function bulkAssignBranch(req, res, next) {
  try {
    const { ids, branch, graduationYear } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No student IDs provided." });
    }
    if (!branch && !graduationYear) {
      return res.status(400).json({ error: "Provide branch and/or graduation year." });
    }

    const branchCode = branch
      ? branch.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase()
      : null;

    await query(
      `UPDATE student_profiles SET
         branch          = COALESCE($1, branch),
         branch_code     = COALESCE($2, branch_code),
         graduation_year = COALESCE($3, graduation_year),
         updated_at      = NOW()
       WHERE user_id = ANY($4)`,
      [branch || null, branchCode || null, graduationYear ? Number(graduationYear) : null, ids],
    );
    res.json({ updated: ids.length });
  } catch (error) {
    next(error);
  }
}

async function checkDuplicates(req, res, next) {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) {
      return res.status(400).json({ error: "rows array required." });
    }
    const result = await checkDuplicatesForPayload(rows);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getImportFieldDefs(_req, res) {
  res.json(DB_FIELDS);
}
