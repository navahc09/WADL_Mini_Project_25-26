const cron = require("node-cron");
const { query } = require("../db");
const { checkEligibility } = require("../services/criteriaEngine.service");
const { mapStudentProfile } = require("../services/presentation.service");
const { sendEmail } = require("../services/email.service");

let started = false;

async function runDeadlineReminderJob() {
  const { rows: jobs } = await query(
    `
      SELECT j.*, c.name AS company_name
      FROM jobs j
      JOIN companies c ON c.id = j.company_id
      WHERE j.status = 'open'
        AND j.application_deadline::date = (CURRENT_DATE + INTERVAL '1 day')::date
    `,
  );

  for (const job of jobs) {
    const { rows: students } = await query(
      `
        SELECT
          sp.*,
          u.id AS user_id,
          u.email
        FROM student_profiles sp
        JOIN users u ON u.id = sp.user_id
        WHERE u.is_active = TRUE
          AND sp.cgpa >= $1
          AND sp.active_backlogs <= $2
          AND ($3::int IS NULL OR sp.graduation_year = $3)
          AND NOT EXISTS (
            SELECT 1
            FROM applications a
            WHERE a.job_id = $4
              AND a.student_id = sp.id
          )
      `,
      [job.min_cgpa, job.max_active_backlogs, job.graduation_year, job.id],
    );

    for (const studentRow of students) {
      const student = mapStudentProfile(studentRow);
      const eligibility = checkEligibility(student, job);

      if (!eligibility.eligible) {
        continue;
      }

      await query(
        `
          INSERT INTO notifications (user_id, title, message, type, metadata)
          VALUES ($1, $2, $3, 'deadline_reminder', $4::jsonb)
        `,
        [
          studentRow.user_id,
          "Application deadline tomorrow",
          `${job.company_name} - ${job.title} closes tomorrow. Submit your application if you're interested.`,
          JSON.stringify({ job_id: job.id }),
        ],
      );

      await sendEmail({
        to: studentRow.email,
        subject: `Reminder: ${job.company_name} application closes tomorrow`,
        text: `Hello ${student.name}, ${job.company_name} - ${job.title} closes tomorrow. Log in to TNP Connect to apply.`,
      });
    }
  }
}

function startCronJobs() {
  if (started || process.env.DISABLE_CRON === "true") {
    return;
  }

  cron.schedule("0 9 * * *", () => {
    runDeadlineReminderJob().catch((error) => {
      console.error("[cron] deadline reminder job failed", error);
    });
  }, { timezone: "Asia/Kolkata" });

  started = true;
}

module.exports = {
  runDeadlineReminderJob,
  startCronJobs,
};
