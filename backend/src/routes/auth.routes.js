const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const validate = require("../middleware/validate.middleware");
const { authenticate } = require("../middleware/auth.middleware");
const {
  loginSchema,
  refreshSchema,
  setupPasswordSchema,
  resetPasswordSchema,
} = require("../validators/auth.validator");

router.post("/login", validate(loginSchema), authController.login);
router.post("/setup-password", validate(setupPasswordSchema), authController.setupPassword);
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);

module.exports = router;
