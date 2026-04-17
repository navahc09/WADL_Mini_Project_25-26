const { query, withTransaction } = require("../db");
const { createAuditLog } = require("../services/audit.service");

const OUTREACH_STATUSES = ["not_started", "in_progress", "jd_received", "approved", "drive_scheduled", "completed", "dropped"];
const EVENT_TYPES = ["outreach_initiated", "jd_received", "approval_pending", "drive_scheduled", "drive_completed", "result_published", "follow_up", "contract_signed", "dropped", "note"];
const CONTACT_MODES = ["email", "call", "visit", "whatsapp", "meeting"];

function mapCompanyRow(row, extras = {}) {
  const lastContact = row.last_contacted_at ? new Date(row.last_contacted_at) : null;
  const nextFollowup = row.next_followup_at ? new Date(row.next_followup_at) : null;
  const now = new Date();
  const slaMs = (row.sla_days || 7) * 24 * 60 * 60 * 1000;

  let slaStatus = "ok";
  if (lastContact) {
    const msSinceContact = now - lastContact;
    if (msSinceContact > slaMs) slaStatus = "overdue";
    else if (msSinceContact > slaMs * 0.75) slaStatus = "due_soon";
  } else if (row.outreach_status !== "not_started") {
    slaStatus = "overdue";
  }

  return {
    id: row.id,
    name: row.name,
    sector: row.sector || null,
    website: row.website || null,
    outreachStatus: row.outreach_status || "not_started",
    slaDays: row.sla_days || 7,
    slaStatus,
    lastContactedAt: row.last_contacted_at || null,
    nextFollowupAt: row.next_followup_at || null,
    assignedCoordinator: row.assigned_coordinator_name || null,
    assignedCoordinatorId: row.assigned_coordinator || null,
    notes: row.notes || null,
    jobCount: Number(row.job_count || 0),
    openJobCount: Number(row.open_job_count || 0),
    ...extras,
  };
}

async function listCompanies(req, res, next) {
  try {
    const search = req.query.search || "";
    const status = req.query.status || "";

    const { rows } = await query(
      `SELECT c.*,
              u.display_name AS assigned_coordinator_name,
              COUNT(j.id)::int AS job_count,
              COUNT(j.id) FILTER (WHERE j.status = 'open')::int AS open_job_count
       FROM companies c
       LEFT JOIN users u ON u.id = c.assigned_coordinator
       LEFT JOIN jobs j ON j.company_id = c.id
       WHERE ($1 = '' OR LOWER(c.name) LIKE LOWER('%' || $1 || '%'))
         AND ($2 = '' OR c.outreach_status = $2)
       GROUP BY c.id, u.display_name
       ORDER BY
         CASE c.outreach_status
           WHEN 'in_progress' THEN 0
           WHEN 'jd_received' THEN 1
           WHEN 'approved' THEN 2
           WHEN 'drive_scheduled' THEN 3
           ELSE 4
         END, c.name`,
      [search, status],
    );

    res.json(rows.map((r) => mapCompanyRow(r)));
  } catch (err) {
    next(err);
  }
}

async function getCompany(req, res, next) {
  try {
    const { id } = req.params;

    const [companyResult, timelineResult, contactsResult, jobsResult] = await Promise.all([
      query(
        `SELECT c.*, u.display_name AS assigned_coordinator_name
         FROM companies c
         LEFT JOIN users u ON u.id = c.assigned_coordinator
         WHERE c.id = $1`,
        [id],
      ),
      query(
        `SELECT cte.*, u.display_name AS created_by_name
         FROM company_timeline_events cte
         LEFT JOIN users u ON u.id = cte.created_by
         WHERE cte.company_id = $1
         ORDER BY cte.occurred_at DESC`,
        [id],
      ),
      query(
        `SELECT cc.*, u.display_name AS contacted_by_name
         FROM company_contacts cc
         LEFT JOIN users u ON u.id = cc.contacted_by
         WHERE cc.company_id = $1
         ORDER BY cc.contacted_at DESC
         LIMIT 20`,
        [id],
      ),
      query(
        `SELECT j.id, j.title, j.status, j.application_deadline,
                COUNT(a.id)::int AS applicant_count
         FROM jobs j
         LEFT JOIN applications a ON a.job_id = j.id
         WHERE j.company_id = $1
         GROUP BY j.id
         ORDER BY j.created_at DESC`,
        [id],
      ),
    ]);

    const company = companyResult.rows[0];
    if (!company) return res.status(404).json({ error: "Company not found" });

    res.json({
      ...mapCompanyRow(company),
      timeline: timelineResult.rows,
      contacts: contactsResult.rows,
      jobs: jobsResult.rows,
    });
  } catch (err) {
    next(err);
  }
}

