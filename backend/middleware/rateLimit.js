const crypto = require("crypto");
const { getRedisClient } = require("../config/redis");

const counters = new Map();
const INCREMENT_SCRIPT = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return {count, redis.call("TTL", KEYS[1])}
`;

async function redisStore(key, windowSeconds) {
  const result = await getRedisClient().eval(INCREMENT_SCRIPT, {
    keys: [key],
    arguments: [String(windowSeconds)],
  });
  return { count: Number(result[0]), ttl: Math.max(1, Number(result[1])) };
}

async function memoryStore(key, windowSeconds) {
  const now = Date.now();
  const current = counters.get(key);
  if (!current || current.expiresAt <= now) {
    counters.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return { count: 1, ttl: windowSeconds };
  }
  current.count += 1;
  return {
    count: current.count,
    ttl: Math.max(1, Math.ceil((current.expiresAt - now) / 1000)),
  };
}

function createRateLimiter({ name, limit, windowSeconds, key, store = redisStore }) {
  return async function rateLimit(req, res, next) {
    const identifier = key
      ? key(req)
      : `${req.ip}:${String(req.body?.email || "").trim().toLowerCase()}`;
    const digest = crypto.createHash("sha256").update(identifier).digest("hex");
    const storeKey = `ratelimit:${name}:${digest}`;
    let result;

    try {
      result = await store(storeKey, windowSeconds);
    } catch (error) {
      if (process.env.NODE_ENV === "production") {
        return res.status(503).json({
          success: false,
          message: "Request protection service is temporarily unavailable",
        });
      }
      // ponytail: process-local fallback; require Redis before adding app instances.
      result = await memoryStore(storeKey, windowSeconds);
    }

    res.set("X-RateLimit-Limit", String(limit));
    res.set("X-RateLimit-Remaining", String(Math.max(0, limit - result.count)));
    if (result.count > limit) {
      res.set("Retry-After", String(result.ttl));
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    }
    return next();
  };
}

module.exports = { createRateLimiter };
