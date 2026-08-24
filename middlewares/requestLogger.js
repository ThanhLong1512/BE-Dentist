const logger = require("../utils/logger");

/**
 * Structured HTTP access log (method, url, status, duration).
 * Skips noisy health probes when HEALTH_SKIP_ACCESS_LOG=true (default).
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const skipHealth =
    process.env.HEALTH_SKIP_ACCESS_LOG !== "false" &&
    (req.path === "/health" || req.path === "/");

  res.on("finish", () => {
    if (skipHealth) return;

    const durationMs = Date.now() - start;
    const payload = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip
    };

    if (res.statusCode >= 500) {
      logger.error("HTTP request", payload);
    } else if (res.statusCode >= 400) {
      logger.warn("HTTP request", payload);
    } else {
      logger.info("HTTP request", payload);
    }
  });

  next();
};

module.exports = requestLogger;
