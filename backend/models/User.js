const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Don't include password in queries by default
    },
    userType: {
      type: String,
      enum: ["jobseeker", "employer"],
      required: [true, "User type is required"],
      default: "jobseeker",
    },
    profile: {
      avatar: {
        data: { type: Buffer, default: null },
        contentType: { type: String, default: null },
        filename: { type: String, default: null },
        size: { type: Number, default: null },
        uploadedAt: { type: Date, default: null },
      },
      phone: {
        type: String,
        default: null,
      },
      location: {
        type: String,
        default: null,
      },
      bio: {
        type: String,
        maxlength: [500, "Bio cannot exceed 500 characters"],
        default: null,
      },
      website: {
        type: String,
        default: null,
      },
      profileCompletionPromptShown: {
        type: Boolean,
        default: false,
      },
    },
    // Job seeker specific fields
    jobSeekerProfile: {
      headline: {
        type: String,
        default: null,
      },
      resume: {
        type: String, // URL to resume file
        default: null,
      },
      skills: [
        {
          type: String,
          trim: true,
        },
      ],
      experience: {
        type: String,
        enum: ["entry", "mid", "senior", "executive"],
        default: null,
      },
      experienceLevel: {
        type: String,
        enum: ["entry", "mid", "senior", "executive"],
        default: null,
      },
      experienceHistory: [
        {
          id: { type: Number },
          title: { type: String },
          company: { type: String },
          location: { type: String },
          startDate: { type: String },
          endDate: { type: String },
          current: { type: Boolean, default: false },
          description: { type: String },
        },
      ],
      education: [
        {
          id: { type: Number },
          degree: { type: String },
          institution: { type: String },
          location: { type: String },
          startDate: { type: String },
          endDate: { type: String },
          current: { type: Boolean, default: false },
          description: { type: String },
        },
      ],
      certifications: [
        {
          id: { type: Number },
          name: { type: String },
          issuer: { type: String },
          issueDate: { type: String },
          expiryDate: { type: String },
          credentialId: { type: String },
          url: { type: String },
        },
      ],
      expectedSalary: {
        min: { type: Number, default: null },
        max: { type: Number, default: null },
        currency: { type: String, default: "USD" },
        period: { type: String, default: "yearly" },
      },
      jobPreferences: {
        jobTypes: [
          {
            type: String,
            enum: [
              "full-time",
              "part-time",
              "contract",
              "internship",
              "freelance",
            ],
          },
        ],
        workModes: [
          {
            type: String,
            enum: ["remote", "hybrid", "onsite"],
          },
        ],
        categories: [
          {
            type: String,
          },
        ],
        remoteWork: {
          type: Boolean,
          default: false,
        },
        willingToRelocate: {
          type: Boolean,
          default: false,
        },
      },
    },
    // Employer specific fields
    employerProfile: {
      companyName: {
        type: String,
        default: null,
      },
      companySize: {
        type: String,
        enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
        default: null,
      },
      industry: {
        type: String,
        default: null,
      },
      companyDescription: {
        type: String,
        maxlength: [1000, "Company description cannot exceed 1000 characters"],
        default: null,
      },
      companyWebsite: {
        type: String,
        default: null,
      },
      companyLocation: {
        type: String,
        default: null,
      },
      foundedYear: {
        type: String,
        default: null,
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notificationSettings: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      applicationUpdates: {
        type: Boolean,
        default: true,
      },
      jobAlerts: {
        type: Boolean,
        default: false,
      },
      marketingEmails: {
        type: Boolean,
        default: false,
      },
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for avatar URL
userSchema.virtual("avatarUrl").get(function () {
  if (this.profile?.avatar?.data) {
    const timestamp = this.profile.avatar.uploadedAt ? 
      new Date(this.profile.avatar.uploadedAt).getTime() : 
      Date.now();
    return `/api/users/avatar/${this._id}?t=${timestamp}`;
  }
  return null;
});

// Virtual for account lock status
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Index for better query performance
userSchema.index({ userType: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  });
};

// Method to update last login
userSchema.methods.updateLastLogin = function () {
  return this.updateOne({ lastLogin: new Date() });
};

// Method to get user data for API responses (excludes avatar buffer)
userSchema.methods.toProfileJSON = function () {
  const obj = this.toObject();
  
  // Remove avatar buffer data
  if (obj.profile?.avatar) {
    const { data, ...avatarMeta } = obj.profile.avatar;
    obj.profile.avatar = this.avatarUrl; // Replace with URL
  }
  
  return obj;
};

// Static method to find user by email with password
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email }).select("+password");
};

module.exports = mongoose.model("User", userSchema);
