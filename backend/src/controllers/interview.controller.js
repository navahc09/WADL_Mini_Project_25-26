const { query, withTransaction } = require("../db");
const { formatDateTimeLabel } = require("../services/presentation.service");
const { sendEmail } = require("../services/email.service");

function mapRoundType(value) {
  const labels = {
    aptitude: "Aptitude Test",
    technical: "Technical Interview",
    hr: "HR Interview",
    group_discussion: "Group Discussion",
    final: "Final Round",
  };
  return labels[String(value).toLowerCase()] || value;
}

function mapRoundResult(value) {
  if (value === "pass") return "Pass";
  if (value === "fail") return "Fail";
  return "Pending";
}

function mapRound(row) {
  return {
    id: row.id,
    applicationId: row.application_id,
    roundType: row.round_type,
    roundTypeLabel: mapRoundType(row.round_type),
    scheduledAt: row.scheduled_at,
    scheduledAtLabel: formatDateTimeLabel(row.scheduled_at),
    result: row.result,
    resultLabel: mapRoundResult(row.result),
    venue: row.venue || null,
    notes: row.notes || null,
    createdAt: row.created_at,
  };
}

async function listRounds(req, res, next) {
  try {
    const { appId } = req.params;

    const { rows } = await query(
      `SELECT ir.*
       FROM interview_rounds ir
       JOIN applications a ON a.id = ir.application_id
       WHERE ir.application_id = $1
       ORDER BY ir.scheduled_at ASC`,
      [appId],
    );

    res.json(rows.map(mapRound));
  } catch (error) {
    next(error);
  }
}

async function scheduleRound(req, res, next) {
  try {
    const { appId } = req.params;
    const { roundType, scheduledAt, venue, notes } = req.body;

    const result = await withTransaction(async (client) => {
      // Validate application exists
      const appResult = await client.query(
        `SELECT a.id, a.student_id, sp.user_id, u.email,
                sp.full_name, j.title, c.name AS company_name
         FROM applications a
         JOIN student_profiles sp ON sp.id = a.student_id
         JOIN users u ON u.id = sp.user_id
         JOIN jobs j ON j.id = a.job_id
         JOIN companies c ON c.id = j.company_id
         WHERE a.id = $1`,
        [appId],
      );

      const app = appResult.rows[0];
      if (!app) {
        const error = new Error("Application not found");
        error.statusCode = 404;
        throw error;
      }

      // Insert the round
      const roundResult = await client.query(
        `INSERT INTO interview_rounds (application_id, round_type, scheduled_at, venue, notes, result)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING *`,
        [appId, roundType, scheduledAt, venue || null, notes || null],
      );

      // Update application status to interview_scheduled
      await client.query(
        "UPDATE applications SET status = 'interview_scheduled', updated_at = NOW() WHERE id = $1",
        [appId],
      );

      // Notify the student
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, metadata)
         VALUES ($1, $2, $3, 'interview_scheduled', $4::jsonb)`,
        [
          app.user_id,
          "Interview scheduled",
          `Your ${mapRoundType(roundType)} for ${app.title} at ${app.company_name} is scheduled for ${formatDateTimeLabel(scheduledAt)}.`,
          JSON.stringify({ application_id: appId, round_type: roundType }),
        ],
      );

      return {
        round: roundResult.rows[0],
        studentEmail: app.email,
        studentName: app.full_name,
        jobTitle: app.title,
        companyName: app.company_name,
      };
    });

    // Send email notification
    await sendEmail({
      to: result.studentEmail,
      subject: `Interview scheduled: ${result.companyName} — ${result.jobTitle}`,
      text: `Hello ${result.studentName}, your ${mapRoundType(req.body.roundType)} for ${result.jobTitle} at ${result.companyName} is scheduled for ${formatDateTimeLabel(req.body.scheduledAt)}. ${req.body.venue ? `Venue: ${req.body.venue}` : ""} ${req.body.notes ? `Notes: ${req.body.notes}` : ""}`,
    });

    res.status(201).json(mapRound(result.round));
  } catch (error) {
    next(error);
  }
}

async function updateRoundResult(req, res, next) {
  try {
    const { appId, roundId } = req.params;
    const { result, notes } = req.body;

    const updated = await withTransaction(async (client) => {
      const roundResult = await client.query(
        `UPDATE interview_rounds
         SET result = $1, notes = COALESCE($2, notes)
         WHERE id = $3 AND application_id = $4
         RETURNING *`,
        [result, notes || null, roundId, appId],
      );

      const round = roundResult.rows[0];
      if (!round) {
        const error = new Error("Interview round not found");
        error.statusCode = 404;
        throw error;
      }

      // Check if all rounds are completed (no pending rounds left)
      const pendingResult = await client.query(
        "SELECT COUNT(*)::int AS count FROM interview_rounds WHERE application_id = $1 AND result = 'pending'",
        [appId],
      );

      const hasPending = pendingResult.rows[0]?.count > 0;
      const allFailed = result === "fail";

      // Advance application status based on round result
      if (allFailed) {
        await client.query(
          "UPDATE applications SET status = 'rejected', updated_at = NOW() WHERE id = $1",
          [appId],
        );
      } else if (!hasPending) {
        await client.query(
          "UPDATE applications SET status = 'interview_completed', updated_at = NOW() WHERE id = $1",
          [appId],
        );
      }

      return round;
    });

    res.json(mapRound(updated));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listRounds,
  scheduleRound,
  updateRoundResult,
};
