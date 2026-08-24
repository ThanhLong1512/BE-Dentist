const fs = require("fs");
const path = require("path");
const winston = require("winston");

const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level: lvl, message, stack, ...meta }) => {
    const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    if (stack) return `${timestamp} ${lvl}: ${message}${rest}\n${stack}`;
    return `${timestamp} ${lvl}: ${message}${rest}`;
  })
);

const logger = winston.createLogger({
  level,
  defaultMeta: {
    service: process.env.SERVICE_NAME || "be-dentist"
  },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: jsonFormat,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  ]
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
} else {
  logger.add(
    new winston.transports.Console({
      format: jsonFormat
    })
  );
}

module.exports = logger;
