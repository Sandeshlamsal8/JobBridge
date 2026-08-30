const crypto = require("crypto");
const bcrypt = require("bcryptjs");

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function hashPin(pin) {
  return bcrypt.hash(pin, 10);
}

function comparePin(pin, hash) {
  return bcrypt.compare(pin, hash);
}

module.exports = { hashResetToken, hashPin, comparePin };
