const { query } = require("../db");
const { checkEligibility } = require("../services/criteriaEngine.service");
const { mapJobRow, mapStudentProfile, parseNumber } = require("../services/presentation.service");

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

async function loadStudentProfile(userId) {
  const { rows } = await query(
    `
      SELECT
        sp.*,
        u.email
      FROM student_profiles sp
      JOIN users u ON u.id = sp.user_id
      WHERE sp.user_id = $1
    `,
    [userId],
  );

  return rows[0] || null;
}

async function fetchJobs(filters = {}, jobId = null) {
  const conditions = ["j.status = 'open'"];
  const params = [];

  if (jobId) {
    params.push(jobId);
    conditions.push(`j.id = $${params.length}`);
  }

  if (filters.query) {
    params.push(`%${filters.query}%`);
    conditions.push(
      `(j.title ILIKE $${params.length} OR c.name ILIKE $${params.length} OR array_to_string(j.tags, ' ') ILIKE $${params.length})`,
    );
  }

  if (filters.location) {
    params.push(`%${filters.location}%`);
    conditions.push(
      `(j.location ILIKE $${params.length} OR REPLACE(LOWER(j.work_mode), '_', '-') ILIKE LOWER($${params.length}))`,
    );
  }

  if (filters.type) {
    params.push(String(filters.type).replace("-", "_"));
    conditions.push(`LOWER(j.job_type) = LOWER($${params.length})`);
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
      WHERE ${conditions.join(" AND ")}
      GROUP BY j.id, c.name
      ORDER BY j.featured DESC, j.application_deadline ASC
    `,
    params,
  );

  return rows;
}

function enrichJob(row, profile) {
  const eligibility = checkEligibility(profile, {
    ...row,
    minCgpa: row.min_cgpa,
    maxActiveBacklogs: row.max_active_backlogs,
    allowedBranches: row.allowed_branches,
    requiredSkills: row.required_skills,
  });

  return mapJobRow(row, {
    eligible: eligibility.eligible,
    reasons: eligibility.reasons,
    applicantCount: row.applicant_count,
    shortlistRate:
      parseNumber(row.applicant_count) > 0
        ? parseNumber(row.shortlisted_count) / parseNumber(row.applicant_count)
        : 0,
    newApplicants: row.new_applicants,
  });
}

async function listEligibleJobs(req, res, next) {
  try {
    const profileRow = await loadStudentProfile(req.user.id);
    if (!profileRow) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    const jobs = await fetchJobs({
      query: normalize(req.query.query),
      location: normalize(req.query.location),
      type: normalize(req.query.type),
    });

    const profile = mapStudentProfile(profileRow);
    const enrichedJobs = jobs.map((row) => enrichJob(row, profile));
    const eligibleOnly = String(req.query.eligibleOnly) === "true";

    return res.json(eligibleOnly ? enrichedJobs.filter((job) => job.eligible) : enrichedJobs);
  } catch (error) {
    return next(error);
  }
}

async function getJobById(req, res, next) {
  try {
    const profileRow = await loadStudentProfile(req.user.id);
    if (!profileRow) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    const jobs = await fetchJobs({}, req.params.id);
    const job = jobs[0];

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.json(enrichJob(job, mapStudentProfile(profileRow)));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listEligibleJobs,
  getJobById,
};
