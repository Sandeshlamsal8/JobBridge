const redis = require("redis");

// Redis client instance
let redisClient = null;

function redisReconnectStrategy(retries) {
  if (retries >= 3) return new Error("Redis connection retries exhausted");
  return Math.min(retries * 50, 3000);
}

/**
 * Initialize Redis connection with connection pooling
 * @returns {Promise<RedisClient>} Connected Redis client
 */
async function initializeRedis(redisUrl = process.env.REDIS_URL || "redis://localhost:6379") {
  if (redisClient) {
    return redisClient;
  }

  redisClient = redis.createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: redisReconnectStrategy,
    },
  });

  // Error handling
  redisClient.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  redisClient.on("connect", () => {
    console.log("Redis Client Connected");
  });

  redisClient.on("reconnecting", () => {
    console.log("Redis Client Reconnecting");
  });

  redisClient.on("ready", () => {
    console.log("Redis Client Ready");
  });

  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    try {
      redisClient.destroy();
    } catch {}
    redisClient = null;
    throw error;
  }
}

/**
 * Get the Redis client instance
 * @returns {RedisClient} Redis client
 */
function getRedisClient() {
  if (!redisClient) {
    throw new Error(
      "Redis client not initialized. Call initializeRedis() first.",
    );
  }
  return redisClient;
}

/**
 * Close Redis connection gracefully
 * @returns {Promise<void>}
 */
async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log("Redis connection closed");
  }
}

module.exports = {
  initializeRedis,
  getRedisClient,
  closeRedis,
  redisReconnectStrategy,
};
