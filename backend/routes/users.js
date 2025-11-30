const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/profile-pictures";
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files (jpeg, jpg, png, gif) are allowed"));
    }
  },
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

      // Delete old profile picture if exists
      if (user.profile.avatar) {
        const oldImagePath = path.join(__dirname, "..", user.profile.avatar);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Save new profile picture path
      user.profile.avatar = `/uploads/profile-pictures/${req.file.filename}`;
      await user.save();

      res.json({
        success: true,
        message: "Profile picture updated successfully",
        data: {
          avatar: user.profile.avatar,
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

module.exports = router;
