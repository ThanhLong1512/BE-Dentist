const { Queue } = require("bullmq");

const connection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL, maxRetriesPerRequest: null }
  : {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      maxRetriesPerRequest: null
    };

const notificationQueue = new Queue("appointment-notifications", {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 }
  }
});

notificationQueue.on("error", err => {
  // Gracefully handle queue redis connection errors
});

module.exports = { notificationQueue, connection };
