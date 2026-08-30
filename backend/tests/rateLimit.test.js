const { createRateLimiter } = require("../middleware/rateLimit");

function responseRecorder() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    set(name, value) {
      this.headers[name] = String(value);
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("returns 429 and Retry-After after the configured limit", async () => {
  const limiter = createRateLimiter({
    name: "login",
    limit: 1,
    windowSeconds: 60,
    store: async () => ({ count: 2, ttl: 41 }),
  });
  const res = responseRecorder();
  const next = jest.fn();

  await limiter({ ip: "127.0.0.1", body: {} }, res, next);

  expect(res.statusCode).toBe(429);
  expect(res.headers["Retry-After"]).toBe("41");
  expect(next).not.toHaveBeenCalled();
});

test("allows requests below the configured limit", async () => {
  const limiter = createRateLimiter({
    name: "signup",
    limit: 5,
    windowSeconds: 60,
    store: async () => ({ count: 1, ttl: 60 }),
  });
  const next = jest.fn();

  await limiter({ ip: "127.0.0.1", body: {} }, responseRecorder(), next);

  expect(next).toHaveBeenCalledTimes(1);
});

test("fails closed when the production store is unavailable", async () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const limiter = createRateLimiter({
    name: "reset",
    limit: 5,
    windowSeconds: 60,
    store: async () => {
      throw new Error("offline");
    },
  });
  const res = responseRecorder();

  await limiter({ ip: "127.0.0.1", body: {} }, res, jest.fn());
  process.env.NODE_ENV = original;

  expect(res.statusCode).toBe(503);
});
