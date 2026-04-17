/**
 * bulk-import.service.js
 *
 * Handles parsing, validation, duplicate detection, and insertion of
 * students imported from .xlsx or .csv files.
 */

const ExcelJS = require("exceljs");
const { query, withTransaction } = require("../db");
const bcrypt = require("bcryptjs");

// ── Known DB field descriptors ────────────────────────────────────────────────
const DB_FIELDS = [
  { key: "fullName",       label: "Full Name",        required: true  },
  { key: "email",          label: "Email",             required: true  },
  { key: "enrollmentNo",   label: "Enrollment No.",   required: true  },
  { key: "phone",          label: "Phone",             required: false },
  { key: "branch",         label: "Branch",            required: true  },
  { key: "graduationYear", label: "Graduation Year",  required: true  },
  { key: "cgpa",           label: "CGPA",             required: true  },
  { key: "gender",         label: "Gender",            required: false },
  { key: "city",           label: "City",              required: false },
  { key: "tenthPercent",   label: "10th %",            required: false },
  { key: "twelfthPercent", label: "12th %",            required: false },
  { key: "dateOfBirth",    label: "Date of Birth",     required: false },
];

// ── Auto-mapping heuristics (header → DB field key) ──────────────────────────
const AUTO_MAP = {
  "full name": "fullName",  name: "fullName",    "student name": "fullName",
  "student's name": "fullName",
  email: "email",          "email address": "email",    "e-mail": "email",
  "enrollment no": "enrollmentNo", "enrollment number": "enrollmentNo",
  "roll number": "enrollmentNo",   "roll no": "enrollmentNo",
  "enrollment no.": "enrollmentNo", "rollno": "enrollmentNo",
  phone: "phone",          mobile: "phone",      "phone number": "phone",
  branch: "branch",        department: "branch", "branch name": "branch",
  "graduation year": "graduationYear", year: "graduationYear",
  "grad year": "graduationYear",    "passing year": "graduationYear",
  cgpa: "cgpa",            cpi: "cgpa",          gpa: "cgpa",
  gender: "gender",        sex: "gender",
  city: "city",            location: "city",
  "10th %": "tenthPercent",   "10th percent": "tenthPercent", "tenth %": "tenthPercent",
  "ssc %": "tenthPercent",   ssc: "tenthPercent",
  "12th %": "twelfthPercent", "12th percent": "twelfthPercent", "twelfth %": "twelfthPercent",
  "hsc %": "twelfthPercent", hsc: "twelfthPercent",
  dob: "dateOfBirth",     "date of birth": "dateOfBirth", "birth date": "dateOfBirth",
};

function autoMapHeaders(headers) {
  return headers.map((h) => {
    const normalized = String(h || "").toLowerCase().trim();
    return AUTO_MAP[normalized] || null;
  });
}

// ── Excel parsing ─────────────────────────────────────────────────────────────
async function parseExcelBuffer(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("Excel file has no worksheets.");

  const headers = [];
  const rows    = [];

  worksheet.eachRow((row, rowNumber) => {
    const cells = row.values.slice(1); // ExcelJS row.values[0] is always undefined
    if (rowNumber === 1) {
      cells.forEach((cell) => headers.push(String(cell ?? "").trim()));
    } else {
      // Skip completely empty rows
      const vals = cells.map((c) => (c !== null && c !== undefined ? String(c).trim() : ""));
      if (vals.every((v) => !v)) return;
      rows.push(vals);
    }
  });

  return { headers, rows };
}

