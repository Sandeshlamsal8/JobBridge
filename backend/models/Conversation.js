const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: [true, "Application ID is required"],
    },
    participants: {
      jobSeeker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Job Seeker participant is required"],
      },
      employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Employer participant is required"],
      },
    },
    lastMessage: {
      content: {
        type: String,
        default: null,
      },
      timestamp: {
        type: Date,
        default: null,
      },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    archived: {
      type: Map,
      of: Boolean,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Unique index on applicationId - ensures one conversation per application
conversationSchema.index({ applicationId: 1 }, { unique: true });

// Compound index on participants for querying user's conversations
conversationSchema.index({
  "participants.jobSeeker": 1,
  "participants.employer": 1,
});

// Index on updatedAt for sorting by recent activity (descending)
conversationSchema.index({ updatedAt: -1 });

// Method to check if user is a participant
conversationSchema.methods.isParticipant = function (userId) {
  return (
    this.participants.jobSeeker.toString() === userId.toString() ||
    this.participants.employer.toString() === userId.toString()
  );
};

// Method to get the other participant's ID
conversationSchema.methods.getOtherParticipant = function (userId) {
  if (this.participants.jobSeeker.toString() === userId.toString()) {
    return this.participants.employer;
  }
  return this.participants.jobSeeker;
};

// Method to update last message
conversationSchema.methods.updateLastMessage = function (
  content,
  senderId,
  timestamp,
) {
  this.lastMessage = {
    content,
    senderId,
    timestamp: timestamp || new Date(),
  };
  return this.save();
};

// Method to increment unread count for a user
conversationSchema.methods.incrementUnreadCount = function (userId) {
  const currentCount = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), currentCount + 1);
  return this.save();
};

// Method to reset unread count for a user
conversationSchema.methods.resetUnreadCount = function (userId) {
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

// Method to archive conversation for a user
conversationSchema.methods.archiveForUser = function (userId) {
  this.archived.set(userId.toString(), true);
  return this.save();
};

// Method to unarchive conversation for a user
conversationSchema.methods.unarchiveForUser = function (userId) {
  this.archived.set(userId.toString(), false);
  return this.save();
};

// Method to check if conversation is archived for a user
conversationSchema.methods.isArchivedForUser = function (userId) {
  return this.archived.get(userId.toString()) || false;
};

// Static method to find conversations for a user
conversationSchema.statics.findByUser = function (
  userId,
  includeArchived = false,
) {
  const query = {
    $or: [
      { "participants.jobSeeker": userId },
      { "participants.employer": userId },
    ],
  };

  return this.find(query)
    .populate("participants.jobSeeker", "firstName lastName email")
    .populate("participants.employer", "firstName lastName email")
    .populate("applicationId", "job status")
    .sort({ updatedAt: -1 });
};

// Static method to find conversation by application ID
conversationSchema.statics.findByApplicationId = function (applicationId) {
  return this.findOne({ applicationId })
    .populate("participants.jobSeeker", "firstName lastName email")
    .populate("participants.employer", "firstName lastName email")
    .populate("applicationId", "job status");
};

// Static method to get total unread count for a user
conversationSchema.statics.getTotalUnreadCount = async function (userId) {
  const conversations = await this.find({
    $or: [
      { "participants.jobSeeker": userId },
      { "participants.employer": userId },
    ],
  });

  let totalUnread = 0;
  conversations.forEach((conv) => {
    const unread = conv.unreadCount.get(userId.toString()) || 0;
    const isArchived = conv.archived.get(userId.toString()) || false;
    if (!isArchived) {
      totalUnread += unread;
    }
  });

  return totalUnread;
};

module.exports = mongoose.model("Conversation", conversationSchema);
