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
  if (connectionTimeout) clearTimeout(connectionTimeout);
  connectionTimeout = setTimeout(() => {
    logger.warn("Redis connection timeout reached");
    isConnected = false;
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
  });

  connectionRedis.on(statusConnectRedis.RECONNECTING, () => {
    logger.warn("Redis client reconnecting");
    isConnected = false;
  });

  connectionRedis.on("error", error => {
    logger.warn("Redis client connection error:", { message: error.message });
    isConnected = false;
  });
};

const initRedis = async () => {
  try {
    logger.info("Initializing Redis connection");

    const reconnectStrategy = retries => {
      if (retries > 2) {
        logger.warn("Redis max reconnect retries reached (2), stopping reconnection.");
        return false;
      }
      return Math.min(retries * 300, 1000);
    };

    const clientOptions = process.env.REDIS_URL
      ? {
          url: process.env.REDIS_URL,
          socket: { reconnectStrategy }
        }
      : {
          socket: {
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT, 10) || 6379,
            reconnectStrategy
          }
        };

    const instanceRedis = redis.createClient(clientOptions);

    handleEventConnection(instanceRedis);

    // Give connect() maximum 3.5 seconds to succeed
    await Promise.race([
      instanceRedis.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Redis connection timeout (3.5s)")), 3500)
      )
    ]);

    client = instanceRedis;
    isConnected = true;

    logger.info("Redis initialized successfully");

    const pingResult = await instanceRedis.ping();
    logger.debug("Redis ping result", { pingResult });

    return instanceRedis;
  } catch (error) {
    logger.warn("Redis initialization skipped or failed:", {
      message: error.message
    });
    isConnected = false;
    throw error;
  }
};

const mockRedisClient = {
  get: async () => null,
  set: async () => "OK",
  del: async () => 0,
  keys: async () => [],
  expire: async () => 1,
  ttl: async () => -1,
  hGet: async () => null,
  hSet: async () => 1,
  hGetAll: async () => ({})
};

const getRedis = () => {
  if (!client || !isConnected) {
    return {
      instanceConnect: mockRedisClient,
      isConnected: false
    };
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
