const bcrypt = require("bcryptjs");
const { query, withTransaction } = require("../db");
const {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} = require("../services/token.service");

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
    `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `,
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

async function login(req, res, next) {
  try {
    const { rows } = await query(
      `
        SELECT id, display_name, email, password_hash, role, is_active, email_verified
        FROM users
        WHERE LOWER(email) = LOWER($1)
      `,
      [req.body.email],
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
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

async function register(req, res, next) {
  try {
    const existing = await query("SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)", [req.body.email]);
    if (existing.rows[0]) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await withTransaction(async (client) => {
      const userResult = await client.query(
        `
          INSERT INTO users (display_name, email, password_hash, role, is_active, email_verified)
          VALUES ($1, $2, $3, 'student', TRUE, TRUE)
          RETURNING id, display_name, email, role, is_active, email_verified
        `,
        [req.body.fullName, req.body.email, passwordHash],
      );

      await client.query(
        `
          INSERT INTO student_profiles (
            user_id,
            full_name,
            phone,
            city,
            roll_number,
            branch,
            branch_code,
            graduation_year,
            cgpa,
            skills,
            preferred_locations,
            preferred_domains,
            expected_salary_label,
            headline,
            about,
            profile_complete
          )
          VALUES (
            $1, $2, $3, 'To be updated', $4, $5, $6, $7, $8,
            ARRAY['React', 'Node.js'],
            ARRAY['Remote'],
            ARRAY['Software Engineering'],
            'To be updated',
            'Emerging campus candidate',
            'Student profile created through the registration flow.',
            FALSE
          )
        `,
        [
          userResult.rows[0].id,
          req.body.fullName,
          req.body.phone,
          req.body.rollNumber,
          req.body.branch,
          req.body.branch
            .split(" ")
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .toUpperCase(),
          Number(req.body.graduationYear),
          Number(req.body.cgpa),
        ],
      );

      return userResult.rows[0];
    });

    return res.status(201).json(await buildAuthPayload(user));
  } catch (error) {
    return next(error);
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const tokenResult = await query(
      `
        SELECT user_id
        FROM refresh_tokens
        WHERE user_id = $1
          AND token_hash = $2
          AND expires_at > NOW()
      `,
      [decoded.userId, tokenHash],
    );

    if (!tokenResult.rows[0]) {
      return res.status(401).json({ error: "Refresh token is invalid" });
    }

    await query("DELETE FROM refresh_tokens WHERE token_hash = $1", [tokenHash]);

    const { rows } = await query(
      `
        SELECT id, display_name, email, role, is_active, email_verified
        FROM users
        WHERE id = $1
      `,
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
  register,
  refresh,
  logout,
  me,
};
