const mongoose = require("mongoose");
const crypto = require("crypto");

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Get encryption key from environment or generate a random one
let ENCRYPTION_KEY;
if (process.env.MESSAGE_ENCRYPTION_KEY) {
  // Convert hex string to Buffer
  ENCRYPTION_KEY = Buffer.from(process.env.MESSAGE_ENCRYPTION_KEY, "hex");
} else {
  // Generate random key for development (not recommended for production)
  ENCRYPTION_KEY = crypto.randomBytes(32);
  console.warn(
    "WARNING: Using random encryption key. Set MESSAGE_ENCRYPTION_KEY in .env for production.",
  );
}

/**
 * Encrypts message content using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text with IV and auth tag (format: iv:authTag:encryptedData)
 */
function encrypt(text) {
  if (!text) return text;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Return format: iv:authTag:encryptedData
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts message content
 * @param {string} encryptedText - Encrypted text (format: iv:authTag:encryptedData)
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.includes(":")) return encryptedText;

  const parts = encryptedText.split(":");
  if (parts.length !== 3) return encryptedText;

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation ID is required"],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender ID is required"],
      index: true,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      set: encrypt, // Automatically encrypt on save
      get: decrypt, // Automatically decrypt on retrieval
    },
    attachments: [
      {
        attachmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Attachment",
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    readBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true }, // Enable getters for decryption on JSON conversion
    toObject: { getters: true }, // Enable getters for decryption on object conversion
  },
);

// Compound index: conversationId + createdAt (descending) for paginated message retrieval
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Text index on content for full-text search
messageSchema.index({ content: "text" });

// Method to mark message as read
messageSchema.methods.markAsRead = function (userId) {
  this.status = "read";
  this.readAt = new Date();
  this.readBy = userId;
  return this.save();
};

// Method to mark message as delivered
messageSchema.methods.markAsDelivered = function () {
  if (this.status === "sent") {
    this.status = "delivered";
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to check if message is read
messageSchema.methods.isRead = function () {
  return this.status === "read" && this.readAt !== null;
};

// Method to get decrypted content explicitly
messageSchema.methods.getDecryptedContent = function () {
  return decrypt(this.content);
};

// Static method to find messages by conversation with pagination
messageSchema.statics.findByConversation = function (
  conversationId,
  limit = 50,
  before = null,
) {
  const query = { conversationId };

  if (before) {
    query.createdAt = { $lt: before };
  }

  return this.find(query)
    .sort({ createdAt: -1 }) // Most recent first for pagination
    .limit(limit)
    .populate("senderId", "firstName lastName email")
    .populate("readBy", "firstName lastName");
};

// Static method to search messages for a user
messageSchema.statics.searchMessages = function (userId, searchQuery) {
  return this.find({
    $text: { $search: searchQuery },
  })
    .populate("conversationId")
    .populate("senderId", "firstName lastName email")
    .sort({ score: { $meta: "textScore" }, createdAt: -1 });
};

// Static method to count unread messages in a conversation for a user
messageSchema.statics.countUnread = function (conversationId, userId) {
  return this.countDocuments({
    conversationId,
    senderId: { $ne: userId },
    status: { $ne: "read" },
  });
};

// Static method to mark all messages in a conversation as read for a user
messageSchema.statics.markAllAsRead = async function (conversationId, userId) {
  const messages = await this.find({
    conversationId,
    senderId: { $ne: userId },
    status: { $ne: "read" },
  });

  const updatePromises = messages.map((msg) => msg.markAsRead(userId));
  return Promise.all(updatePromises);
};

module.exports = mongoose.model("Message", messageSchema);
