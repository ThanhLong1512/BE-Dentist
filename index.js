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
const authRouter = require("./routes/authRoutes");
const corsOption = require("./config/corsOption");

const app = express();

// Set timeout to 10 seconds
app.use(timeout("10s"));

// Trust only the loopback interface (localhost)
app.set("trust proxy", "loopback");

// Enable CORS
app.use(cors(corsOption));
app.options("*", cors());

// Enhance security with Helmet
app.use(helmet());

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

// Parse cookies
app.use(cookieParser());

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

// Compress responses
app.use(compression());

// Routes
app.use("/api/v1/users", authRouter);

// Handle 404 errors
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Export the app
module.exports = app;
