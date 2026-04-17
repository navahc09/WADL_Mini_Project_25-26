const router = require("express").Router();
const jobController = require("../controllers/job.controller");
const { authenticate } = require("../middleware/auth.middleware");
const responseLogger = require("../middleware/responseLogger.middleware");

router.use(authenticate);
router.use(responseLogger); // ← log every response on job routes

router.get("/", jobController.listEligibleJobs);
router.get("/:id", jobController.getJobById);

module.exports = router;
