const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // Document will be automatically deleted after 1 hour
  },
});

// Index for faster queries
passwordResetSchema.index({ email: 1 });
passwordResetSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("PasswordReset", passwordResetSchema);
