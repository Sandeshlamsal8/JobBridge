const mongoose = require("mongoose");
const { encryptMessage, decryptMessage } = require("../utils/messageCrypto");

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
      set: encryptMessage,
      get: decryptMessage,
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
  return this.content;
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
