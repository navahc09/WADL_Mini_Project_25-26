const router = require("express").Router();
const documentController = require("../controllers/document.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { upload } = require("../middleware/upload.middleware");
const { uploadDocumentSchema } = require("../validators/job.validator");

router.get("/", authenticate, requireRole("student"), documentController.listDocuments);
router.post(
  "/upload",
  authenticate,
  requireRole("student"),
  upload.single("file"),
  validate(uploadDocumentSchema),
  documentController.uploadDocument,
);
router.get("/:id/access", authenticate, documentController.accessDocument);

module.exports = router;
