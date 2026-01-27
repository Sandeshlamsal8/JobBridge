const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [100, "Job title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      maxlength: [5000, "Job description cannot exceed 5000 characters"],
    },
    shortDescription: {
      type: String,
      maxlength: [200, "Short description cannot exceed 200 characters"],
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Company is required"],
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "freelance"],
      required: [true, "Job type is required"],
    },
    workMode: {
      type: String,
      enum: ["remote", "onsite", "hybrid"],
      required: [true, "Work mode is required"],
    },
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior", "executive"],
      required: [true, "Experience level is required"],
    },
    salary: {
      min: {
        type: Number,
        min: [0, "Minimum salary cannot be negative"],
      },
      max: {
        type: Number,
        min: [0, "Maximum salary cannot be negative"],
      },
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
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    responsibilities: [
      {
        type: String,
        trim: true,
      },
    ],
    benefits: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: String,
      required: [true, "Job category is required"],
      enum: [
        "technology",
        "marketing",
        "sales",
        "design",
        "finance",
        "hr",
        "operations",
        "customer-service",
        "healthcare",
        "education",
        "legal",
        "other",
      ],
    },
    applicationDeadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "closed", "expired"],
      default: "active",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    urgent: {
      type: Boolean,
      default: false,
    },
    applicationCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    applicationEmail: {
      type: String,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    externalApplicationUrl: {
      type: String,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for formatted salary
jobSchema.virtual("formattedSalary").get(function () {
  if (!this.salary.min && !this.salary.max) return "Salary not specified";

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  const currency = this.salary.currency === "USD" ? "$" : this.salary.currency;

  if (this.salary.min && this.salary.max) {
    return `${currency}${formatNumber(
      this.salary.min,
    )} - ${currency}${formatNumber(this.salary.max)}`;
  } else if (this.salary.min) {
    return `${currency}${formatNumber(this.salary.min)}+`;
  } else if (this.salary.max) {
    return `Up to ${currency}${formatNumber(this.salary.max)}`;
  }
});

// Virtual for time since posted
jobSchema.virtual("timeAgo").get(function () {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return `${Math.ceil(diffDays / 30)} months ago`;
});

// Indexes for better query performance
jobSchema.index({ company: 1, status: 1 });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ location: 1, status: 1 });
jobSchema.index({ jobType: 1, status: 1 });
jobSchema.index({ experienceLevel: 1, status: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ title: "text", description: "text", skills: "text" });

// Pre-save middleware
jobSchema.pre("save", async function (next) {
  // Generate short description if not provided
  if (!this.shortDescription && this.description) {
    this.shortDescription = this.description.substring(0, 150) + "...";
  }

  // Validate salary range
  if (this.salary.min && this.salary.max && this.salary.min > this.salary.max) {
    next(new Error("Minimum salary cannot be greater than maximum salary"));
  }

  // Ensure company name is properly set
  if (!this.companyName || this.companyName.includes("undefined")) {
    try {
      const User = require("./User");
      const user = await User.findById(this.company);
      if (user) {
        if (user.userType === "employer" && user.employerProfile?.companyName) {
          this.companyName = user.employerProfile.companyName;
        } else if (user.firstName && user.lastName) {
          this.companyName = `${user.firstName} ${user.lastName}`;
        }
      }
    } catch (error) {
      console.error("Error setting company name:", error);
    }
  }

  next();
});

// Method to increment view count
jobSchema.methods.incrementViewCount = function () {
  this.viewCount += 1;
  return this.save();
};

// Method to increment application count
jobSchema.methods.incrementApplicationCount = function () {
  this.applicationCount += 1;
  return this.save();
};

// Static method to find active jobs
jobSchema.statics.findActiveJobs = function (filters = {}) {
  return this.find({ status: "active", ...filters })
    .populate(
      "company",
      "firstName lastName employerProfile.companyName employerProfile.companySize",
    )
    .sort({ createdAt: -1 });
};

// Static method to search jobs
jobSchema.statics.searchJobs = function (searchTerm, filters = {}) {
  // Build the base search query with $or for text matching
  const searchQuery = {
    status: "active",
    $or: [
      { title: { $regex: searchTerm, $options: "i" } },
      { description: { $regex: searchTerm, $options: "i" } },
      { skills: { $regex: searchTerm, $options: "i" } },
      { companyName: { $regex: searchTerm, $options: "i" } },
    ],
  };

  // Apply additional filters (location, jobType, etc.)
  // These are AND conditions with the search
  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null) {
      searchQuery[key] = filters[key];
    }
  });

  return this.find(searchQuery)
    .populate(
      "company",
      "firstName lastName employerProfile.companyName employerProfile.companySize",
    )
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model("Job", jobSchema);
