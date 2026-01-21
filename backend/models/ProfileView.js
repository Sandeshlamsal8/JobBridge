const mongoose = require("mongoose");

const profileViewSchema = new mongoose.Schema(
  {
    profileOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Profile owner is required"],
    },
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for anonymous views
    },
    viewerType: {
      type: String,
      enum: ["jobseeker", "employer", "anonymous"],
      required: [true, "Viewer type is required"],
    },
    viewerInfo: {
      // For anonymous viewers, we can store some basic info
      ipAddress: String,
      userAgent: String,
      location: String, // City/Country if available
    },
    source: {
      type: String,
      enum: [
        "job_application", // Viewed from application
        "search_results", // Found in search
        "direct_link", // Direct profile URL
        "recommendation", // From job recommendations
        "company_browse", // Employer browsing candidates
        "other",
      ],
      default: "other",
    },
    metadata: {
      // Additional context about the view
      jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        default: null,
      },
      searchQuery: String,
      referrer: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
profileViewSchema.index({ profileOwner: 1, createdAt: -1 });
profileViewSchema.index({ viewer: 1, createdAt: -1 });
profileViewSchema.index({ profileOwner: 1, viewer: 1, createdAt: -1 });
profileViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // Auto-delete after 90 days

// Compound index to prevent duplicate views from same viewer on same day
profileViewSchema.index({
  profileOwner: 1,
  viewer: 1,
  createdAt: 1,
});

// Virtual for time ago
profileViewSchema.virtual("timeAgo").get(function () {
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

// Static method to record a profile view
profileViewSchema.statics.recordView = async function (
  profileOwnerId,
  viewerId = null,
  viewerType,
  options = {}
) {
  const {
    source = "other",
    jobId = null,
    searchQuery = null,
    referrer = null,
    ipAddress = null,
    userAgent = null,
    location = null,
  } = options;

  // Prevent self-views
  if (viewerId && viewerId.toString() === profileOwnerId.toString()) {
    return null;
  }

  // Check if this viewer already viewed this profile today (to prevent spam)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingView = await this.findOne({
    profileOwner: profileOwnerId,
    viewer: viewerId,
    createdAt: { $gte: today, $lt: tomorrow },
  });

  // If already viewed today, just update the timestamp and metadata
  if (existingView) {
    existingView.createdAt = new Date();
    existingView.source = source;
    existingView.metadata = { jobId, searchQuery, referrer };
    return existingView.save();
  }

  // Create new view record
  const viewData = {
    profileOwner: profileOwnerId,
    viewer: viewerId,
    viewerType,
    source,
    metadata: { jobId, searchQuery, referrer },
  };

  // Add viewer info for anonymous views
  if (!viewerId) {
    viewData.viewerInfo = {
      ipAddress,
      userAgent,
      location,
    };
  }

  const profileView = new this(viewData);
  return profileView.save();
};

// Static method to get profile view count
profileViewSchema.statics.getViewCount = function (
  profileOwnerId,
  options = {}
) {
  const {
    startDate = null,
    endDate = null,
    viewerType = null,
    source = null,
  } = options;

  const query = { profileOwner: profileOwnerId };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  if (viewerType) query.viewerType = viewerType;
  if (source) query.source = source;

  return this.countDocuments(query);
};

// Static method to get profile view statistics
profileViewSchema.statics.getViewStats = function (profileOwnerId) {
  return this.aggregate([
    { $match: { profileOwner: new mongoose.Types.ObjectId(profileOwnerId) } },
    {
      $group: {
        _id: {
          viewerType: "$viewerType",
          source: "$source",
        },
        count: { $sum: 1 },
        lastView: { $max: "$createdAt" },
      },
    },
    {
      $group: {
        _id: "$_id.viewerType",
        totalViews: { $sum: "$count" },
        sources: {
          $push: {
            source: "$_id.source",
            count: "$count",
            lastView: "$lastView",
          },
        },
      },
    },
  ]);
};

// Static method to get recent profile views
profileViewSchema.statics.getRecentViews = function (
  profileOwnerId,
  limit = 10
) {
  return this.find({ profileOwner: profileOwnerId })
    .populate(
      "viewer",
      "firstName lastName userType employerProfile.companyName"
    )
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get view trends (daily counts for last 30 days)
profileViewSchema.statics.getViewTrends = function (profileOwnerId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        profileOwner: new mongoose.Types.ObjectId(profileOwnerId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        count: { $sum: 1 },
        date: { $first: "$createdAt" },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
    },
  ]);
};

module.exports = mongoose.model("ProfileView", profileViewSchema);
