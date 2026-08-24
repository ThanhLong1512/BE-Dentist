const Sentry = require("@sentry/node");
const logger = require("../utils/logger");

let initialized = false;

const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.warn("SENTRY_DSN not set — Sentry error tracking is disabled");
    return false;
  }

  if (initialized) return true;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    release: process.env.SENTRY_RELEASE || undefined,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
    sendDefaultPii: false
  });

  initialized = true;
  logger.info("Sentry initialized");
  return true;
};

const isSentryEnabled = () => initialized && Boolean(process.env.SENTRY_DSN);

const captureException = (error, context = {}) => {
  if (!isSentryEnabled()) return;
  Sentry.withScope(scope => {
    if (context.req) {
      scope.setContext("request", {
        method: context.req.method,
        url: context.req.originalUrl,
        ip: context.req.ip
      });
      if (context.req.user?.id) {
        scope.setUser({ id: String(context.req.user.id) });
      }
    }
    if (context.extra) {
      scope.setExtras(context.extra);
    }
    Sentry.captureException(error);
  });
};

module.exports = {
  Sentry,
  initSentry,
  isSentryEnabled,
  captureException
};
