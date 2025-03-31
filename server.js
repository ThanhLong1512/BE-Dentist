const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const corsOptions = require("./config/corsOption");

const app = require("./index");
dotenv.config({ path: "./config.env" }); // Missing app initialization

// // No-cache middleware
// app.use((req, res, next) => {
//   res.set("Cache-Control", "no-store");
//   next();
// });

// Route handlers (these were imported but not used)

// Connect to MongoDB and start server
const START_SERVER = async () => {
  try {
    const DB_URI = process.env.DATABASE.replace(
      "<PASSWORD>",
      process.env.DATABASE_PASSWORD
    );

    await mongoose.connect(DB_URI);
    console.log("✅ Database connected successfully");

    // Set host and port with fallback values
    const host = process.env.LOCAL_DEV_APP_HOST || "127.0.0.1";
    const port = process.env.LOCAL_DEV_APP_PORT || 3000;

    return new Promise((resolve, reject) => {
      const server = app.listen(port, host, () => {
        console.log(`🚀 Server running at http://${host}:${port}`);
        resolve(server);
      });

      // Handle unhandled rejections
      process.on("unhandledRejection", err => {
        console.log("UNHANDLED REJECTION! 💥 Shutting down...");
        console.log(err.name, err.message);
        server.close(() => {
          process.exit(1);
        });
      });

      // Handle SIGTERM
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

// Start the server
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
