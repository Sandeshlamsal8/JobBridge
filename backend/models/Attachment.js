const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    uploaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader ID is required"],
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation ID is required"],
    },
    filename: {
      type: String,
      required: [true, "Filename is required"],
    },
    sanitizedFilename: {
      type: String,
      required: [true, "Sanitized filename is required"],
    },
    fileType: {
      type: String,
      required: [true, "File type is required"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
      min: [1, "File size must be greater than 0"],
      max: [10485760, "File size must not exceed 10MB"], // 10MB in bytes
    },
    gridFsFileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "GridFS file ID is required"],
    },
    malwareScanStatus: {
      type: String,
      enum: ["pending", "clean", "infected"],
      default: "pending",
    },
    malwareScanDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index on conversationId for querying attachments in a conversation
attachmentSchema.index({ conversationId: 1 });

// Index on uploaderId for querying user's uploads
attachmentSchema.index({ uploaderId: 1 });

// Index on malwareScanStatus for querying pending scans
attachmentSchema.index({ malwareScanStatus: 1 });

// Index on gridFsFileId for linking to GridFS file
attachmentSchema.index({ gridFsFileId: 1 });

// Method to mark malware scan as complete
attachmentSchema.methods.markScanComplete = function (status) {
  if (!["clean", "infected"].includes(status)) {
    throw new Error('Scan status must be "clean" or "infected"');
  }
  this.malwareScanStatus = status;
  this.malwareScanDate = new Date();
  return this.save();
};

// Method to check if attachment is safe to download
attachmentSchema.methods.isSafeToDownload = function () {
  return this.malwareScanStatus === "clean";
};

// Static method to find attachments by conversation
attachmentSchema.statics.findByConversation = function (conversationId) {
  return this.find({ conversationId })
    .populate("uploaderId", "firstName lastName email")
    .sort({ createdAt: -1 });
};

// Static method to find attachments by uploader
attachmentSchema.statics.findByUploader = function (uploaderId) {
  return this.find({ uploaderId })
    .populate("conversationId")
    .sort({ createdAt: -1 });
};

// Static method to find pending malware scans
attachmentSchema.statics.findPendingScans = function () {
  return this.find({ malwareScanStatus: "pending" }).sort({ createdAt: 1 });
};

// Static method to get total storage used by a user
attachmentSchema.statics.getTotalStorageByUser = async function (uploaderId) {
  const result = await this.aggregate([
    { $match: { uploaderId: mongoose.Types.ObjectId(uploaderId) } },
    { $group: { _id: null, totalSize: { $sum: "$fileSize" } } },
  ]);

  return result.length > 0 ? result[0].totalSize : 0;
};

module.exports = mongoose.model("Attachment", attachmentSchema);
