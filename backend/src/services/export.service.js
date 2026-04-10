const ExcelJS = require("exceljs");
const { query } = require("../db");
const { formatDateLabel } = require("./presentation.service");

async function exportApplicantsToExcel(jobId) {
  const { rows } = await query(
    `
      SELECT
        a.id AS application_id,
        a.status,
        a.applied_at,
        a.snapshot_data,
        j.title AS job_title,
        c.name AS company_name
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN companies c ON c.id = j.company_id
      WHERE a.job_id = $1
      ORDER BY a.applied_at ASC
    `,
    [jobId],
  );

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Applicants");

  worksheet.columns = [
    { header: "S.No", key: "sno", width: 6 },
    { header: "Name", key: "full_name", width: 25 },
    { header: "Roll Number", key: "roll_number", width: 18 },
    { header: "Email", key: "email", width: 30 },
    { header: "Branch", key: "branch", width: 24 },
    { header: "CGPA", key: "cgpa", width: 10 },
    { header: "Active Backlogs", key: "active_backlogs", width: 16 },
    { header: "10th %", key: "tenth_percent", width: 10 },
    { header: "12th %", key: "twelfth_percent", width: 10 },
    { header: "Skills", key: "skills", width: 36 },
    { header: "Status", key: "status", width: 18 },
    { header: "Applied At", key: "applied_at", width: 18 },
  ];

  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };

  rows.forEach((row, index) => {
    const snapshot = row.snapshot_data || {};
    worksheet.addRow({
      sno: index + 1,
      full_name: snapshot.full_name,
      roll_number: snapshot.roll_number,
      email: snapshot.email,
      branch: snapshot.branch,
      cgpa: snapshot.cgpa,
      active_backlogs: snapshot.active_backlogs,
      tenth_percent: snapshot.tenth_percent,
      twelfth_percent: snapshot.twelfth_percent,
      skills: (snapshot.skills || []).join(", "),
      status: row.status,
      applied_at: formatDateLabel(row.applied_at),
    });
  });

  worksheet.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "middle", wrapText: true };
    if (rowNumber > 1) {
      row.height = 22;
    }
  });

  return {
    fileName: `${rows[0]?.company_name || "company"}-${rows[0]?.job_title || "applicants"}.xlsx`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-"),
    buffer: await workbook.xlsx.writeBuffer(),
  };
}

module.exports = {
  exportApplicantsToExcel,
};
