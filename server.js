// Polyfill SlowBuffer for compatibility with buffer-equal-constant-time/jwa across Node.js versions
const bufferModule = require("buffer");
if (!bufferModule.SlowBuffer) {
  bufferModule.SlowBuffer = bufferModule.Buffer;
}
if (!bufferModule.SlowBuffer.prototype) {
  bufferModule.SlowBuffer.prototype = bufferModule.Buffer.prototype;
}

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const logger = require("./utils/logger");
const { initSentry, captureException } = require("./providers/sentryProvider");
initSentry();

const mongoose = require("mongoose");
const { initRedis } = require("./providers/RedisProvider");
const { initHoldSeatExpiryListener } = require("./providers/holdSeatExpiryListener");
const { initSocketServer } = require("./providers/socketProvider");
const { startNotificationWorker } = require("./workers/notificationWorker");

const app = require("./index");

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

const host = process.env.HOST || "0.0.0.0";
const port = process.env.PORT || process.env.LOCAL_DEV_APP_PORT || 8080;

// 1. Bind port immediately so Render and other cloud hosts detect open port within seconds
const server = app.listen(port, host, () => {
  logger.info(`Server running at http://${host}:${port}`);

  if (process.env.SOCKET_PORT && process.env.NODE_ENV === "development") {
    initSocketServer(parseInt(process.env.SOCKET_PORT, 10));
  } else {
    initSocketServer(server);
  }
});

// 2. Connect Database (MongoDB)
const connectDB = async () => {
  const rawDb = process.env.DATABASE;
  if (!rawDb) {
    logger.warn("DATABASE environment variable is not defined! Please set DATABASE in Render environment variables.");
    return;
  }

  const DB_URI = rawDb.replace(
    "<PASSWORD>",
    process.env.DATABASE_PASSWORD || ""
  );

  try {
    await mongoose.connect(DB_URI, {
      serverSelectionTimeoutMS: 8000
    });
    logger.info("Database connected successfully");
  } catch (err) {
    logger.error("Database connection failed:", { message: err.message });
  }
};
connectDB();

// 3. Connect Redis & Notification Worker safely (optional on cloud free tier)
const connectRedisSafely = async () => {
  const hasExternalRedis = Boolean(
    process.env.REDIS_URL ||
    (process.env.REDIS_HOST && !["localhost", "127.0.0.1"].includes(process.env.REDIS_HOST))
  );

  if (process.env.NODE_ENV === "production" && !hasExternalRedis) {
    logger.info("Skipping Redis in production: No external REDIS_URL or REDIS_HOST provided.");
    return;
  }

  try {
    await initRedis();
    await initHoldSeatExpiryListener();
    await startNotificationWorker();
    logger.info("Redis and Notification Worker initialized successfully");
  } catch (redisErr) {
    logger.warn("Redis initialization skipped or failed (app running without Redis):", {
      message: redisErr.message
    });
  }
};
connectRedisSafely();

// 4. Process event handlers
process.on("unhandledRejection", err => {
  logger.error("UNHANDLED REJECTION", {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  captureException(err);
});

process.on("uncaughtException", err => {
  logger.error("UNCAUGHT EXCEPTION — shutting down", {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  captureException(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received — shutting down gracefully");
  server.close(() => {
    logger.info("Process terminated");
  });
});

module.exports = server;
