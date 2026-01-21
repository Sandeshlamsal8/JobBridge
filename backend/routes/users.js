const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const upload = require("../middleware/upload");
const path = require("path");
const {
  calculateJobSeekerProfileCompletion,
  calculateEmployerProfileCompletion,
  shouldShowProfileCompletion,
  markProfileCompletionPromptShown,
} = require("../utils/profileCompletion");

// @route   GET /api/users/avatar/:userId
// @desc    Serve profile picture from database
// @access  Public
router.get("/avatar/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user || !user.profile.avatar || !user.profile.avatar.data) {
      return res.status(404).json({
        success: false,
        message: "Profile picture not found",
      });
    }

    // Set appropriate headers
    res.set({
      "Content-Type": user.profile.avatar.contentType,
      "Content-Length": user.profile.avatar.size,
      "Cache-Control": "public, max-age=86400", // Cache for 1 day
    });

    // Send the image data
    res.send(user.profile.avatar.data);
  } catch (error) {
    console.error("Error serving profile picture:", error);
    res.status(500).json({
      success: false,
      message: "Server error while serving profile picture",
    });
  }
});

// @route   POST /api/users/profile-picture
// @desc    Upload profile picture
// @access  Private
router.post(
  "/profile-picture",
  auth,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Generate unique filename
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const extension = path.extname(req.file.originalname);
      const filename = `profile-${uniqueSuffix}${extension}`;

      // Save profile picture data to database
      user.profile.avatar = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: filename,
        size: req.file.size,
        uploadedAt: new Date(),
      };

      await user.save();

      res.json({
        success: true,
        message: "Profile picture updated successfully",
        data: {
          avatar: `/api/users/avatar/${user._id}`, // URL to serve the image
          filename: filename,
          size: req.file.size,
        },
      });
    } catch (error) {
      console.error("Profile picture upload error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while uploading profile picture",
      });
    }
  }
);

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send password change confirmation email
    try {
      const {
        sendPasswordResetConfirmation,
      } = require("../utils/emailService");
      await sendPasswordResetConfirmation(user.email, user.firstName);
    } catch (emailError) {
      console.error(
        "Failed to send password change confirmation email:",
        emailError
      );
      // Don't fail the password change if email fails
    }

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while changing password",
    });
  }
});

