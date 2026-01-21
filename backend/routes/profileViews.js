const express = require("express");
const { body, validationResult } = require("express-validator");
const ProfileView = require("../models/ProfileView");
const User = require("../models/User");
const { auth, requireAnyUserType } = require("../middleware/auth");
const NotificationService = require("../services/notificationService");

const router = express.Router();

// @route   POST /api/profile-views
// @desc    Record a profile view
// @access  Public (can be anonymous)
router.post(
  "/",
  [
    body("profileOwnerId").isMongoId().withMessage("Invalid profile owner ID"),
    body("viewerType")
      .isIn(["jobseeker", "employer", "anonymous"])
      .withMessage("Invalid viewer type"),
    body("source")
      .optional()
      .isIn([
        "job_application",
        "search_results",
        "direct_link",
        "recommendation",
        "company_browse",
        "other",
      ])
      .withMessage("Invalid source"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        profileOwnerId,
        viewerType,
        source = "other",
        jobId,
        searchQuery,
        referrer,
      } = req.body;

      // Check if profile owner exists
      const profileOwner = await User.findById(profileOwnerId);
      if (!profileOwner) {
        return res.status(404).json({
          success: false,
          message: "Profile not found",
        });
      }

      // Get viewer ID from auth if available
      let viewerId = null;
      if (req.headers.authorization) {
        try {
          const jwt = require("jsonwebtoken");
          const token = req.headers.authorization.replace("Bearer ", "");
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          viewerId = decoded.userId;
        } catch (error) {
          // Invalid token, treat as anonymous
          viewerId = null;
        }
      }

      // Get IP and user agent for anonymous tracking
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get("User-Agent");

      // Record the view
      const profileView = await ProfileView.recordView(
        profileOwnerId,
        viewerId,
        viewerType,
        {
          source,
          jobId,
          searchQuery,
          referrer,
          ipAddress,
          userAgent,
        }
      );

      // Send notification if it's a new view from an employer
      if (profileView && viewerId && viewerType === "employer") {
        try {
          await NotificationService.notifyProfileViewed(
            profileOwnerId,
            viewerId,
            viewerType
          );
        } catch (notificationError) {
          console.error(
            "Failed to send profile view notification:",
            notificationError
          );
          // Don't fail the view recording if notification fails
        }
      }

      res.json({
        success: true,
        message: "Profile view recorded",
        data: { profileView },
      });
    } catch (error) {
      console.error("Record profile view error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/profile-views/stats/:userId
// @desc    Get profile view statistics for a user
// @access  Private (Own profile only)
router.get("/stats/:userId", [auth], async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is requesting their own stats
    if (req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only view your own profile statistics.",
      });
    }

    const { period = "all", days = 30 } = req.query;

    let startDate = null;
    if (period !== "all") {
      startDate = new Date();
      if (period === "week") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === "month") {
        startDate.setDate(startDate.getDate() - 30);
      } else if (period === "custom" && days) {
        startDate.setDate(startDate.getDate() - parseInt(days));
      }
    }

    // Get total view count
    const totalViews = await ProfileView.getViewCount(userId, { startDate });

    // Get view count by viewer type
    const employerViews = await ProfileView.getViewCount(userId, {
      startDate,
      viewerType: "employer",
    });

    const jobseekerViews = await ProfileView.getViewCount(userId, {
      startDate,
      viewerType: "jobseeker",
    });

    const anonymousViews = await ProfileView.getViewCount(userId, {
      startDate,
      viewerType: "anonymous",
    });

    // Get detailed statistics
    const detailedStats = await ProfileView.getViewStats(userId);

    // Get recent views
    const recentViews = await ProfileView.getRecentViews(userId, 10);

    // Get view trends
    const viewTrends = await ProfileView.getViewTrends(
      userId,
      parseInt(days) || 30
    );

    res.json({
      success: true,
      data: {
        totalViews,
        viewsByType: {
          employer: employerViews,
          jobseeker: jobseekerViews,
          anonymous: anonymousViews,
        },
        detailedStats,
        recentViews,
        viewTrends,
        period,
      },
    });
  } catch (error) {
    console.error("Get profile view stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/profile-views/recent/:userId
// @desc    Get recent profile views for a user
// @access  Private (Own profile only)
router.get("/recent/:userId", [auth], async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is requesting their own views
    if (req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own profile views.",
      });
    }

    const { limit = 20 } = req.query;

    const recentViews = await ProfileView.getRecentViews(
      userId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: { recentViews },
    });
  } catch (error) {
    console.error("Get recent profile views error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/profile-views/trends/:userId
// @desc    Get profile view trends for a user
// @access  Private (Own profile only)
router.get("/trends/:userId", [auth], async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is requesting their own trends
    if (req.user.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own profile trends.",
      });
    }

    const { days = 30 } = req.query;

    const viewTrends = await ProfileView.getViewTrends(userId, parseInt(days));

    res.json({
      success: true,
      data: { viewTrends, days: parseInt(days) },
    });
  } catch (error) {
    console.error("Get profile view trends error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
