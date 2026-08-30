const LOCALHOST_PATTERN = /^(localhost|127\.0\.0\.1|\[::1\])$/i;

function required(source, name) {
  const value = source[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function integer(source, name, fallback) {
  const parsed = Number.parseInt(source[name] ?? fallback, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function boolean(source, name, fallback) {
  if (source[name] === undefined) return fallback;
  if (source[name] === "true") return true;
  if (source[name] === "false") return false;
  throw new Error(`${name} must be true or false`);
}

function origin(value, name, production) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must contain absolute URLs`);
  }
  if (parsed.origin !== value || !["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`${name} must contain origins without paths`);
  }
  if (production && (parsed.protocol !== "https:" || LOCALHOST_PATTERN.test(parsed.hostname))) {
    throw new Error(`${name} must use non-local HTTPS origins in production`);
  }
  return parsed.origin;
}

function loadEnv(source = process.env) {
  const nodeEnv = source.NODE_ENV || "development";
  const production = nodeEnv === "production";
  if (production) {
    [
      "MONGODB_URI",
      "JWT_SECRET",
      "MESSAGE_ENCRYPTION_KEY",
      "FRONTEND_URL",
      "REDIS_URL",
      "SMTP_HOST",
      "SMTP_USER",
      "SMTP_PASS",
      "CLAMAV_HOST",
    ].forEach((name) => required(source, name));
  }
  const frontendUrl = production
    ? required(source, "FRONTEND_URL")
    : source.FRONTEND_URL || "http://localhost:5173";
  const normalizedFrontendUrl = origin(frontendUrl, "FRONTEND_URL", production);
  const corsValues = (source.CORS_ORIGINS || normalizedFrontendUrl)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const config = {
    nodeEnv,
    production,
    port: integer(source, "PORT", "5000"),
    mongoUri: production ? required(source, "MONGODB_URI") : source.MONGODB_URI,
    jwtSecret: production ? required(source, "JWT_SECRET") : source.JWT_SECRET,
    jwtExpire: source.JWT_EXPIRE || "15m",
    messageEncryptionKey: production
      ? required(source, "MESSAGE_ENCRYPTION_KEY")
      : source.MESSAGE_ENCRYPTION_KEY,
    frontendUrl: normalizedFrontendUrl,
    corsOrigins: corsValues.map((value) => origin(value, "CORS_ORIGINS", production)),
    redisUrl: production ? required(source, "REDIS_URL") : source.REDIS_URL,
    trustProxy:
      source.TRUST_PROXY === "true"
        ? true
        : /^\d+$/.test(source.TRUST_PROXY || "")
          ? Number.parseInt(source.TRUST_PROXY, 10)
          : false,
    smtp: {
      host: production ? required(source, "SMTP_HOST") : source.SMTP_HOST,
      port: integer(source, "SMTP_PORT", "587"),
      user: production ? required(source, "SMTP_USER") : source.SMTP_USER,
      pass: production ? required(source, "SMTP_PASS") : source.SMTP_PASS,
      from: source.SMTP_FROM || source.SMTP_USER || source.EMAIL_USER,
    },
    clamav: {
      host: production ? required(source, "CLAMAV_HOST") : source.CLAMAV_HOST || "localhost",
      port: integer(source, "CLAMAV_PORT", "3310"),
      timeout: integer(source, "CLAMAV_TIMEOUT", "60000"),
      required: boolean(source, "CLAMAV_REQUIRED", production),
    },
  };

  config.smtp.secure = config.smtp.port === 465;

  if (production && config.jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
  if (production && !/^[a-f0-9]{64}$/i.test(config.messageEncryptionKey)) {
    throw new Error(
      "MESSAGE_ENCRYPTION_KEY must be exactly 64 hexadecimal characters in production",
    );
  }
  if (production && !config.clamav.required) {
    throw new Error("CLAMAV_REQUIRED must be true in production");
  }

  return config;
}

module.exports = { loadEnv };