// ── Row validation ────────────────────────────────────────────────────────────
function validateRow(rowObj) {
  const errors = [];

  if (!rowObj.fullName || String(rowObj.fullName).trim().length < 2) {
    errors.push("Full name is required (min 2 chars)");
  }
  if (!rowObj.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rowObj.email)) {
    errors.push("Valid email is required");
  }
  if (!rowObj.enrollmentNo || String(rowObj.enrollmentNo).trim().length < 3) {
    errors.push("Enrollment number is required");
  }
  if (!rowObj.branch || String(rowObj.branch).trim().length < 2) {
    errors.push("Branch is required");
  }
  const year = Number(rowObj.graduationYear);
  if (!year || year < 2020 || year > 2035) {
    errors.push("Valid graduation year required (2020–2035)");
  }
  const cgpa = Number(rowObj.cgpa);
  if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
    errors.push("CGPA must be 0–10");
  }
  const tenth = rowObj.tenthPercent !== "" && rowObj.tenthPercent != null ? Number(rowObj.tenthPercent) : null;
  if (tenth !== null && (isNaN(tenth) || tenth < 0 || tenth > 100)) {
    errors.push("10th % must be 0–100");
  }
  const twelfth = rowObj.twelfthPercent !== "" && rowObj.twelfthPercent != null ? Number(rowObj.twelfthPercent) : null;
  if (twelfth !== null && (isNaN(twelfth) || twelfth < 0 || twelfth > 100)) {
    errors.push("12th % must be 0–100");
  }

  return errors;
}

// ── Duplicate check ───────────────────────────────────────────────────────────
async function checkDuplicates(rows) {
  const emails      = [...new Set(rows.map((r) => r.email).filter(Boolean).map((e) => e.toLowerCase()))];
  const enrollments = [...new Set(rows.map((r) => r.enrollmentNo).filter(Boolean).map((e) => e.toUpperCase()))];

  const [emailResult, enrollResult] = await Promise.all([
    emails.length
      ? query("SELECT LOWER(email) AS email FROM users WHERE LOWER(email) = ANY($1)", [emails])
      : Promise.resolve({ rows: [] }),
    enrollments.length
      ? query("SELECT UPPER(roll_number) AS roll FROM student_profiles WHERE UPPER(roll_number) = ANY($1)", [enrollments])
      : Promise.resolve({ rows: [] }),
  ]);

  const dupEmails = new Set(emailResult.rows.map((r) => r.email));
  const dupRolls  = new Set(enrollResult.rows.map((r) => r.roll));

  return { dupEmails, dupRolls };
}

// ── Build preview rows ────────────────────────────────────────────────────────
/**
 * Parse a file buffer and build a preview result.
 *
 * @param {Buffer}   buffer
 * @param {string}   mimeType  – "xlsx" or "csv"
 * @param {string[]|null} mapping – if provided, array of DB field keys aligned with headers
 *                                  (null entries mean "skip this column")
 */
