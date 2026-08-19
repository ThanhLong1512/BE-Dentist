const redis = require("redis");
const { expireReservationsForHoldKey } = require("../services/reservationService");

let subscriber = null;

const initHoldSeatExpiryListener = async () => {
  try {
    subscriber = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT, 10) || 6379
      }
    });

    subscriber.on("error", error => {
      console.error("Hold seat expiry listener error:", error.message);
    });

    await subscriber.connect();

    try {
      await subscriber.configSet("notify-keyspace-events", "Ex");
    } catch (error) {
      console.warn(
        "Could not set notify-keyspace-events on Redis. Lazy expiry checks will still apply.",
        error.message
      );
    }

    await subscriber.pSubscribe("__keyevent@*__:expired", async message => {
      if (!message.startsWith("hold:appt:")) {
        return;
      }

      try {
        await expireReservationsForHoldKey(message);
        console.log(`Hold seat expired for key ${message}`);
      } catch (error) {
        console.error(
          `Failed to expire reservations for ${message}:`,
          error.message
        );
      }
    });

    console.log("Hold seat expiry listener initialized");
  } catch (error) {
    console.warn(
      "Hold seat expiry listener not started. Lazy expiry checks will still apply.",
      error.message
    );
  }
};

module.exports = { initHoldSeatExpiryListener };
