const { getRedis, safeRedisOperation } = require("../providers/RedisProvider");
const { getSlotDateKey } = require("./slotDate");

const getHoldTtlSeconds = () =>
  parseInt(process.env.HOLD_SEAT_TTL_SECONDS, 10) || 300;

const getHoldKey = (shiftId, dateInput, slotStart) => {
  const dateKey = getSlotDateKey(dateInput);
  if (slotStart) return `hold:slot:${shiftId}:${dateKey}:${slotStart}`;
  return `hold:appt:${shiftId}:${dateKey}`;
};

const RELEASE_HOLD_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;

const acquireHold = async (shiftId, dateInput, reservationId, slotStart) => {
  return safeRedisOperation(async () => {
    const redis = getRedis().instanceConnect;
    const key = getHoldKey(shiftId, dateInput, slotStart);
    const result = await redis.set(key, reservationId, {
      NX: true,
      EX: getHoldTtlSeconds()
    });
    return result === "OK";
  }, false);
};

const releaseHold = async (shiftId, dateInput, reservationId, slotStart) => {
  return safeRedisOperation(async () => {
    const redis = getRedis().instanceConnect;
    const key = getHoldKey(shiftId, dateInput, slotStart);
    return redis.eval(RELEASE_HOLD_SCRIPT, {
      keys: [key],
      arguments: [reservationId]
    });
  }, 0);
};

const getHold = async (shiftId, dateInput, slotStart) => {
  return safeRedisOperation(async () => {
    const redis = getRedis().instanceConnect;
    const key = getHoldKey(shiftId, dateInput, slotStart);
    return redis.get(key);
  }, null);
};

const extendHold = async (shiftId, dateInput, reservationId, slotStart) => {
  return safeRedisOperation(async () => {
    const redis = getRedis().instanceConnect;
    const key = getHoldKey(shiftId, dateInput, slotStart);
    const current = await redis.get(key);
    if (current !== reservationId) return false;
    await redis.expire(key, getHoldTtlSeconds());
    return true;
  }, false);
};

const acquireConfirmLock = async reservationId => {
  return safeRedisOperation(async () => {
    const redis = getRedis().instanceConnect;
    const key = `lock:confirm:${reservationId}`;
    const result = await redis.set(key, "1", { NX: true, EX: 30 });
    return result === "OK";
  }, false);
};

const releaseConfirmLock = async reservationId => {
  return safeRedisOperation(async () => {
    const redis = getRedis().instanceConnect;
    await redis.del(`lock:confirm:${reservationId}`);
  }, null);
};

module.exports = {
  getHoldTtlSeconds,
  HOLD_TTL_SECONDS: getHoldTtlSeconds,
  getHoldKey,
  acquireHold,
  releaseHold,
  getHold,
  extendHold,
  acquireConfirmLock,
  releaseConfirmLock
};
