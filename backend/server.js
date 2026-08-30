const dotenv = require("dotenv");

dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { loadEnv } = require("./config/env");
const { initializeRedis, closeRedis } = require("./config/redis");

const config = loadEnv();
const app = express();
let server;

if (config.trustProxy !== false) app.set("trust proxy", config.trustProxy);

app.use(
  cors({
    origin(requestOrigin, callback) {
      if (!requestOrigin || config.corsOrigins.includes(requestOrigin)) {
        return callback(null, true);
      }
      const error = new Error("Origin is not allowed by CORS");
      error.statusCode = 403;
      return callback(error);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/applications", require("./routes/applications"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/saved-jobs", require("./routes/savedJobs"));
app.use("/api/profile-views", require("./routes/profileViews"));
app.use("/api/location", require("./routes/location"));
app.use("/api/ai-matching", require("./routes/ai-matching/ranking"));
app.use("/api/messaging", require("./routes/messaging"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/job-reports", require("./routes/jobReports"));

app.get("/api/health", (req, res) => {
  res.json({
    message: "JobBridge API is running!",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack || err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.statusCode ? err.message : "Something went wrong!",
    error: config.nodeEnv === "development" ? err.message : undefined,
  });
});

app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

async function startServer() {
  await mongoose.connect(config.mongoUri);
  console.log("Connected to MongoDB");

  const { initializeGridFS } = require("./utils/gridfs");
  initializeGridFS();

  try {
    await initializeRedis(config.redisUrl);
  } catch (error) {
    if (config.production) throw error;
    console.warn("Redis unavailable; development rate limits use memory");
  }

  if (config.clamav.required) {
    const AttachmentService = require("./services/attachmentService");
    await AttachmentService.verifyScanner();
  }

  require("./ai-service")
    .initialize()
    .catch((error) => console.warn("AI service lazy initialization:", error.message));

  server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
  return server;
}

async function shutdown(exitCode = 0) {
  if (server) await new Promise((resolve) => server.close(resolve));
  await closeRedis().catch(() => {});
  await mongoose.disconnect().catch(() => {});
  if (require.main === module) process.exit(exitCode);
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Server startup failed:", error.message);
    shutdown(1);
  });
  process.once("SIGTERM", () => shutdown(0));
  process.once("SIGINT", () => shutdown(0));
  process.once("unhandledRejection", (error) => {
    console.error("Unhandled promise rejection:", error.message);
    shutdown(1);
  });
}

module.exports = app;
module.exports.startServer = startServer;
module.exports.shutdown = shutdown;
