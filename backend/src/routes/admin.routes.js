const router  = require("express").Router();
const multer  = require("multer");
const adminController = require("../controllers/admin.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const responseLogger = require("../middleware/responseLogger.middleware");
const {
  createJobSchema,
  updateJobSchema,
  updateApplicantStatusSchema,
} = require("../validators/job.validator");

// Multer: in-memory storage, 10 MB cap
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/csv",
    ];
    const ext = (file.originalname || "").split(".").pop().toLowerCase();
    if (allowed.includes(file.mimetype) || ext === "xlsx" || ext === "csv") {
      cb(null, true);
    } else {
      cb(new Error("Only .xlsx and .csv files are accepted."));
    }
  },
});

router.use(authenticate, requireRole("admin"));
router.use(responseLogger); // ← log every admin API response


// ── Dashboard / Analytics ──────────────────────────────────────────────────────
router.get("/dashboard",   adminController.getDashboard);
router.get("/analytics",   adminController.getAnalytics);
router.get("/audit-logs",  adminController.getEntityAuditLogs);

// ── Jobs ───────────────────────────────────────────────────────────────────────
router.get("/jobs",                    adminController.listJobs);
router.post("/jobs",                   validate(createJobSchema), adminController.createJob);
router.post("/jobs/validate",          adminController.validateJD);
router.put("/jobs/:id",                validate(updateJobSchema), adminController.updateJob);
router.post("/jobs/:id/close",         adminController.closeJob);
router.post("/jobs/:id/reopen",        adminController.reopenJob);
router.delete("/jobs/:id",             adminController.deleteJob);
router.get("/jobs/:id/applicants",     adminController.getApplicants);
router.get("/jobs/:id/export",         adminController.exportApplicants);
router.patch(
  "/jobs/:id/applicants/:applicantId",
  validate(updateApplicantStatusSchema),
  adminController.patchApplicantStatus,
);

// ── Export Templates ───────────────────────────────────────────────────────────
router.get("/companies/:companyId/export-template",  adminController.getExportTemplate);
router.put("/companies/:companyId/export-template",  adminController.saveExportTemplate);

// ── Student Management ─────────────────────────────────────────────────────────
router.get("/students",                          adminController.listStudents);
router.post("/students",                         adminController.createStudent);

// ── Bulk Import (MUST be before /:id parameterized routes) ────────────────────
router.get("/students/import/fields",            adminController.getImportFieldDefs);
router.post("/students/check-duplicates",        adminController.checkDuplicates);
router.post(
  "/students/bulk-upload",
  upload.single("file"),
  adminController.bulkUploadPreview,
);
router.post("/students/bulk-confirm",            adminController.bulkConfirmImport);

// ── Bulk Actions (MUST be before /:id parameterized routes) ──────────────────
router.post("/students/bulk-activate",           adminController.bulkActivateStudents);
router.post("/students/bulk-deactivate",         adminController.bulkDeactivateStudents);
router.post("/students/bulk-assign-branch",      adminController.bulkAssignBranch);

// ── Parameterized student routes ───────────────────────────────────────────────
router.put("/students/:id",                      adminController.updateStudent);
router.post("/students/:id/send-setup-link",     adminController.sendStudentSetupLink);
router.post("/students/:id/send-reset-link",     adminController.sendStudentResetLink);


module.exports = router;
