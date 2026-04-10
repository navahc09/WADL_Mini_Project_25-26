const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const studentRoutes = require("./routes/student.routes");
const jobRoutes = require("./routes/job.routes");
const applicationRoutes = require("./routes/application.routes");
const adminRoutes = require("./routes/admin.routes");
const documentRoutes = require("./routes/document.routes");
const notificationRoutes = require("./routes/notification.routes");
const interviewRoutes = require("./routes/interview.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
  .filter(Boolean)
  .flatMap((value) => String(value).split(","))
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.length === 0) {
        callback(null, origin === "http://localhost:5173");
        return;
      }

      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "tnp-backend" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/admin", interviewRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/notifications", notificationRoutes);

app.use(errorHandler);

module.exports = app;
