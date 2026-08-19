const { getRedis, safeRedisOperation } = require("../providers/RedisProvider");
const { getSlotDateKey } = require("../utils/slotDate");

const getTtlSeconds = () => 300;

const SLOT_CACHE_PREFIX = "slots";

const getSlotCacheKey = ({ dateKey, serviceId, employeeId }) => {
  const svc = serviceId ? String(serviceId) : "*";
  const emp = employeeId ? String(employeeId) : "*";
  // Key de cache dung cho exact lookup, nen cache luôn truyền serviceId + employeeId.
  // Trong invalidate, ta dùng pattern (với *).
  if (svc === "*" || emp === "*") return null;
  return `${SLOT_CACHE_PREFIX}:${dateKey}:${svc}:${emp}`;
};

const getInvalidatePattern = ({ dateKey, serviceId, employeeId }) => {
  const svc = serviceId ? String(serviceId) : "*";
  const emp = employeeId ? String(employeeId) : "*";
  return `${SLOT_CACHE_PREFIX}:${dateKey}:${svc}:${emp}`;
};

const getCachedSlots = async ({ date, serviceId, employeeId }) =>
  safeRedisOperation(async () => {
    const dateKey = getSlotDateKey(date);
    const key = getSlotCacheKey({ dateKey, serviceId, employeeId });
    if (!key) return null;
    const redis = getRedis().instanceConnect;
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  }, null);

const setCachedSlots = async ({ date, serviceId, employeeId, slots }) =>
  safeRedisOperation(async () => {
    const dateKey = getSlotDateKey(date);
    const key = getSlotCacheKey({ dateKey, serviceId, employeeId });
    if (!key) return false;
    const redis = getRedis().instanceConnect;
    await redis.set(key, JSON.stringify(slots || []), { EX: getTtlSeconds() });
    return true;
  }, false);

const invalidateSlotCache = async ({ date, serviceId, employeeId }) =>
  safeRedisOperation(async () => {
    const dateKey = getSlotDateKey(date);
    const pattern = getInvalidatePattern({ dateKey, serviceId, employeeId });
    const redis = getRedis().instanceConnect;

    // scanIterator khong block Redis nhu KEYS.
    let count = 0;
    for await (const key of redis.scanIterator({ MATCH: pattern })) {
      count += 1;
      await redis.del(key);
    }
    return count;
  }, 0);

const invalidateSlotCacheByDateKey = async ({ dateKey, serviceId, employeeId }) =>
  safeRedisOperation(async () => {
    const pattern = getInvalidatePattern({ dateKey, serviceId, employeeId });
    const redis = getRedis().instanceConnect;
    let count = 0;
    for await (const key of redis.scanIterator({ MATCH: pattern })) {
      count += 1;
      await redis.del(key);
    }
    return count;
  }, 0);

module.exports = {
  getCachedSlots,
  setCachedSlots,
  invalidateSlotCache,
  invalidateSlotCacheByDateKey,
  getSlotCacheKey,
};

