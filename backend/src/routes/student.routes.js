const router = require("express").Router();
const studentController = require("../controllers/student.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { updateProfileSchema } = require("../validators/student.validator");

router.use(authenticate, requireRole("student"));

router.get("/me/dashboard", studentController.getDashboard);
router.get("/me/profile", studentController.getProfile);
router.put("/me/profile", validate(updateProfileSchema), studentController.updateProfile);
router.put("/me/profile/skills", studentController.updateSkills);

// Work experience CRUD
router.post("/me/work-experiences", studentController.addWorkExperience);
router.put("/me/work-experiences/:id", studentController.updateWorkExperience);
router.delete("/me/work-experiences/:id", studentController.deleteWorkExperience);

// Certifications CRUD
router.post("/me/certifications", studentController.addCertification);
router.put("/me/certifications/:id", studentController.updateCertification);
router.delete("/me/certifications/:id", studentController.deleteCertification);

module.exports = router;
