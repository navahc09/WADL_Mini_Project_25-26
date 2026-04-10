const { query } = require("../db");
const { verifyAccessToken } = require("../services/token.service");

function sanitizeUser(row) {
  return {
    id: row.id,
    name: row.display_name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    emailVerified: row.email_verified,
  };
}

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication token missing" });
  }

  try {
    const decoded = verifyAccessToken(token);
    const { rows } = await query(
      `
        SELECT id, display_name, email, role, is_active, email_verified
        FROM users
        WHERE id = $1
      `,
      [decoded.userId],
    );

    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: "Account is not active" });
    }

    req.user = sanitizeUser(user);
    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid or expired access token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    return next();
  };
}

module.exports = {
  authenticate,
  requireRole,
};
