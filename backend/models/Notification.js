const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // System notifications won't have a sender
    },
    type: {
      type: String,
      enum: [
        "application_status_update",
        "new_job_match",
        "interview_scheduled",
        "interview_reminder",
        "new_application",
        "job_posted",
        "profile_viewed",
        "message_received",
        "system_announcement",
        "account_security",
      ],
      required: [true, "Notification type is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    data: {
      // Additional data specific to notification type
      jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
      applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Application",
      },
      interviewId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      // Generic data object for flexible use
      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    status: {
      type: String,
      enum: ["unread", "read", "archived"],
      default: "unread",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    actionUrl: {
      type: String, // URL to navigate when notification is clicked
      default: null,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null, // For notifications that should auto-expire
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for better query performance
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete when expires

// Virtual for time ago
notificationSchema.virtual("timeAgo").get(function () {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.status = "read";
  this.readAt = new Date();
  return this.save();
};

// Method to mark as archived
notificationSchema.methods.archive = function () {
  this.status = "archived";
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function (data) {
  const notification = new this(data);
  await notification.save();

  // Populate sender and recipient for real-time notifications
  await notification.populate([
    { path: "sender", select: "firstName lastName email" },
    {
      path: "recipient",
      select: "firstName lastName email notificationSettings",
    },
  ]);

  return notification;
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function (
  userId,
  options = {},
) {
  const {
    status = null,
    type = null,
    limit = 20,
    skip = 0,
    includeArchived = false,
  } = options;

  const query = { recipient: userId };

  if (status) query.status = status;
  if (type) query.type = type;
  if (!includeArchived) query.status = { $ne: "archived" };

  return this.find(query)
    .populate("sender", "firstName lastName email")
    .populate("data.jobId", "title companyName")
    .populate("data.applicationId", "status")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({
    recipient: userId,
    status: "unread",
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { recipient: userId, status: "unread" },
    { status: "read", readAt: new Date() },
  );
};

// Static method to clean up old notifications
notificationSchema.statics.cleanupOldNotifications = function (daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: { $in: ["read", "archived"] },
  });
};

module.exports = mongoose.model("Notification", notificationSchema);
