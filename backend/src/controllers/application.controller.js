const { query } = require("../db");
const { createApplication } = require("../services/application.service");
const { mapApplicationRow } = require("../services/presentation.service");


async function listApplications(req, res, next) {
  try {
    const status = req.query.status && req.query.status !== "all" ? req.query.status : null;

    const { rows: profileRows } = await query(
      "SELECT id FROM student_profiles WHERE user_id = $1",
      [req.user.id],
    );

    const profile = profileRows[0];
    if (!profile) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    const params = [profile.id];
    const conditions = ["a.student_id = $1"];

    if (status) {
      params.push(status === "offer" ? "offered" : status);
      if (status === "interview") {
        params[1] = ["interview_scheduled", "interview_completed"];
        conditions.push("a.status = ANY($2)");
      } else if (status === "offer") {
        params[1] = ["offered", "accepted"];
        conditions.push("a.status = ANY($2)");
      } else {
        conditions.push("a.status = $2");
      }
    }

    const { rows } = await query(
      `
        SELECT
          a.*,
          j.title,
          j.salary_label,
          j.salary_lpa,
          j.application_deadline,
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
        WHERE ${conditions.join(" AND ")}
        GROUP BY a.id, j.title, j.salary_label, j.salary_lpa, j.application_deadline, c.name
        ORDER BY a.applied_at DESC
      `,
      params,
    );

    res.json(rows.map(mapApplicationRow));
  } catch (error) {
    next(error);
  }
}

async function applyToJob(req, res, next) {
  try {
    const application = await createApplication(
      req.user.id,
      req.body.jobId,
      req.body.documentId || null,
    );
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
}

async function getApplication(req, res, next) {
  try {
    const { rows: profileRows } = await query(
      "SELECT id FROM student_profiles WHERE user_id = $1",
      [req.user.id],
    );
    const profile = profileRows[0];
    if (!profile) return res.status(404).json({ error: "Student profile not found" });

    const { rows } = await query(
      `
        SELECT
          a.*,
          j.title,
          j.salary_label,
          j.salary_lpa,
          j.application_deadline,
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
        WHERE a.id = $1 AND a.student_id = $2
        GROUP BY a.id, j.title, j.salary_label, j.salary_lpa, j.application_deadline, c.name
      `,
      [req.params.id, profile.id],
    );

    if (!rows[0]) return res.status(404).json({ error: "Application not found" });
    res.json(mapApplicationRow(rows[0]));
  } catch (error) {
    next(error);
  }
}

async function changeResume(req, res, next) {
  try {
    const { id } = req.params;
    const { documentId } = req.body;

    // Load application + job deadline (ownership check via student_profiles)
    const { rows: appRows } = await query(
      `SELECT a.id, a.student_id, a.snapshot_data,
              j.application_deadline,
              sp.user_id
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN student_profiles sp ON sp.id = a.student_id
       WHERE a.id = $1`,
      [id],
    );

    const app = appRows[0];
    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.user_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Enforce deadline lock
    const deadline = new Date(app.application_deadline);
    if (deadline < new Date()) {
      return res.status(403).json({ error: "Deadline has passed — resume is locked for this application." });
    }

    // Load the chosen resume document (must belong to this student)
    const { rows: docRows } = await query(
      `SELECT d.s3_key, d.file_name
       FROM documents d
       JOIN student_profiles sp ON sp.id = d.student_id
       WHERE d.id = $1 AND sp.user_id = $2 AND d.doc_type = 'resume'`,
      [documentId, req.user.id],
    );

    const doc = docRows[0];
    if (!doc) {
      return res.status(404).json({ error: "Resume document not found or not owned by you" });
    }

    // Generate fresh signed URL for the chosen resume
    const { generateSignedUrl } = require("../services/s3.service");
    let resumeUrl = null;
    try {
      resumeUrl = await generateSignedUrl(doc.s3_key, 3600 * 24 * 30);
    } catch (signError) {
      console.warn("[changeResume] signed URL failed:", signError.message);
    }

    // Patch the snapshot resume_url
    const updatedSnapshot = {
      ...(app.snapshot_data || {}),
      resume_url: resumeUrl,
      resume_file_name: doc.file_name,
    };

    await query(
      "UPDATE applications SET snapshot_data = $1::jsonb, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(updatedSnapshot), id],
    );

    res.json({ id, resumeUpdated: true, resumeFileName: doc.file_name });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listApplications,
  getApplication,
  applyToJob,
  changeResume,
};
