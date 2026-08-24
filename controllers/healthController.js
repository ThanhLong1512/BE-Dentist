const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const { isRedisReady } = require("../providers/RedisProvider");
const { client: esClient } = require("../search/elasticsearchClient");

const checkMongo = () => {
  const readyState = mongoose.connection.readyState;
  // 1 = connected
  return {
    status: readyState === 1 ? "up" : "down",
    readyState
  };
};

const checkRedis = () => {
  try {
    return {
      status: isRedisReady() ? "up" : "down"
    };
  } catch {
    return { status: "down" };
  }
};

const checkElasticsearch = async () => {
  try {
    const result = await esClient.ping({}, { requestTimeout: 2000 });
    return { status: result ? "up" : "down" };
  } catch (error) {
    return {
      status: "down",
      error: error.message
    };
  }
};

/**
 * GET /health
 * - 200 when Mongo + Redis are up (critical path)
 * - 503 when Mongo or Redis is down
 * Elasticsearch is reported but does not alone fail the probe (search is optional).
 */
exports.getHealth = catchAsync(async (req, res) => {
  const [mongo, redis, elasticsearch] = await Promise.all([
    Promise.resolve(checkMongo()),
    Promise.resolve(checkRedis()),
    checkElasticsearch()
  ]);

  const criticalOk = mongo.status === "up" && redis.status === "up";
  const overall = criticalOk ? "ok" : "degraded";

  const body = {
    status: overall,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    checks: {
      mongo,
      redis,
      elasticsearch
    }
  };

  return res.status(criticalOk ? 200 : 503).json(body);
});
