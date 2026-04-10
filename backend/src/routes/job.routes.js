const router = require("express").Router();
const jobController = require("../controllers/job.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);

router.get("/", jobController.listEligibleJobs);
router.get("/:id", jobController.getJobById);

module.exports = router;
