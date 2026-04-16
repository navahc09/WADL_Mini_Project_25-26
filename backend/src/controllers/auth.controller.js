const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { query, withTransaction } = require("../db");
const {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} = require("../services/token.service");
const { sendEmail } = require("../services/email.service");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.display_name,
    email: user.email,
    role: user.role,
    isActive: user.is_active,
    emailVerified: user.email_verified,
  };
}

async function storeRefreshToken(userId, refreshToken) {
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hashToken(refreshToken), getRefreshTokenExpiry(refreshToken)],
  );
}

async function buildAuthPayload(user) {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  await storeRefreshToken(user.id, refreshToken);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

// ── Login ─────────────────────────────────────────────────────────────────────
// Students: { enrollmentNo, password }
// Admins:   { email, password }
async function login(req, res, next) {
  try {
    let user;

    if (req.body.enrollmentNo) {
      // Student login — look up by roll_number
      const { rows } = await query(
        `SELECT u.id, u.display_name, u.email, u.password_hash, u.role,
                u.is_active, u.email_verified
         FROM users u
         JOIN student_profiles sp ON sp.user_id = u.id
         WHERE UPPER(sp.roll_number) = UPPER($1)
           AND u.role = 'student'`,
        [req.body.enrollmentNo],
      );
      user = rows[0];
    } else {
      // Admin login — look up by email
      const { rows } = await query(
        `SELECT id, display_name, email, password_hash, role, is_active, email_verified
         FROM users
         WHERE LOWER(email) = LOWER($1)
           AND role = 'admin'`,
        [req.body.email],
      );
      user = rows[0];
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: "Account is inactive. Contact the TnP office." });
    }

    // Accounts created by TnP with no password set yet have an empty hash sentinel
    if (!user.password_hash) {
      return res.status(403).json({
        error: "Password not set. Check your email for the account setup link.",
      });
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return res.json(await buildAuthPayload(user));
  } catch (error) {
    return next(error);
  }
}

// ── Setup Password (first-time, via emailed link) ─────────────────────────────
async function setupPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const tokenHash = hashToken(token);

    const { rows } = await query(
      `SELECT user_id FROM password_reset_tokens
       WHERE token_hash = $1
         AND type = 'setup'
         AND expires_at > NOW()
         AND used_at IS NULL`,
      [tokenHash],
    );

    if (!rows[0]) {
      return res.status(400).json({ error: "Setup link is invalid or has expired." });
    }

    const userId = rows[0].user_id;
    const passwordHash = await bcrypt.hash(password, 10);

    await withTransaction(async (client) => {
      await client.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
        passwordHash,
        userId,
      ]);
      await client.query(
        "UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1",
        [tokenHash],
      );
    });

    return res.json({ message: "Password set successfully. You can now log in." });
  } catch (error) {
    return next(error);
  }
}

// ── Reset Password (via emailed link sent by TnP) ────────────────────────────
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const tokenHash = hashToken(token);

    const { rows } = await query(
      `SELECT user_id FROM password_reset_tokens
       WHERE token_hash = $1
         AND type = 'reset'
         AND expires_at > NOW()
         AND used_at IS NULL`,
      [tokenHash],
    );

    if (!rows[0]) {
      return res.status(400).json({ error: "Reset link is invalid or has expired." });
    }

    const userId = rows[0].user_id;
    const passwordHash = await bcrypt.hash(password, 10);

    await withTransaction(async (client) => {
      await client.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
        passwordHash,
        userId,
      ]);
      await client.query(
        "UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1",
        [tokenHash],
      );
    });

    return res.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    return next(error);
  }
}

// ── Helpers used by admin controller ─────────────────────────────────────────
async function generateAndStoreToken(userId, type) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  // Invalidate any previous unused tokens of the same type for this user
  await query(
    `DELETE FROM password_reset_tokens
     WHERE user_id = $1 AND type = $2 AND used_at IS NULL`,
    [userId, type],
  );

  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, type, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, tokenHash, type, expiresAt],
  );

  return rawToken;
}

async function sendSetupEmail(email, name, token) {
  const link = `${FRONTEND_URL}/setup-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "TNP Connect – Set up your account password",
    text: `Hello ${name},\n\nYour TNP Connect account has been created. Please set your password using the link below (valid for 24 hours):\n\n${link}\n\nIf you did not expect this email, please contact the TnP office.`,
    html: `<p>Hello <strong>${name}</strong>,</p>
<p>Your TNP Connect account has been created by the Training &amp; Placement office.</p>
<p>Please set your password by clicking the link below (valid for 24 hours):</p>
<p><a href="${link}">${link}</a></p>
<p>Your login ID is your <strong>Enrollment Number</strong>.</p>
<p>If you did not expect this email, please contact the TnP office.</p>`,
  });
}

async function sendResetEmail(email, name, token) {
  const link = `${FRONTEND_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "TNP Connect – Password reset link",
    text: `Hello ${name},\n\nA password reset was requested for your TNP Connect account. Use the link below (valid for 24 hours):\n\n${link}\n\nIf you did not request this, please ignore this email.`,
    html: `<p>Hello <strong>${name}</strong>,</p>
<p>A password reset was requested for your TNP Connect account by the Training &amp; Placement office.</p>
<p>Click the link below to set a new password (valid for 24 hours):</p>
<p><a href="${link}">${link}</a></p>
<p>If you did not request this, please ignore this email.</p>`,
  });
}

// ── Refresh / Logout / Me ─────────────────────────────────────────────────────
async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const tokenResult = await query(
      `SELECT user_id FROM refresh_tokens
       WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW()`,
      [decoded.userId, tokenHash],
    );

    if (!tokenResult.rows[0]) {
      return res.status(401).json({ error: "Refresh token is invalid" });
    }

    await query("DELETE FROM refresh_tokens WHERE token_hash = $1", [tokenHash]);

    const { rows } = await query(
      `SELECT id, display_name, email, role, is_active, email_verified
       FROM users WHERE id = $1`,
      [decoded.userId],
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    return res.json(await buildAuthPayload(user));
  } catch (_error) {
    return res.status(401).json({ error: "Refresh token expired or invalid" });
  }
}

async function logout(req, res, next) {
  try {
    if (req.body?.refreshToken) {
      await query("DELETE FROM refresh_tokens WHERE token_hash = $1", [
        hashToken(req.body.refreshToken),
      ]);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

function me(req, res) {
  res.json({ user: req.user });
}

module.exports = {
  login,
  setupPassword,
  resetPassword,
  refresh,
  logout,
  me,
  // exported for use by admin controller
  generateAndStoreToken,
  sendSetupEmail,
  sendResetEmail,
};