// @route   PUT /api/users/notification-settings
// @desc    Update notification settings
// @access  Private
router.put("/notification-settings", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Initialize notificationSettings if it doesn't exist
    if (!user.notificationSettings) {
      user.notificationSettings = {};
    }

    // Update notification settings
    Object.keys(req.body).forEach((key) => {
      user.notificationSettings[key] = req.body[key];
    });

    user.markModified("notificationSettings");
    await user.save();

    res.json({
      success: true,
      message: "Notification settings updated successfully",
      data: {
        notificationSettings: user.notificationSettings,
      },
    });
  } catch (error) {
    console.error("Update notification settings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating notification settings",
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account and all related data
// @access  Private
router.delete("/account", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Import models for cascading delete
    const Job = require("../models/Job");
    const Application = require("../models/Application");

    // Delete profile picture if exists
    if (user.profile.avatar) {
      const imagePath = path.join(__dirname, "..", user.profile.avatar);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // If employer, delete all their job postings and related applications
    if (user.userType === "employer") {
      // Find all jobs posted by this employer
      const employerJobs = await Job.find({ company: req.user.id });
      const jobIds = employerJobs.map((job) => job._id);

      // Delete all applications for these jobs
      await Application.deleteMany({ job: { $in: jobIds } });

      // Delete all jobs posted by this employer
      await Job.deleteMany({ company: req.user.id });
    }

    // If job seeker, delete all their applications
    if (user.userType === "jobseeker") {
      await Application.deleteMany({ applicant: req.user.id });
    }

    // Delete user account
    await User.findByIdAndDelete(req.user.id);

    res.json({
      success: true,
      message: "Account and all related data deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting account",
    });
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user profile by ID (for employers to view jobseeker profiles)
// @access  Private (Employers only)
router.get("/:id", auth, async (req, res) => {
  try {
    // Only allow employers to view other users' profiles
    if (req.user.userType !== "employer") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only employers can view candidate profiles.",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Only allow viewing jobseeker profiles
    if (user.userType !== "jobseeker") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Can only view jobseeker profiles.",
      });
    }

    // Remove sensitive information
    const userProfile = user.toObject();
    delete userProfile.password;
    delete userProfile.loginAttempts;
    delete userProfile.lockUntil;

    res.json({
      success: true,
      data: {
        user: userProfile,
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user profile",
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { firstName, lastName, profile, jobSeekerProfile, employerProfile } =
      req.body;

    // Update basic info
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;

    // Update profile fields
    if (profile) {
      if (!user.profile) user.profile = {};

      if (profile.phone !== undefined) user.profile.phone = profile.phone;
      if (profile.location !== undefined)
        user.profile.location = profile.location;
      if (profile.bio !== undefined) user.profile.bio = profile.bio;
      if (profile.website !== undefined) user.profile.website = profile.website;
    }

    // Update job seeker profile
    if (jobSeekerProfile && user.userType === "jobseeker") {
      if (!user.jobSeekerProfile) user.jobSeekerProfile = {};

      if (jobSeekerProfile.headline !== undefined) {
        user.jobSeekerProfile.headline = jobSeekerProfile.headline;
      }
      if (jobSeekerProfile.skills !== undefined) {
        user.jobSeekerProfile.skills = jobSeekerProfile.skills;
      }
      if (jobSeekerProfile.experienceLevel !== undefined) {
        user.jobSeekerProfile.experienceLevel =
          jobSeekerProfile.experienceLevel;
        // Also update the legacy experience field for compatibility
        user.jobSeekerProfile.experience = jobSeekerProfile.experienceLevel;
      }
      if (jobSeekerProfile.expectedSalary !== undefined) {
        user.jobSeekerProfile.expectedSalary = {
          min: jobSeekerProfile.expectedSalary.min || null,
          max: jobSeekerProfile.expectedSalary.max || null,
          currency: jobSeekerProfile.expectedSalary.currency || "USD",
          period: jobSeekerProfile.expectedSalary.period || "yearly",
        };
      }
      if (jobSeekerProfile.jobPreferences !== undefined) {
        if (!user.jobSeekerProfile.jobPreferences) {
          user.jobSeekerProfile.jobPreferences = {};
        }

        if (jobSeekerProfile.jobPreferences.jobTypes !== undefined) {
          user.jobSeekerProfile.jobPreferences.jobTypes =
            jobSeekerProfile.jobPreferences.jobTypes;
        }
        if (jobSeekerProfile.jobPreferences.workModes !== undefined) {
          user.jobSeekerProfile.jobPreferences.workModes =
            jobSeekerProfile.jobPreferences.workModes;
          // Also update remoteWork for compatibility
          user.jobSeekerProfile.jobPreferences.remoteWork =
            jobSeekerProfile.jobPreferences.workModes.includes("remote");
        }
        if (jobSeekerProfile.jobPreferences.categories !== undefined) {
          user.jobSeekerProfile.jobPreferences.categories =
            jobSeekerProfile.jobPreferences.categories;
        }
        if (jobSeekerProfile.jobPreferences.willingToRelocate !== undefined) {
          user.jobSeekerProfile.jobPreferences.willingToRelocate =
            jobSeekerProfile.jobPreferences.willingToRelocate;
        }
      }
      if (jobSeekerProfile.experience !== undefined) {
        user.jobSeekerProfile.experienceHistory = jobSeekerProfile.experience;
      }
      if (jobSeekerProfile.education !== undefined) {
        user.jobSeekerProfile.education = jobSeekerProfile.education;
      }
      if (jobSeekerProfile.certifications !== undefined) {
        user.jobSeekerProfile.certifications = jobSeekerProfile.certifications;
      }
    }

    // Update employer profile
    if (employerProfile && user.userType === "employer") {
      if (!user.employerProfile) user.employerProfile = {};

      if (employerProfile.companyName !== undefined) {
        user.employerProfile.companyName = employerProfile.companyName;
      }
      if (employerProfile.companySize !== undefined) {
        user.employerProfile.companySize = employerProfile.companySize;
      }
      if (employerProfile.industry !== undefined) {
        user.employerProfile.industry = employerProfile.industry;
      }
      if (employerProfile.companyDescription !== undefined) {
        user.employerProfile.companyDescription =
          employerProfile.companyDescription;
      }
      if (employerProfile.companyWebsite !== undefined) {
        user.employerProfile.companyWebsite = employerProfile.companyWebsite;
      }
      if (employerProfile.companyLocation !== undefined) {
        user.employerProfile.companyLocation = employerProfile.companyLocation;
      }
      if (employerProfile.foundedYear !== undefined) {
        user.employerProfile.foundedYear = employerProfile.foundedYear;
      }
    }

    // Mark nested objects as modified for Mongoose
    user.markModified("profile");
    user.markModified("jobSeekerProfile");
    user.markModified("employerProfile");

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/users/profile-completion
// @desc    Get profile completion status
// @access  Private
router.get("/profile-completion", [auth], async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let completionData;

    if (user.userType === "jobseeker") {
      completionData = calculateJobSeekerProfileCompletion(user);
    } else if (user.userType === "employer") {
      completionData = calculateEmployerProfileCompletion(user);
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid user type",
      });
    }

    const shouldShow = shouldShowProfileCompletion(user);

    res.json({
      success: true,
      data: {
        ...completionData,
        shouldShowPrompt: shouldShow,
        userType: user.userType,
      },
    });
  } catch (error) {
    console.error("Get profile completion error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/users/profile-completion/dismiss
// @desc    Mark profile completion prompt as dismissed
// @access  Private
router.post("/profile-completion/dismiss", [auth], async (req, res) => {
  try {
    await markProfileCompletionPromptShown(req.user.userId);

    res.json({
      success: true,
      message: "Profile completion prompt dismissed",
    });
  } catch (error) {
    console.error("Dismiss profile completion error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
