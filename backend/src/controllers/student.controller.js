const { query, withTransaction } = require("../db");
const { checkEligibility } = require("../services/criteriaEngine.service");
const {
  mapApplicationRow,
  mapDocumentRow,
  mapJobRow,
  mapStudentProfile,
  parseNumber,
} = require("../services/presentation.service");

async function loadStudentProfile(userId, client = { query }) {
  const result = await client.query(
    `
      SELECT
        sp.*,
        u.email,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', c.id,
              'name', c.name,
              'issuer', c.issuer,
              'issued_date', c.issued_date,
              'cert_url', c.cert_url
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'::json
        ) AS certifications,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', we.id,
              'company', we.company,
              'role', we.role,
              'start_date', we.start_date,
              'end_date', we.end_date,
              'is_current', we.is_current,
              'description', we.description
            )
          ) FILTER (WHERE we.id IS NOT NULL),
          '[]'::json
        ) AS work_experiences
      FROM student_profiles sp
      JOIN users u ON u.id = sp.user_id
      LEFT JOIN certifications c ON c.student_id = sp.id
      LEFT JOIN work_experiences we ON we.student_id = sp.id
      WHERE sp.user_id = $1
      GROUP BY sp.id, u.email
    `,
    [userId],
  );

  return result.rows[0] || null;
}

