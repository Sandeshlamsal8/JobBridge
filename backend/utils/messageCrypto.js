const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function keyBuffer(keyHex = process.env.MESSAGE_ENCRYPTION_KEY) {
  if (!/^[a-f0-9]{64}$/i.test(keyHex || "")) {
    throw new Error(
      "MESSAGE_ENCRYPTION_KEY must be exactly 64 hexadecimal characters",
    );
  }
  return Buffer.from(keyHex, "hex");
}

function encryptMessage(text, keyHex) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer(keyHex), iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptMessage(value, keyHex) {
  if (!value || !/^[a-f0-9]{32}:[a-f0-9]{32}:(?:[a-f0-9]{2})+$/i.test(value)) {
    return value;
  }
  const parts = value.split(":");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    keyBuffer(keyHex),
    Buffer.from(parts[0], "hex"),
  );
  decipher.setAuthTag(Buffer.from(parts[1], "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(parts[2], "hex")),
    decipher.final(),
  ]).toString("utf8");
}

module.exports = { encryptMessage, decryptMessage };
