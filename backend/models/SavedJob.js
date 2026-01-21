const mongoose = require("mongoose");

const savedJobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job is required"],
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: "",
    },
    tags: [
      {
        type: String,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["saved", "applied", "not_interested"],
      default: "saved",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index to prevent duplicate saves
savedJobSchema.index({ user: 1, job: 1 }, { unique: true });

// Index for better query performance
savedJobSchema.index({ user: 1, status: 1, createdAt: -1 });
savedJobSchema.index({ user: 1, priority: 1, createdAt: -1 });

// Virtual for time ago
savedJobSchema.virtual("timeAgo").get(function () {
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

// Static method to get user's saved jobs
savedJobSchema.statics.getUserSavedJobs = function (userId, options = {}) {
  const {
    status = "saved",
    priority = null,
    limit = 20,
    skip = 0,
    sortBy = "createdAt",
    sortOrder = -1,
  } = options;

  const query = { user: userId };
  if (status) query.status = status;
  if (priority) query.priority = priority;

  return this.find(query)
    .populate({
      path: "job",
      select:
        "title companyName location jobType workMode salary status createdAt",
      populate: {
        path: "company",
        select: "firstName lastName employerProfile.companyName profile.avatar",
      },
    })
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip(skip);
};

// Static method to check if job is saved by user
savedJobSchema.statics.isJobSavedByUser = function (userId, jobId) {
  return this.findOne({ user: userId, job: jobId, status: "saved" });
};

// Static method to get saved jobs count
savedJobSchema.statics.getSavedJobsCount = function (userId, status = "saved") {
  return this.countDocuments({ user: userId, status });
};

// Method to update status
savedJobSchema.methods.updateStatus = function (newStatus) {
  this.status = newStatus;
  return this.save();
};

// Method to add/update notes
savedJobSchema.methods.updateNotes = function (notes) {
  this.notes = notes;
  return this.save();
};

// Method to update priority
savedJobSchema.methods.updatePriority = function (priority) {
  this.priority = priority;
  return this.save();
};

// Method to add tag
savedJobSchema.methods.addTag = function (tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return this;
};

// Method to remove tag
savedJobSchema.methods.removeTag = function (tag) {
  this.tags = this.tags.filter((t) => t !== tag);
  return this.save();
};

module.exports = mongoose.model("SavedJob", savedJobSchema);