function computeProfileCompleteness(profile, documents = []) {
  const checks = [
    Boolean(profile.full_name),
    Boolean(profile.phone),
    Boolean(profile.city),
    Boolean(profile.roll_number),
    Boolean(profile.branch),
    parseNumber(profile.cgpa) > 0,
    Boolean(profile.headline),
    Boolean(profile.about),
    (profile.skills || []).length > 0,
    (profile.preferred_locations || []).length > 0,
    (profile.preferred_domains || []).length > 0,
    documents.some((document) => document.doc_type === "resume"),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

async function getDashboard(req, res, next) {
  try {
    const profile = await loadStudentProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    const [documentsResult, statsResult, applicationsResult, jobsResult] = await Promise.all([
      query(
        `
          SELECT *
          FROM documents
          WHERE student_id = $1
          ORDER BY uploaded_at DESC
        `,
        [profile.id],
      ),
      query(
        `
          SELECT
            COUNT(*) AS applications_sent,
            COUNT(*) FILTER (WHERE status IN ('interview_scheduled', 'interview_completed')) AS active_interviews,
            COUNT(*) FILTER (WHERE status IN ('offered', 'accepted')) AS offers_received,
            COUNT(*) FILTER (WHERE status IN ('shortlisted', 'interview_scheduled', 'interview_completed', 'offered', 'accepted')) AS responded
          FROM applications
          WHERE student_id = $1
        `,
        [profile.id],
      ),
      query(
        `
          SELECT
            a.*,
            j.title,
            j.salary_label,
            j.salary_lpa,
            j.id AS job_id,
            c.name AS company_name,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'round_type', ir.round_type,
                  'scheduled_at', ir.scheduled_at,
                  'result', ir.result
                )
              ) FILTER (WHERE ir.id IS NOT NULL),
              '[]'::json
            ) AS interview_rounds
          FROM applications a
          JOIN jobs j ON j.id = a.job_id
          JOIN companies c ON c.id = j.company_id
          LEFT JOIN interview_rounds ir ON ir.application_id = a.id
          WHERE a.student_id = $1
          GROUP BY a.id, j.title, j.salary_label, j.salary_lpa, j.id, c.name
          ORDER BY a.applied_at DESC
          LIMIT 4
        `,
        [profile.id],
      ),
      query(
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
          WHERE j.status = 'open'
          GROUP BY j.id, c.name
          ORDER BY j.featured DESC, j.application_deadline ASC
        `,
      ),
    ]);

    const documents = documentsResult.rows;
    const statsRow = statsResult.rows[0];
    const profileCompleteness = computeProfileCompleteness(profile, documents);
    const applicationsSent = parseNumber(statsRow.applications_sent);
    const responded = parseNumber(statsRow.responded);

    const mappedProfile = mapStudentProfile(profile, {
      profileCompleteness,
      applicationsSent,
      activeInterviews: parseNumber(statsRow.active_interviews),
      offersReceived: parseNumber(statsRow.offers_received),
      responseRate: applicationsSent ? Math.round((responded / applicationsSent) * 100) : 0,
    });

    const featuredJobs = jobsResult.rows
      .map((jobRow) => {
        const eligibility = checkEligibility(mappedProfile, {
          ...jobRow,
          minCgpa: jobRow.min_cgpa,
          maxActiveBacklogs: jobRow.max_active_backlogs,
          allowedBranches: jobRow.allowed_branches,
          requiredSkills: jobRow.required_skills,
        });

        return mapJobRow(jobRow, {
          eligible: eligibility.eligible,
          reasons: eligibility.reasons,
          applicantCount: jobRow.applicant_count,
          shortlistRate:
            parseNumber(jobRow.applicant_count) > 0
              ? parseNumber(jobRow.shortlisted_count) / parseNumber(jobRow.applicant_count)
              : 0,
          newApplicants: jobRow.new_applicants,
        });
      })
      .filter((job) => job.eligible)
      .slice(0, 2);

    res.json({
      profile: mappedProfile,
      featuredJobs,
      applications: applicationsResult.rows.map(mapApplicationRow),
      documents: documents.map(mapDocumentRow),
      stats: mappedProfile.metrics,
    });
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const profile = await loadStudentProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    const documentsResult = await query(
      "SELECT doc_type FROM documents WHERE student_id = $1",
      [profile.id],
    );

    const mappedProfile = mapStudentProfile(profile, {
      profileCompleteness: computeProfileCompleteness(profile, documentsResult.rows),
    });

    return res.json(mappedProfile);
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const updatedProfile = await withTransaction(async (client) => {
      const existing = await loadStudentProfile(req.user.id, client);
      if (!existing) {
        const error = new Error("Student profile not found");
        error.statusCode = 404;
        throw error;
      }

      await client.query(
        `
          UPDATE users
          SET
            display_name = COALESCE($1, display_name),
            email = COALESCE($2, email)
          WHERE id = $3
        `,
        [req.body.name || null, req.body.email || null, req.user.id],
      );

      await client.query(
        `
          UPDATE student_profiles
          SET
            full_name = COALESCE($1, full_name),
            phone = COALESCE($2, phone),
            city = COALESCE($3, city),
            branch = COALESCE($4, branch),
            graduation_year = COALESCE($5, graduation_year),
            cgpa = COALESCE($6, cgpa),
            roll_number = COALESCE($7, roll_number),
            headline = COALESCE($8, headline),
            about = COALESCE($9, about),
            preferred_locations = COALESCE($10, preferred_locations),
            preferred_domains = COALESCE($11, preferred_domains),
            expected_salary_label = COALESCE($12, expected_salary_label),
            skills = COALESCE($13, skills)
          WHERE user_id = $14
        `,
        [
          req.body.name || null,
          req.body.phone || null,
          req.body.city || null,
          req.body.branch || null,
          req.body.graduationYear ? Number(req.body.graduationYear) : null,
          req.body.cgpa !== undefined ? Number(req.body.cgpa) : null,
          req.body.rollNumber || null,
          req.body.headline || null,
          req.body.about || null,
          req.body.preferences?.locations || null,
          req.body.preferences?.domains || null,
          req.body.preferences?.expectedSalary || null,
          Array.isArray(req.body.skills) ? req.body.skills : null,
          req.user.id,
        ],
      );

      return loadStudentProfile(req.user.id, client);
    });

    const documentsResult = await query(
      "SELECT doc_type FROM documents WHERE student_id = $1",
      [updatedProfile.id],
    );

    return res.json(
      mapStudentProfile(updatedProfile, {
        profileCompleteness: computeProfileCompleteness(updatedProfile, documentsResult.rows),
      }),
    );
  } catch (error) {
    return next(error);
  }
}

async function updateSkills(req, res, next) {
  try {
    const skills = Array.isArray(req.body.skills) ? req.body.skills : [];
    const { rows } = await query(
      "UPDATE student_profiles SET skills = $1 WHERE user_id = $2 RETURNING skills",
      [skills, req.user.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Student profile not found" });
    res.json({ skills: rows[0].skills });
  } catch (error) {
    next(error);
  }
}

async function addWorkExperience(req, res, next) {
  try {
    const { rows: profileRows } = await query(
      "SELECT id FROM student_profiles WHERE user_id = $1",
      [req.user.id],
    );
    const studentId = profileRows[0]?.id;
    if (!studentId) return res.status(404).json({ error: "Student profile not found" });

    const { company, role, startDate, endDate, isCurrent, description } = req.body;
    const { rows } = await query(
      `INSERT INTO work_experiences (student_id, company, role, start_date, end_date, is_current, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [studentId, company, role, startDate, endDate || null, Boolean(isCurrent), description || null],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
}

async function updateWorkExperience(req, res, next) {
  try {
    const { rows: profileRows } = await query(
      "SELECT id FROM student_profiles WHERE user_id = $1",
      [req.user.id],
    );
    const studentId = profileRows[0]?.id;
    if (!studentId) return res.status(404).json({ error: "Student profile not found" });

    const { company, role, startDate, endDate, isCurrent, description } = req.body;
    const { rows } = await query(
      `UPDATE work_experiences
       SET company = COALESCE($1, company),
           role = COALESCE($2, role),
           start_date = COALESCE($3, start_date),
           end_date = $4,
           is_current = COALESCE($5, is_current),
           description = COALESCE($6, description)
       WHERE id = $7 AND student_id = $8
       RETURNING *`,
      [company || null, role || null, startDate || null, endDate || null,
       isCurrent !== undefined ? Boolean(isCurrent) : null,
       description || null, req.params.id, studentId],
    );
    if (!rows[0]) return res.status(404).json({ error: "Work experience not found" });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

async function deleteWorkExperience(req, res, next) {
  try {
    const { rows: profileRows } = await query(
      "SELECT id FROM student_profiles WHERE user_id = $1",
      [req.user.id],
    );
    const studentId = profileRows[0]?.id;
    if (!studentId) return res.status(404).json({ error: "Student profile not found" });

    const { rows } = await query(
      "DELETE FROM work_experiences WHERE id = $1 AND student_id = $2 RETURNING id",
      [req.params.id, studentId],
    );
    if (!rows[0]) return res.status(404).json({ error: "Work experience not found" });
    res.json({ id: rows[0].id, deleted: true });
  } catch (error) {
    next(error);
  }
}

async function addCertification(req, res, next) {
  try {
    const { rows: profileRows } = await query(
      "SELECT id FROM student_profiles WHERE user_id = $1",
      [req.user.id],
    );
    const studentId = profileRows[0]?.id;
    if (!studentId) return res.status(404).json({ error: "Student profile not found" });

    const { name, issuer, issuedDate, certUrl } = req.body;
    const { rows } = await query(
      `INSERT INTO certifications (student_id, name, issuer, issued_date, cert_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [studentId, name, issuer || null, issuedDate || null, certUrl || null],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
}

async function updateCertification(req, res, next) {
  try {
    const { rows: profileRows } = await query(
      "SELECT id FROM student_profiles WHERE user_id = $1",
      [req.user.id],
    );
    const studentId = profileRows[0]?.id;
    if (!studentId) return res.status(404).json({ error: "Student profile not found" });

    const { name, issuer, issuedDate, certUrl } = req.body;
    const { rows } = await query(
      `UPDATE certifications
       SET name = COALESCE($1, name),
           issuer = COALESCE($2, issuer),
           issued_date = COALESCE($3, issued_date),
           cert_url = COALESCE($4, cert_url)
       WHERE id = $5 AND student_id = $6
       RETURNING *`,
      [name || null, issuer || null, issuedDate || null, certUrl || null, req.params.id, studentId],
    );
    if (!rows[0]) return res.status(404).json({ error: "Certification not found" });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

async function deleteCertification(req, res, next) {
  try {
    const { rows: profileRows } = await query(
      "SELECT id FROM student_profiles WHERE user_id = $1",
      [req.user.id],
    );
    const studentId = profileRows[0]?.id;
    if (!studentId) return res.status(404).json({ error: "Student profile not found" });

    const { rows } = await query(
      "DELETE FROM certifications WHERE id = $1 AND student_id = $2 RETURNING id",
      [req.params.id, studentId],
    );
    if (!rows[0]) return res.status(404).json({ error: "Certification not found" });
    res.json({ id: rows[0].id, deleted: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  updateSkills,
  addWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
  addCertification,
  updateCertification,
  deleteCertification,
};
