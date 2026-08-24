const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const timeout = require("connect-timeout");
const hpp = require("hpp");
const compression = require("compression");

const AppError = require("./utils/appError");
const logger = require("./utils/logger");
const requestLogger = require("./middlewares/requestLogger");

const globalErrorHandler = require("./controllers/errorController");

const authRouter = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const patientRoutes = require("./routes/patientRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const accountRouter = require("./routes/accountRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const shiftRoutes = require("./routes/shiftRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const conservationRoutes = require("./routes/conservationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const searchRoutes = require("./routes/searchRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const healthRoutes = require("./routes/healthRoutes");

const swaggerUi = require("swagger-ui-express");
const { specs } = require("./docs/swagger");

const corsOption = require("./config/corsOption");

const app = express();

app.use(requestLogger);

// Set timeout to 10 seconds
// app.use(timeout("10s"));

// Trust only the loopback interface (localhost)
app.set("trust proxy", "loopback");

// Parse cookies
app.use(cookieParser());

// Enable CORS
app.use(cors(corsOption));

app.options("*", cors());

// Enhance security with Helmet
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
  })
);

// Rate limiting middleware with custom keyGenerator
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
  keyGenerator: req => {
    return req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
  }
});
app.use("/api", limiter);

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Sanitize data to prevent NoSQL injection
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price"
    ]
  })
);
app.get("/", (req, res) => {
  logger.info("Root health probe accessed");
  res.status(200).json({
    status: "success",
    message: "Deployment Successful",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.use("/health", healthRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Compress responses
app.use(compression());

// Routes
app.use("/api/v1/users", authRouter);
app.use("/api/v1/accounts", accountRouter);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/patients", patientRoutes);
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/appointments", appointmentRoutes);
app.use("/api/v1/shifts", shiftRoutes);
app.use("/api/v1/availability", availabilityRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/conservations", conservationRoutes);
app.use("/api/v1/messages", messageRoutes);

// // Import routes

// Handle 404 errors
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
// Export the app
module.exports = app;
