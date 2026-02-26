const redis = require("redis");

// Redis client instance
let redisClient = null;

/**
 * Initialize Redis connection with connection pooling
 * @returns {Promise<RedisClient>} Connected Redis client
 */
async function initializeRedis() {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  redisClient = redis.createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        // Exponential backoff with max delay of 3000ms
        const delay = Math.min(retries * 50, 3000);
        console.log(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
        return delay;
      },
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

  await redisClient.connect();
  return redisClient;
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
};