async function updateCompany(req, res, next) {
  try {
    const { id } = req.params;
    const { outreachStatus, slaDays, nextFollowupAt, assignedCoordinator, notes, sector, website } = req.body;

    if (outreachStatus && !OUTREACH_STATUSES.includes(outreachStatus)) {
      return res.status(400).json({ error: "Invalid outreach status" });
    }

    const { rows } = await query(
      `UPDATE companies SET
         outreach_status     = COALESCE($1, outreach_status),
         sla_days            = COALESCE($2, sla_days),
         next_followup_at    = COALESCE($3, next_followup_at),
         assigned_coordinator = COALESCE($4, assigned_coordinator),
         notes               = COALESCE($5, notes),
         sector              = COALESCE($6, sector),
         website             = COALESCE($7, website)
       WHERE id = $8
       RETURNING *`,
      [
        outreachStatus || null,
        slaDays ? Number(slaDays) : null,
        nextFollowupAt || null,
        assignedCoordinator || null,
        notes !== undefined ? notes : null,
        sector || null,
        website || null,
        id,
      ],
    );

    if (!rows[0]) return res.status(404).json({ error: "Company not found" });

    await createAuditLog({
      entityType: "company",
      entityId: id,
      action: "company_updated",
      changedBy: req.user.id,
      newValue: { outreachStatus, slaDays, nextFollowupAt },
      ip: req.ip,
    });

    res.json(mapCompanyRow(rows[0]));
  } catch (err) {
    next(err);
  }
}

async function addTimelineEvent(req, res, next) {
  try {
    const { id } = req.params;
    const { eventType, notes, occurredAt, eventData } = req.body;

    if (!EVENT_TYPES.includes(eventType)) {
      return res.status(400).json({ error: `Invalid event type. Use one of: ${EVENT_TYPES.join(", ")}` });
    }

    const result = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO company_timeline_events (company_id, event_type, notes, event_data, created_by, occurred_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6)
         RETURNING *`,
        [
          id,
          eventType,
          notes || null,
          JSON.stringify(eventData || {}),
          req.user.id,
          occurredAt || new Date().toISOString(),
        ],
      );

      // Auto-update company outreach_status from event milestones
      const statusMap = {
        outreach_initiated: "in_progress",
        jd_received: "jd_received",
        approval_pending: "in_progress",
        drive_scheduled: "drive_scheduled",
        drive_completed: "drive_scheduled",
        result_published: "completed",
        dropped: "dropped",
      };
      if (statusMap[eventType]) {
        await client.query(
          "UPDATE companies SET outreach_status = $1 WHERE id = $2",
          [statusMap[eventType], id],
        );
      }

      return rows[0];
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function addContactLog(req, res, next) {
  try {
    const { id } = req.params;
    const { mode, subject, notes, contactedAt } = req.body;

    if (!CONTACT_MODES.includes(mode)) {
      return res.status(400).json({ error: `Invalid mode. Use: ${CONTACT_MODES.join(", ")}` });
    }

    const { rows } = await withTransaction(async (client) => {
      const result = await client.query(
        `INSERT INTO company_contacts (company_id, contacted_by, mode, subject, notes, contacted_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, req.user.id, mode, subject || null, notes || null, contactedAt || new Date().toISOString()],
      );

      // Update last_contacted_at on the company
      await client.query(
        "UPDATE companies SET last_contacted_at = $1 WHERE id = $2",
        [contactedAt || new Date().toISOString(), id],
      );

      return result;
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function createCompany(req, res, next) {
  try {
    const { name, sector, website } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Company name is required" });

    const { rows } = await query(
      `INSERT INTO companies (name, sector, website)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET sector = COALESCE(EXCLUDED.sector, companies.sector)
       RETURNING *`,
      [name.trim(), sector || null, website || null],
    );

    res.status(201).json(mapCompanyRow(rows[0]));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCompanies,
  getCompany,
  updateCompany,
  addTimelineEvent,
  addContactLog,
  createCompany,
};
