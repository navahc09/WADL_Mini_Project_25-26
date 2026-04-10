const { query } = require("../db");
const { formatRelative } = require("../services/presentation.service");

async function listNotifications(req, res, next) {
  try {
    const { rows } = await query(
      `
        SELECT *
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
      [req.user.id],
    );

    res.json(
      rows.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.message,
        read: row.is_read,
        createdAt: formatRelative(row.created_at),
        type: row.type,
        metadata: row.metadata,
      })),
    );
  } catch (error) {
    next(error);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const { rows } = await query(
      "SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE",
      [req.user.id],
    );
    res.json({ count: rows[0]?.count || 0 });
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { rows } = await query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id],
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ id: rows[0].id, read: true });
  } catch (error) {
    next(error);
  }
}

async function markAllRead(req, res, next) {
  try {
    const { rowCount } = await query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE",
      [req.user.id],
    );
    res.json({ updated: rowCount });
  } catch (error) {
    next(error);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const { rows } = await query(
      "DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id],
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ id: rows[0].id, deleted: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  deleteNotification,
};
