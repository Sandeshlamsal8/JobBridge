const mongoose = require("mongoose");

const jobReportSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      enum: [
        "spam",
        "misleading",
        "inappropriate",
        "scam",
        "duplicate",
        "discrimination",
        "other",
      ],
      required: true,
    },
    description: {
      type: String,
      required: [true, "Please provide details about the report"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed", "action-taken"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      maxlength: [500, "Admin notes cannot exceed 500 characters"],
    },
    actionTaken: {
      type: String,
      enum: ["none", "job-removed", "employer-warned", "job-edited"],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Index for better query performance
jobReportSchema.index({ job: 1, reporter: 1 });
jobReportSchema.index({ status: 1 });
jobReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model("JobReport", jobReportSchema);
