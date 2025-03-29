require("dotenv").config({ path: "./config.env" });
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOption");

// Import routes
const employeeRoutes = require("./routes/employeeRoutes");
const patientRoutes = require("./routes/patientRoutes");

// Tạo ứng dụng Express
const app = express();

// Middleware quan trọng
app.use(express.json()); // Hỗ trợ JSON request
app.use(express.urlencoded({ extended: true })); // Hỗ trợ form data
app.use(cookieParser()); // Xử lý cookies
app.use(cors(corsOptions)); // Cấu hình CORS

// Fix cache từ ExpressJS
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Routes
app.use("/api/employees", employeeRoutes);
app.use("/api/patients", patientRoutes);

// Cấu hình cổng và host
const host = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || 3000;

// Kết nối MongoDB
const connectDB = async () => {
  try {
    const DB_URI = process.env.DATABASE.replace(
      "<PASSWORD>",
      process.env.DATABASE_PASSWORD
    );

    await mongoose.connect(DB_URI);
    console.log("✅ Database connected successfully");

    // Sau khi kết nối thành công, start server
    app.listen(port, host, () => {
      console.log(`🚀 Server running at http://${host}:${port}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};

// Xử lý sự kiện mất kết nối MongoDB
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB Connection Error:", err);
});

// Khởi động server
console.log("⏳ Starting server...");
connectDB();
