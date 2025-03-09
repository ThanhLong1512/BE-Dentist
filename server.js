const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const corsOptions = require("./config/corsOption");

const app = require("./index");

dotenv.config({ path: "./config.env" });

const START_SERVER = () => {
  const DB = process.env.DATABASE.replace(
    "<PASSWORD>",
    process.env.DATABASE_PASSWORD
  );

  mongoose
    .connect(DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(con => {
      console.log(con.connection);
      console.log("Database connection successful");
    });

  // Fix Cache from disk from ExpressJS
  // Một middleware, Cache-Control là một header HTTP dùng để điều khiển cách trình duyệt/proxy lưu trữ response
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  // Dùng đê phân tích và đọc cookie từ request Express
  app.use(cookieParser());

  app.use(cors(corsOptions));
  // Cho phép server đọc dữ liệu JSON từ request body
  app.use(express.json());

  app.listen(process.env.HOST, process.env.PORT, () => {
    console.log(`App running on port ${process.env.PORT}...`);
  });

  // Xử lý tất cả những trường hợp Unhandle promise Rejection
  process.on("UnhandledRejection", err => {
    console.log(err.name, err.message);
  });
};

(() => {
  console.log("Starting Server...");
  START_SERVER()
    .then(() => console.log("Server started successfully"))
    .catch(error => {
      console.error(error);
      process.exit(0);
    });
})();
