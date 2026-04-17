const router = require("express").Router();
const companyController = require("../controllers/company.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

router.use(authenticate, requireRole("admin"));

router.get("/", companyController.listCompanies);
router.post("/", companyController.createCompany);
router.get("/:id", companyController.getCompany);
router.patch("/:id", companyController.updateCompany);
router.post("/:id/timeline", companyController.addTimelineEvent);
router.post("/:id/contacts", companyController.addContactLog);

module.exports = router;
