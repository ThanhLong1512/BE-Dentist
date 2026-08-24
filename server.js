const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const mongoose = require("mongoose");
const corsOptions = require("./config/corsOption");
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
    console.log("✅ Database connected successfully");

    const host = process.env.LOCAL_DEV_APP_HOST || "0.0.0.0";
    const port = process.env.LOCAL_DEV_APP_PORT || 3000;

    return new Promise((resolve, reject) => {
      const server = app.listen(port, host, () => {
        console.log(`🚀 Server running at http://${host}:${port}`);
        resolve(server);
      });

      process.on("unhandledRejection", err => {
        console.log("UNHANDLED REJECTION! 💥 Shutting down...");
        console.log(err.name, err.message);
        server.close(() => {
          process.exit(1);
        });
      });

      process.on("SIGTERM", () => {
        console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
        server.close(() => {
          console.log("💥 Process terminated!");
        });
      });

      server.on("error", reject);
    });
  } catch (error) {
    console.error("Database connection failed", error);
    throw error;
  }
};

(async () => {
  console.log("Starting Server...");
  try {
    await START_SERVER();
    console.log("Server started successfully");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
