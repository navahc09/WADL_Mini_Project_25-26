const { withTransaction } = require("../db");
const { checkEligibility, computeMatchScore } = require("./criteriaEngine.service");
const { generateSignedUrl } = require("./s3.service");
const { sendEmail } = require("./email.service");

async function createApplication(studentUserId, jobId, documentId = null) {
  const result = await withTransaction(async (client) => {
    const profileResult = await client.query(
      `
        SELECT
          sp.*,
          u.id AS user_id,
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
        GROUP BY sp.id, u.id, u.email
      `,
      [studentUserId],
    );

    const profile = profileResult.rows[0];
    if (!profile) {
      const error = new Error("Student profile not found");
      error.statusCode = 404;
      throw error;
    }

    const jobResult = await client.query(
      `
        SELECT
          j.*,
          c.name AS company_name
        FROM jobs j
        JOIN companies c ON c.id = j.company_id
        WHERE j.id = $1
          AND j.status = 'open'
      `,
      [jobId],
    );

    const job = jobResult.rows[0];
    if (!job) {
      const error = new Error("Job not found");
      error.statusCode = 404;
      throw error;
    }

    const existingResult = await client.query(
      "SELECT id FROM applications WHERE job_id = $1 AND student_id = $2",
      [jobId, profile.id],
    );

    if (existingResult.rows[0]) {
      const error = new Error("Already applied to this job");
      error.statusCode = 409;
      throw error;
    }

    const eligibility = checkEligibility(
      {
        ...profile,
        branchCode: profile.branch_code,
        graduationYear: profile.graduation_year,
        activeBacklogs: profile.active_backlogs,
      },
      {
        ...job,
        allowedBranches: job.allowed_branches,
        requiredSkills: job.required_skills,
        minCgpa: job.min_cgpa,
        maxActiveBacklogs: job.max_active_backlogs,
      },
    );

    if (!eligibility.eligible) {
      const error = new Error("Student is not eligible for this job");
      error.statusCode = 403;
      error.details = eligibility.reasons;
      throw error;
    }

    let resumeSignedUrl = null;
    let resolvedS3Key = profile.resume_s3_key;

    // If a specific resume document was chosen, use it
    if (documentId) {
      const docResult = await client.query(
        `SELECT s3_key, file_name FROM documents
         WHERE id = $1 AND student_id = $2 AND doc_type = 'resume'`,
        [documentId, profile.id],
      );
      if (docResult.rows[0]) {
        resolvedS3Key = docResult.rows[0].s3_key;
      }
    }

    if (resolvedS3Key) {
      try {
        resumeSignedUrl = await generateSignedUrl(resolvedS3Key, 3600 * 24 * 30);
      } catch (error) {
        console.warn("[application] resume signed URL unavailable:", error.message);
      }
    }

    const enrichedProfile = {
      ...profile,
      certifications: profile.certifications || [],
      workExperiences: profile.work_experiences || [],
    };

    const snapshot = {
      full_name: profile.full_name,
      email: profile.email,
      roll_number: profile.roll_number,
      branch: profile.branch,
      cgpa: Number(profile.cgpa),
      graduation_year: profile.graduation_year,
      skills: profile.skills || [],
      resume_url: resumeSignedUrl,
      tenth_percent: Number(profile.tenth_percent),
      twelfth_percent: Number(profile.twelfth_percent),
      active_backlogs: profile.active_backlogs,
      certifications: profile.certifications || [],
      work_experiences: profile.work_experiences || [],
      snapshot_created_at: new Date().toISOString(),
    };

    const matchScore = computeMatchScore(enrichedProfile, {
      ...job,
      requiredSkills: job.required_skills,
      minCgpa: job.min_cgpa,
    });

    const applicationResult = await client.query(
      `
        INSERT INTO applications (job_id, student_id, snapshot_data, match_score, status)
        VALUES ($1, $2, $3::jsonb, $4, 'applied')
        RETURNING *
      `,
      [jobId, profile.id, JSON.stringify(snapshot), matchScore],
    );

    await client.query(
      `
        INSERT INTO notifications (user_id, title, message, type, metadata)
        VALUES ($1, $2, $3, 'application_submitted', $4::jsonb)
      `,
      [
        profile.user_id,
        "Application submitted",
        `Your application for ${job.title} at ${job.company_name} has been submitted.`,
        JSON.stringify({ job_id: job.id, application_id: applicationResult.rows[0].id }),
      ],
    );

    return {
      application: applicationResult.rows[0],
      studentEmail: profile.email,
      studentName: profile.full_name,
      jobTitle: job.title,
      companyName: job.company_name,
    };
  });

  await sendEmail({
    to: result.studentEmail,
    subject: `Application submitted: ${result.companyName} - ${result.jobTitle}`,
    text: `Hello ${result.studentName}, your application for ${result.jobTitle} at ${result.companyName} has been submitted successfully.`,
  });

  return result.application;
}

module.exports = {
  createApplication,
};
