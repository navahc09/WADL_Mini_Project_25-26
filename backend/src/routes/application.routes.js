const router = require("express").Router();
const applicationController = require("../controllers/application.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { createApplicationSchema, changeResumeSchema } = require("../validators/job.validator");

router.use(authenticate, requireRole("student"));

router.get("/", applicationController.listApplications);
router.post("/", validate(createApplicationSchema), applicationController.applyToJob);
router.patch("/:id/resume", validate(changeResumeSchema), applicationController.changeResume);

module.exports = router;
