const router = require("express").Router();
const applicationController = require("../controllers/application.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { createApplicationSchema, changeResumeSchema } = require("../validators/job.validator");
const responseLogger = require("../middleware/responseLogger.middleware");

router.use(authenticate, requireRole("student"));
router.use(responseLogger); // log all application responses

router.get("/", applicationController.listApplications);
router.post("/", validate(createApplicationSchema), applicationController.applyToJob);
router.get("/:id", applicationController.getApplication);
router.patch("/:id/resume", validate(changeResumeSchema), applicationController.changeResume);

module.exports = router;
