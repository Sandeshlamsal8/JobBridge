const { loadEnv } = require("../config/env");

const productionEnv = {
  NODE_ENV: "production",
  MONGODB_URI: "mongodb://database/jobbridge",
  JWT_SECRET: "j".repeat(32),
  JWT_EXPIRE: "15m",
  MESSAGE_ENCRYPTION_KEY: "a".repeat(64),
  FRONTEND_URL: "https://jobs.example.com",
  CORS_ORIGINS: "https://jobs.example.com,https://admin.example.com",
  REDIS_URL: "redis://redis:6379",
  SMTP_HOST: "smtp.example.com",
  SMTP_PORT: "587",
  SMTP_USER: "mailer",
  SMTP_PASS: "secret",
  SMTP_FROM: "no-reply@example.com",
  CLAMAV_HOST: "clamav",
  CLAMAV_PORT: "3310",
  CLAMAV_TIMEOUT: "60000",
  CLAMAV_REQUIRED: "true",
};

test("rejects incomplete production configuration", () => {
  expect(() => loadEnv({ NODE_ENV: "production" })).toThrow("MONGODB_URI");
});

test("accepts and normalizes secure production configuration", () => {
  const env = loadEnv(productionEnv);

  expect(env.corsOrigins).toEqual([
    "https://jobs.example.com",
    "https://admin.example.com",
  ]);
  expect(env.smtp.port).toBe(587);
  expect(env.smtp.secure).toBe(false);
  expect(env.smtp.from).toBe("no-reply@example.com");
  expect(env.clamav.required).toBe(true);
});

test("uses implicit TLS only on SMTP port 465", () => {
  expect(loadEnv({ ...productionEnv, SMTP_PORT: "465" }).smtp.secure).toBe(true);
});

test("rejects localhost production URLs and malformed secrets", () => {
  expect(() =>
    loadEnv({ ...productionEnv, FRONTEND_URL: "http://localhost:5173" }),
  ).toThrow("FRONTEND_URL");
  expect(() =>
    loadEnv({ ...productionEnv, MESSAGE_ENCRYPTION_KEY: "not-hex" }),
  ).toThrow("MESSAGE_ENCRYPTION_KEY");
});

test("uses explicit development defaults", () => {
  const env = loadEnv({ NODE_ENV: "test" });

  expect(env.port).toBe(5000);
  expect(env.frontendUrl).toBe("http://localhost:5173");
  expect(env.clamav.required).toBe(false);
});
