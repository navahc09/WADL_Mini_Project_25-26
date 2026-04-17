/**
 * responseLogger.middleware.js
 *
 * Patches res.json / res.send on every request so the full response body
 * (truncated for large payloads) is printed to the console alongside
 * method, route, status code, and response time.
 *
 * Usage: mount BEFORE route handlers on any router.
 *   router.use(responseLogger);
 */

const PREVIEW_LENGTH = 1200; // max chars of JSON body to print

function truncate(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max) + ` … [+${str.length - max} chars truncated]`;
}

function statusColor(code) {
  if (code >= 500) return "\x1b[31m"; // red
  if (code >= 400) return "\x1b[33m"; // yellow
  if (code >= 300) return "\x1b[36m"; // cyan
  return "\x1b[32m";                  // green
}

const RESET = "\x1b[0m";
const DIM   = "\x1b[2m";
const BOLD  = "\x1b[1m";

module.exports = function responseLogger(req, res, next) {
  const startAt = Date.now();

  // Patch res.json ────────────────────────────────────────────────────────────
  const originalJson = res.json.bind(res);
  res.json = function loggedJson(body) {
    const ms     = Date.now() - startAt;
    const code   = res.statusCode;
    const color  = statusColor(code);
    const method = req.method.padEnd(7);
    const url    = req.originalUrl || req.url;

    let bodyPreview = "";
    try {
      bodyPreview = truncate(JSON.stringify(body), PREVIEW_LENGTH);
    } catch (_) {
      bodyPreview = "[unserializable body]";
    }

    console.log(
      `${DIM}[JOB-API]${RESET} ` +
      `${BOLD}${method}${RESET} ${url} ` +
      `${color}${code}${RESET} ` +
      `${DIM}(${ms} ms)${RESET}\n` +
      `${DIM}  ↳ body: ${RESET}${bodyPreview}\n`,
    );

    return originalJson(body);
  };

  // Also capture res.status(...).json(...) chains where status is set early ──
  const originalStatus = res.status.bind(res);
  res.status = function (code) {
    res.statusCode = code;
    return originalStatus(code);
  };

  next();
};
