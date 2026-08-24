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

const START_SERVER = async () => {
  try {
    await initRedis();
    await initHoldSeatExpiryListener();
    initSocketServer(parseInt(process.env.SOCKET_PORT, 10) || 8090);
    await startNotificationWorker();

    const DB_URI = process.env.DATABASE.replace(
      "<PASSWORD>",
      process.env.DATABASE_PASSWORD
    );

    await mongoose.connect(DB_URI);
    logger.info("Database connected successfully");

    const host = process.env.LOCAL_DEV_APP_HOST || "0.0.0.0";
    const port = process.env.LOCAL_DEV_APP_PORT || 3000;

    return new Promise((resolve, reject) => {
      const server = app.listen(port, host, () => {
        logger.info(`Server running at http://${host}:${port}`);
        resolve(server);
      });

      process.on("unhandledRejection", err => {
        logger.error("UNHANDLED REJECTION — shutting down", {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        captureException(err);
        server.close(() => {
          process.exit(1);
        });
      });

      process.on("uncaughtException", err => {
        logger.error("UNCAUGHT EXCEPTION — shutting down", {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        captureException(err);
        process.exit(1);
      });

      process.on("SIGTERM", () => {
        logger.info("SIGTERM received — shutting down gracefully");
        server.close(() => {
          logger.info("Process terminated");
        });
      });

      server.on("error", reject);
    });
  } catch (error) {
    logger.error("Server bootstrap failed", {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

(async () => {
  logger.info("Starting server...");
  try {
    await START_SERVER();
    logger.info("Server started successfully");
  } catch (error) {
    logger.error(error.message, { stack: error.stack });
    captureException(error);
    process.exit(1);
  }
})();
