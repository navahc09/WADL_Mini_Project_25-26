module.exports = function errorHandler(error, _req, res, _next) {
  const statusCode =
    error.statusCode ||
    (error.name === "MulterError" ? 400 : null) ||
    (error.code === "23505" ? 409 : null) ||
    (error.code === "23503" ? 400 : null) ||
    500;
  const payload = {
    error: error.message || "Something went wrong",
  };

  if (error.details) {
    payload.details = error.details;
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json(payload);
};
