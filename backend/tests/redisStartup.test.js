jest.mock("redis", () => ({ createClient: jest.fn() }));

const redis = require("redis");
const {
  initializeRedis,
  getRedisClient,
  redisReconnectStrategy,
} = require("../config/redis");

test("stops Redis startup retries so startup can fail fast", () => {
  expect(redisReconnectStrategy(0)).toBe(0);
  expect(redisReconnectStrategy(3)).toBeInstanceOf(Error);
});

test("clears a failed Redis client so development can fall back", async () => {
  const client = {
    on: jest.fn(),
    connect: jest.fn().mockRejectedValue(new Error("Redis unavailable")),
    destroy: jest.fn(),
  };
  redis.createClient.mockReturnValue(client);

  await expect(initializeRedis("redis://localhost:6379")).rejects.toThrow(
    "Redis unavailable",
  );

  expect(client.destroy).toHaveBeenCalled();
  expect(() => getRedisClient()).toThrow("Redis client not initialized");
});
