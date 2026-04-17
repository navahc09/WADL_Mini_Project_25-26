const ExcelJS = require("exceljs");
const { query } = require("../db");
const { formatDateLabel } = require("./presentation.service");

// ── Column definitions ────────────────────────────────────────────────────────
// This is the master list of every column we know how to export.
const ALL_COLUMNS = [
  { key: "sno",             header: "S.No",            width: 6 },
  { key: "full_name",       header: "Name",             width: 25 },
  { key: "roll_number",     header: "Roll Number",      width: 18 },
  { key: "email",           header: "Email",            width: 30 },
  { key: "phone",           header: "Phone",            width: 16 },
  { key: "gender",          header: "Gender",           width: 10 },
  { key: "city",            header: "City",             width: 14 },
  { key: "branch",          header: "Branch",           width: 24 },
  { key: "graduation_year", header: "Grad Year",        width: 12 },
  { key: "cgpa",            header: "CGPA",             width: 10 },
  { key: "percentage",      header: "Avg %",            width: 10 },
  { key: "active_backlogs", header: "Active Backlogs",  width: 16 },
  { key: "tenth_percent",   header: "10th %",           width: 10 },
  { key: "twelfth_percent", header: "12th %",           width: 10 },
  { key: "skills",          header: "Skills",           width: 36 },
  { key: "certifications",  header: "Certifications",   width: 30 },
  { key: "status",          header: "Status",           width: 18 },
  { key: "applied_at",      header: "Applied At",       width: 18 },
];

const ALL_COLUMN_KEYS = ALL_COLUMNS.map((c) => c.key);

// Default column order used when no template is saved
const DEFAULT_COLUMNS = [
  "sno", "full_name", "roll_number", "email", "branch", "cgpa",
  "active_backlogs", "tenth_percent", "twelfth_percent", "skills", "status", "applied_at",
];

// ── Template CRUD ─────────────────────────────────────────────────────────────

async function getCompanyTemplate(companyId) {
  const { rows } = await query(
    "SELECT * FROM company_export_templates WHERE company_id = $1",
    [companyId],
  );
  return rows[0] || null;
}

async function upsertCompanyTemplate(companyId, config) {
  const {
    columns = DEFAULT_COLUMNS,
    showPhoto = false,
    showCgpa = true,
    showPercent = true,
    headerColor = "FF2563EB",
    templateName = "Default",
  } = config;

  // Validate column keys — only allow known keys
  const safeColumns = columns.filter((k) => ALL_COLUMN_KEYS.includes(k));

  const { rows } = await query(
    `INSERT INTO company_export_templates
       (company_id, columns, show_photo, show_cgpa, show_percent, header_color, template_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (company_id) DO UPDATE SET
       columns       = EXCLUDED.columns,
       show_photo    = EXCLUDED.show_photo,
       show_cgpa     = EXCLUDED.show_cgpa,
       show_percent  = EXCLUDED.show_percent,
       header_color  = EXCLUDED.header_color,
       template_name = EXCLUDED.template_name,
       updated_at    = NOW()
     RETURNING *`,
    [companyId, safeColumns, showPhoto, showCgpa, showPercent, headerColor, templateName],
  );
  return rows[0];
}

// ── Row value extraction ──────────────────────────────────────────────────────

function extractCellValue(key, snapshot, appRow) {
  switch (key) {
    case "sno":            return null; // filled by index
    case "full_name":      return snapshot.full_name;
    case "roll_number":    return snapshot.roll_number;
    case "email":          return snapshot.email;
    case "phone":          return snapshot.phone;
    case "gender":         return snapshot.gender;
    case "city":           return snapshot.city;
    case "branch":         return snapshot.branch;
    case "graduation_year":return snapshot.graduation_year;
    case "cgpa":           return snapshot.cgpa;
    case "percentage": {
      const t = Number(snapshot.tenth_percent || 0);
      const tw = Number(snapshot.twelfth_percent || 0);
      if (t && tw) return ((t + tw) / 2).toFixed(2);
      return t || tw || null;
    }
    case "active_backlogs":  return snapshot.active_backlogs ?? 0;
    case "tenth_percent":    return snapshot.tenth_percent;
    case "twelfth_percent":  return snapshot.twelfth_percent;
    case "skills":           return (snapshot.skills || []).join(", ");
    case "certifications":   return (snapshot.certifications || []).map((c) => c.name || c).join(", ");
    case "status":           return appRow.status;
    case "applied_at":       return formatDateLabel(appRow.applied_at);
    default:                 return null;
  }
}

// ── Main export function ──────────────────────────────────────────────────────

async function exportApplicantsToExcel(jobId, templateOverride = null) {
  // 1. Fetch applicant data
  const { rows } = await query(
    `SELECT
       a.id AS application_id,
       a.status,
       a.applied_at,
       a.snapshot_data,
       j.title AS job_title,
       j.company_id,
       c.name AS company_name
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     WHERE a.job_id = $1
     ORDER BY a.applied_at ASC`,
    [jobId],
  );

  // 2. Load template (from DB or override or defaults)
  let template = templateOverride;
  if (!template && rows.length > 0) {
    template = await getCompanyTemplate(rows[0].company_id);
  }

  const columnKeys    = template?.columns      || DEFAULT_COLUMNS;
  const headerColor   = template?.header_color || "FF2563EB";
  const templateName  = template?.template_name || "Applicants";

  // 3. Build worksheet column definitions
  const columnDefs = columnKeys
    .map((key) => ALL_COLUMNS.find((c) => c.key === key))
    .filter(Boolean);

  // 4. Create workbook
  const workbook  = new ExcelJS.Workbook();
  workbook.creator = "TnP Platform";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(templateName);
  worksheet.columns = columnDefs.map((col) => ({
    header: col.header,
    key:    col.key,
    width:  col.width,
  }));

  // 5. Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font  = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.fill  = {
    type:    "pattern",
    pattern: "solid",
    fgColor: { argb: headerColor },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 26;

  // 6. Add data rows
  rows.forEach((row, index) => {
    const snapshot = row.snapshot_data || {};
    const rowData  = {};
    columnKeys.forEach((key) => {
      rowData[key] = key === "sno" ? index + 1 : extractCellValue(key, snapshot, row);
    });
    const dataRow = worksheet.addRow(rowData);
    dataRow.height = 20;

    // Alternate row shading
    if (index % 2 === 1) {
      dataRow.fill = {
        type:    "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFF" },
      };
    }
  });

  // 7. Final row styling
  worksheet.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "middle", wrapText: false };
    row.eachCell((cell) => {
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  // 8. Freeze header row
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  const companyName = rows[0]?.company_name || "company";
  const jobTitle    = rows[0]?.job_title    || "applicants";

  return {
    fileName: `${companyName}-${jobTitle}-${templateName}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") + ".xlsx",
    buffer: await workbook.xlsx.writeBuffer(),
  };
}

// ── List available column metadata (for template config UI) ──────────────────
function getAvailableColumns() {
  return ALL_COLUMNS.map(({ key, header, width }) => ({ key, header, width }));
}

module.exports = {
  exportApplicantsToExcel,
  getCompanyTemplate,
  upsertCompanyTemplate,
  getAvailableColumns,
  DEFAULT_COLUMNS,
};
