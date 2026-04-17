const { query } = require("../db");

async function createAuditLog({ entityType, entityId, action, changedBy, oldValue, newValue, reason, ip }) {
  try {
    await query(
      `INSERT INTO audit_logs (entity_type, entity_id, action, changed_by, old_value, new_value, reason, ip_address)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8)`,
      [
        entityType,
        entityId,
        action,
        changedBy || null,
        oldValue != null ? JSON.stringify(oldValue) : null,
        newValue != null ? JSON.stringify(newValue) : null,
        reason || null,
        ip || null,
      ],
    );
  } catch (err) {
    console.error("[Audit Log Error]", err.message);
  }
}

async function getAuditLogs({ entityType, entityId, limit = 50 }) {
  const conditions = [];
  const params = [];

  if (entityType) { params.push(entityType); conditions.push(`al.entity_type = $${params.length}`); }
  if (entityId) { params.push(entityId); conditions.push(`al.entity_id = $${params.length}`); }

  params.push(limit);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await query(
    `SELECT al.id, al.entity_type, al.entity_id, al.action, al.old_value, al.new_value,
            al.reason, al.changed_at,
            u.display_name AS changed_by_name, u.email AS changed_by_email
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.changed_by
     ${where}
     ORDER BY al.changed_at DESC
     LIMIT $${params.length}`,
    params,
  );
  return rows;
}

module.exports = { createAuditLog, getAuditLogs };
