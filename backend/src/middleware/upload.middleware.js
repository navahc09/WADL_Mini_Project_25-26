const multer = require("multer");

const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      const error = new Error("Only PDF, JPEG, and PNG files are allowed");
      error.statusCode = 400;
      callback(error);
      return;
    }

    callback(null, true);
  },
});

module.exports = {
  upload,
};
