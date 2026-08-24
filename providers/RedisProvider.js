const redis = require("redis");
const AppError = require("../utils/appError");
const logger = require("../utils/logger");

let client = null;
let isConnected = false;

const statusConnectRedis = {
  CONNECTED: "connect",
  ENDED: "end",
  RECONNECTING: "reconnecting",
  ERROR: "error",
  READING: "ready"
};

const REDIS_CONNECT_TIMEOUT = 10000;
const REDIS_CONNECT_MESSAGE = {
  code: -99,
  message: {
    vn: "Kết nối Redis thất bại",
    en: "Connect Redis failed"
  }
};

let connectionTimeout;

const handleTimeoutConnect = () => {
  connectionTimeout = setTimeout(() => {
    logger.error("Redis connection timeout");
    throw new AppError(
      REDIS_CONNECT_MESSAGE.message.vn,
      REDIS_CONNECT_MESSAGE.code
    );
  }, REDIS_CONNECT_TIMEOUT);
};

const handleEventConnection = connectionRedis => {
  connectionRedis.on(statusConnectRedis.CONNECTED, () => {
    logger.info("Redis client connecting");
  });

  connectionRedis.on(statusConnectRedis.READING, () => {
    logger.info("Redis client ready");
    isConnected = true;
    clearTimeout(connectionTimeout);
  });

  connectionRedis.on(statusConnectRedis.ENDED, () => {
    logger.warn("Redis client connection ended");
    isConnected = false;
    handleTimeoutConnect();
  });

  connectionRedis.on(statusConnectRedis.RECONNECTING, () => {
    logger.warn("Redis client reconnecting");
    isConnected = false;
    clearTimeout(connectionTimeout);
  });

  connectionRedis.on("error", error => {
    logger.error("Redis client connection error", { message: error.message });
    isConnected = false;
    handleTimeoutConnect();
  });
};

const initRedis = async () => {
  try {
    logger.info("Initializing Redis connection");

    const instanceRedis = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT) || 6379,
        reconnectStrategy: retries => {
          return Math.min(retries * 100, 3000);
        }
      }
    });

    handleEventConnection(instanceRedis);

    await instanceRedis.connect();

    client = instanceRedis;

    logger.info("Redis initialized successfully");

    const pingResult = await instanceRedis.ping();
    logger.debug("Redis ping result", { pingResult });

    return instanceRedis;
  } catch (error) {
    logger.error("Redis initialization failed", {
      message: error.message,
      stack: error.stack
    });
    isConnected = false;
    throw error;
  }
};

const getRedis = () => {
  if (!client) {
    throw new Error("Redis client not initialized. Call initRedis() first.");
  }

  if (!isConnected) {
    throw new Error("Redis client is not connected.");
  }

  return {
    instanceConnect: client,
    isConnected: isConnected
  };
};

const isRedisReady = () => {
  return client && isConnected && client.isReady;
};

const safeRedisOperation = async (operation, fallback = null) => {
  try {
    if (!isRedisReady()) {
      logger.warn("Redis not ready, skipping cache operation");
      return fallback;
    }

    return await operation();
  } catch (error) {
    logger.error("Redis operation failed", { message: error.message });
    return fallback;
  }
};

const closeRedis = async () => {
  try {
    if (client && isConnected) {
      await client.quit();
    }
  } catch (error) {
    logger.error("Error closing Redis connection", { message: error.message });
  } finally {
    client = null;
    isConnected = false;
  }
};

const reconnectRedis = async () => {
  try {
    if (client && !isConnected) {
      await client.connect();
    }
  } catch (error) {
    logger.error("Manual Redis reconnect failed", { message: error.message });
  }
};

module.exports = {
  initRedis,
  getRedis,
  closeRedis,
  isRedisReady,
  safeRedisOperation,
  reconnectRedis
};
