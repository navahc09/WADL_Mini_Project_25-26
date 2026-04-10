const router = require("express").Router();
const interviewController = require("../controllers/interview.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { scheduleRoundSchema, updateRoundResultSchema } = require("../validators/job.validator");

router.use(authenticate, requireRole("admin"));

router.get("/applications/:appId/rounds", interviewController.listRounds);
router.post(
  "/applications/:appId/rounds",
  validate(scheduleRoundSchema),
  interviewController.scheduleRound,
);
router.patch(
  "/applications/:appId/rounds/:roundId",
  validate(updateRoundResultSchema),
  interviewController.updateRoundResult,
);

module.exports = router;