async function buildPreview(buffer, mimeType, mapping = null) {
  let headers, rawRows;

  if (mimeType === "xlsx") {
    ({ headers, rows: rawRows } = await parseExcelBuffer(buffer));
  } else {
    // CSV — we do a simple line-split parse on the backend
    const text   = buffer.toString("utf-8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines  = text.split("\n").filter((l) => l.trim());
    headers  = parseCSVLine(lines[0]);
    rawRows  = lines.slice(1).map(parseCSVLine);
  }

  // Determine field mapping
  const fieldMapping = mapping || autoMapHeaders(headers);

  // Map each raw row → named object
  const rowObjects = rawRows.map((cells, rowIndex) => {
    const obj = { _rowIndex: rowIndex + 2 }; // +2 because row 1 is header
    fieldMapping.forEach((fieldKey, colIndex) => {
      if (fieldKey) {
        obj[fieldKey] = cells[colIndex] !== undefined ? String(cells[colIndex]).trim() : "";
      }
    });
    return obj;
  });

  // Validate + detect cross-file duplicates (email or enrollment used twice in same file)
  const seenEmails = new Map();
  const seenRolls  = new Map();
  rowObjects.forEach((obj, i) => {
    if (obj.email) {
      const k = obj.email.toLowerCase();
      if (seenEmails.has(k)) seenEmails.get(k).push(i); else seenEmails.set(k, [i]);
    }
    if (obj.enrollmentNo) {
      const k = obj.enrollmentNo.toUpperCase();
      if (seenRolls.has(k)) seenRolls.get(k).push(i); else seenRolls.set(k, [i]);
    }
  });

  // DB duplicate check
  const { dupEmails, dupRolls } = await checkDuplicates(rowObjects);

  // Build final preview
  const preview = rowObjects.map((obj) => {
    const errors = validateRow(obj);

    if (dupEmails.has((obj.email || "").toLowerCase())) {
      errors.push("Email already exists in database");
    }
    if (dupRolls.has((obj.enrollmentNo || "").toUpperCase())) {
      errors.push("Enrollment number already exists in database");
    }
    // Cross-file duplicates
    const emailInstances = seenEmails.get((obj.email || "").toLowerCase()) || [];
    if (emailInstances.length > 1) {
      errors.push("Duplicate email within this file");
    }
    const rollInstances = seenRolls.get((obj.enrollmentNo || "").toUpperCase()) || [];
    if (rollInstances.length > 1) {
      errors.push("Duplicate enrollment number within this file");
    }

    return { ...obj, _errors: errors, _valid: errors.length === 0 };
  });

  return {
    headers,
    fieldMapping,
    preview,
    totalRows:   preview.length,
    validRows:   preview.filter((r) => r._valid).length,
    invalidRows: preview.filter((r) => !r._valid).length,
  };
}

// ── CSV line parser (handles quoted fields) ───────────────────────────────────
function parseCSVLine(line) {
  const result = [];
  let current  = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ── Bulk insert (confirmed rows only) ────────────────────────────────────────
async function bulkInsertStudents(validRows) {
  const results = { created: [], failed: [] };

  const sentinelBase = `__unset__${Date.now()}__`;

  for (const row of validRows) {
    try {
      const branchCode = String(row.branch || "")
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

      const sentinelHash = await bcrypt.hash(`${sentinelBase}${row.email}`, 10);

      await withTransaction(async (client) => {
        const userResult = await client.query(
          `INSERT INTO users (display_name, email, password_hash, role, is_active, email_verified)
           VALUES ($1, $2, $3, 'student', TRUE, TRUE)
           RETURNING id`,
          [String(row.fullName).trim(), String(row.email).trim().toLowerCase(), sentinelHash],
        );

        await client.query(
          `INSERT INTO student_profiles (
             user_id, full_name, phone, city, roll_number, branch, branch_code,
             graduation_year, cgpa, gender, date_of_birth, tenth_percent,
             twelfth_percent, skills, preferred_locations, preferred_domains,
             expected_salary_label, headline, about, profile_complete
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
             '{}', '{}', '{}', '', '', '', FALSE
           )`,
          [
            userResult.rows[0].id,
            String(row.fullName).trim(),
            row.phone ? String(row.phone).trim() : null,
            row.city   ? String(row.city).trim()   : null,
            String(row.enrollmentNo).trim().toUpperCase(),
            String(row.branch).trim(),
            branchCode,
            Number(row.graduationYear),
            Number(row.cgpa),
            row.gender ? String(row.gender).trim() : null,
            row.dateOfBirth || null,
            row.tenthPercent   ? Number(row.tenthPercent)   : null,
            row.twelfthPercent ? Number(row.twelfthPercent) : null,
          ],
        );
      });

      results.created.push({ email: row.email, name: row.fullName });
    } catch (err) {
      results.failed.push({ email: row.email, name: row.fullName, error: err.message });
    }
  }

  return results;
}

// ── Stand-alone duplicate check (used by the real-time check endpoint) ────────
async function checkDuplicatesForPayload(rows) {
  const { dupEmails, dupRolls } = await checkDuplicates(rows);
  return rows.map((row) => ({
    email:        row.email,
    enrollmentNo: row.enrollmentNo,
    emailDup:     dupEmails.has((row.email || "").toLowerCase()),
    rollDup:      dupRolls.has((row.enrollmentNo || "").toUpperCase()),
  }));
}

module.exports = {
  buildPreview,
  bulkInsertStudents,
  checkDuplicatesForPayload,
  autoMapHeaders,
  DB_FIELDS,
};
