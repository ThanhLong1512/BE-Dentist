const redis = require("redis");
const AppError = require("../utils/appError");

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
    console.error("❌ Redis connection timeout");
    throw new AppError(
      REDIS_CONNECT_MESSAGE.message.vn,
      REDIS_CONNECT_MESSAGE.code
    );
  }, REDIS_CONNECT_TIMEOUT);
};

const handleEventConnection = connectionRedis => {
  connectionRedis.on(statusConnectRedis.CONNECTED, () => {
    console.log("🟢 Redis Client - Connection status: connecting");
  });

  connectionRedis.on(statusConnectRedis.READING, () => {
    console.log("✅ Redis Client - Connection status: ready");
    isConnected = true;
    clearTimeout(connectionTimeout);
  });

  connectionRedis.on(statusConnectRedis.ENDED, () => {
    console.log("🔴 Redis Client - Connection status: ended");
    isConnected = false;
    handleTimeoutConnect();
  });

  connectionRedis.on(statusConnectRedis.RECONNECTING, () => {
    console.log("🟡 Redis Client - Connection status: reconnecting");
    isConnected = false;
    clearTimeout(connectionTimeout);
  });

  connectionRedis.on("error", error => {
    console.error(`❌ Redis Client - Connection error:`, error.message);
    isConnected = false;
    handleTimeoutConnect();
  });
};

const initRedis = async () => {
  try {
    console.log("🚀 Initializing Redis connection...");

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

    console.log("✅ Redis initialized successfully");

    const pingResult = await instanceRedis.ping();
    console.log("🏓 Redis ping result:", pingResult);

    return instanceRedis;
  } catch (error) {
    console.error("❌ Redis initialization failed:", error);
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
      console.warn("⚠️ Redis not ready, skipping cache operation");
      return fallback;
    }

    return await operation();
  } catch (error) {
    console.error("❌ Redis operation failed:", error.message);
    return fallback;
  }
};

const closeRedis = async () => {
  try {
    if (client && isConnected) {
      await client.quit();
    }
  } catch (error) {
    console.error("❌ Error closing Redis connection:", error);
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
    console.error("❌ Manual reconnect failed:", error);
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
