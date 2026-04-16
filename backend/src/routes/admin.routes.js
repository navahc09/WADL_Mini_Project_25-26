const router = require("express").Router();
const adminController = require("../controllers/admin.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  createJobSchema,
  updateJobSchema,
  updateApplicantStatusSchema,
} = require("../validators/job.validator");

router.use(authenticate, requireRole("admin"));

router.get("/dashboard", adminController.getDashboard);
router.get("/jobs", adminController.listJobs);
router.post("/jobs", validate(createJobSchema), adminController.createJob);
router.put("/jobs/:id", validate(updateJobSchema), adminController.updateJob);
router.post("/jobs/:id/close", adminController.closeJob);
router.post("/jobs/:id/reopen", adminController.reopenJob);
router.delete("/jobs/:id", adminController.deleteJob);
router.get("/jobs/:id/applicants", adminController.getApplicants);
router.get("/jobs/:id/export", adminController.exportApplicants);
router.patch(
  "/jobs/:id/applicants/:applicantId",
  validate(updateApplicantStatusSchema),
  adminController.patchApplicantStatus,
);
router.get("/analytics", adminController.getAnalytics);

// Student management
router.get("/students", adminController.listStudents);
router.post("/students", adminController.createStudent);
router.put("/students/:id", adminController.updateStudent);
router.post("/students/:id/send-setup-link", adminController.sendStudentSetupLink);
router.post("/students/:id/send-reset-link", adminController.sendStudentResetLink);

module.exports = router;
