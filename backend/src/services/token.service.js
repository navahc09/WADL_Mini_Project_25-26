const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function createAccessToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || "local-dev-secret",
    { expiresIn: "2h" },
  );
}

function createRefreshToken(user) {
  return jwt.sign(
    { userId: user.id, tokenId: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET || "local-dev-refresh-secret",
    { expiresIn: "7d" },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || "local-dev-secret");
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || "local-dev-refresh-secret");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getRefreshTokenExpiry(token) {
  const decoded = verifyRefreshToken(token);
  return new Date(decoded.exp * 1000);
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
};
