const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const corsOptions = require("./config/corsOption");

const app = require("./index");

process.on("uncaughtException", err => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});
dotenv.config({ path: "./config.env" });

const START_SERVER = () => {
  const DB = process.env.DATABASE.replace(
    "<PASSWORD>",
    process.env.DATABASE_PASSWORD
  );

  return mongoose
    .connect(DB)
    .then(() => {
      console.log("Database connection successful");

      // Fix Cache from disk from ExpressJS
      app.use((req, res, next) => {
        res.set("Cache-Control", "no-store");
        next();
      });

      // Parse cookies
      app.use(cookieParser());

      // Enable CORS
      app.use(cors(corsOptions));

      // Parse JSON bodies
      app.use(express.json());

      // Set host and port with fallback values
      const host = process.env.LOCAL_DEV_APP_HOST || "127.0.0.1";
      const port = process.env.LOCAL_DEV_APP_PORT || 3000;

      return new Promise((resolve, reject) => {
        const server = app.listen(port, host, () => {
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
    })
    .catch(error => {
      console.error("Database connection failed", error);
      throw error;
    });
};

(() => {
  console.log("Starting Server...");
  START_SERVER()
    .then(() => console.log("Server started successfully"))
    .catch(error => {
      console.error(error);
      process.exit(1); // Exit with a failure code
    });
})();
