const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job is required"],
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Applicant is required"],
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employer is required"],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "reviewed",
        "shortlisted",
        "interview-scheduled",
        "interview-completed",
        "offered",
        "hired",
        "rejected",
        "withdrawn",
      ],
      default: "pending",
    },
    coverLetter: {
      type: String,
      maxlength: [2000, "Cover letter cannot exceed 2000 characters"],
    },
    resume: {
      data: Buffer,
      contentType: String,
      filename: String,
      originalName: String,
      size: Number,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
    cvAnalysis: {
      skills: [String],
      experience: Number,
      education: [String],
      certifications: [String],
      rawText: String,
      analyzedAt: {
        type: Date,
        default: Date.now,
      },
    },
    aiRanking: {
      overallScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      breakdown: {
        semanticMatch: Number,
        skillMatch: Number,
        experienceMatch: Number,
        educationMatch: Number,
      },
      matchedSkills: [String],
      missingSkills: [String],
      tier: {
        type: String,
        enum: ["excellent", "good", "fair", "poor"],
      },
      insights: [String],
      rankedAt: {
        type: Date,
        default: Date.now,
      },
    },
    additionalDocuments: [
      {
        data: Buffer,
        contentType: String,
        filename: String,
        originalName: String,
        size: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    expectedSalary: {
      amount: Number,
      currency: {
        type: String,
        default: "USD",
      },
      period: {
        type: String,
        enum: ["hourly", "monthly", "yearly"],
        default: "yearly",
      },
    },
    availableStartDate: {
      type: Date,
    },
    questionsAnswers: [
      {
        question: String,
        answer: String,
      },
    ],
    notes: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: [1000, "Note cannot exceed 1000 characters"],
        },
        isPrivate: {
          type: Boolean,
          default: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    interviews: [
      {
        type: {
          type: String,
          enum: ["phone", "video", "in-person", "technical"],
          required: true,
        },
        scheduledAt: {
          type: Date,
          required: true,
        },
        duration: {
          type: Number, // in minutes
          default: 60,
        },
        location: String, // for in-person interviews
        meetingLink: String, // for video interviews
        interviewer: {
          name: String,
          email: String,
          phone: String,
        },
        status: {
          type: String,
          enum: ["scheduled", "completed", "cancelled", "rescheduled"],
          default: "scheduled",
        },
        feedback: {
          rating: {
            type: Number,
            min: 1,
            max: 5,
          },
          comments: String,
          recommendation: {
            type: String,
            enum: ["hire", "maybe", "no-hire"],
          },
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    timeline: [
      {
        action: {
          type: String,
          enum: [
            "applied",
            "pending",
            "reviewed",
            "shortlisted",
            "interview-scheduled",
            "interview-completed",
            "offered",
            "hired",
            "rejected",
            "withdrawn",
          ],
          required: true,
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        note: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    rating: {
      overall: {
        type: Number,
        min: 1,
        max: 5,
      },
      skills: {
        type: Number,
        min: 1,
        max: 5,
      },
      experience: {
        type: Number,
        min: 1,
        max: 5,
      },
      communication: {
        type: Number,
        min: 1,
        max: 5,
      },
      cultural_fit: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
    rejectionReason: {
      type: String,
      enum: [
        "qualifications",
        "experience",
        "skills",
        "salary-expectations",
        "location",
        "availability",
        "cultural-fit",
        "position-filled",
        "other",
      ],
    },
    rejectionFeedback: {
      type: String,
      maxlength: [500, "Rejection feedback cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Regular index for query performance (no uniqueness constraint)
// Uniqueness is handled in application logic to allow re-application after withdrawal
applicationSchema.index({ job: 1, applicant: 1 });

// Indexes for better query performance
applicationSchema.index({ employer: 1, status: 1, createdAt: -1 });
applicationSchema.index({ applicant: 1, status: 1, createdAt: -1 });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ status: 1, createdAt: -1 });

// Virtual for formatted expected salary
applicationSchema.virtual("formattedExpectedSalary").get(function () {
  if (!this.expectedSalary || !this.expectedSalary.amount) return null;

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  const currency =
    this.expectedSalary.currency === "USD" ? "$" : this.expectedSalary.currency;
  return `${currency}${formatNumber(this.expectedSalary.amount)} per ${this.expectedSalary.period}`;
});

// Pre-save middleware to add timeline entry
applicationSchema.pre("save", function (next) {
  if (this.isNew) {
    this.timeline.push({
      action: "applied",
      performedBy: this.applicant,
      timestamp: new Date(),
    });
  } else if (this.isModified("status")) {
    this.timeline.push({
      action: this.status,
      timestamp: new Date(),
    });
  }
  next();
});

// Method to update status with timeline
applicationSchema.methods.updateStatus = function (
  newStatus,
  performedBy,
  note,
) {
  this.status = newStatus;
  this.timeline.push({
    action: newStatus,
    performedBy,
    note,
    timestamp: new Date(),
  });
  return this.save();
};

// Method to add note
applicationSchema.methods.addNote = function (
  author,
  content,
  isPrivate = true,
) {
  this.notes.push({
    author,
    content,
    isPrivate,
    createdAt: new Date(),
  });
  return this.save();
};

// Method to schedule interview
applicationSchema.methods.scheduleInterview = function (interviewData) {
  this.interviews.push(interviewData);
  this.status = "interview-scheduled";
  this.timeline.push({
    action: "interview-scheduled",
    timestamp: new Date(),
  });
  return this.save();
};

// Static method to get applications by employer
applicationSchema.statics.getByEmployer = function (employerId, filters = {}) {
  return this.find({ employer: employerId, ...filters })
    .populate("job", "title location jobType")
    .populate("applicant", "firstName lastName email profile jobSeekerProfile")
    .sort({ createdAt: -1 });
};

// Static method to get applications by applicant
applicationSchema.statics.getByApplicant = function (
  applicantId,
  filters = {},
) {
  return this.find({ applicant: applicantId, ...filters })
    .populate("job", "title companyName location jobType salary")
    .populate("employer", "firstName lastName employerProfile.companyName")
    .sort({ createdAt: -1 });
};

// Static method to get application statistics
applicationSchema.statics.getStats = function (employerId) {
  return this.aggregate([
    { $match: { employer: new mongoose.Types.ObjectId(employerId) } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
};

module.exports = mongoose.model("Application", applicationSchema);
