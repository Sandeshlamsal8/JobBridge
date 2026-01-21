const express = require("express");
const { body, validationResult } = require("express-validator");
const NotificationService = require("../services/notificationService");
const { auth, requireAnyUserType } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get("/", [auth], async (req, res) => {
  try {
    const {
      status,
      type,
      limit = 20,
      skip = 0,
      includeArchived = false,
    } = req.query;

    const options = {
      status,
      type,
      limit: parseInt(limit),
      skip: parseInt(skip),
      includeArchived: includeArchived === "true",
    };

    const notifications = await NotificationService.getUserNotifications(
      req.user.userId,
      options
    );

    res.json({
      success: true,
      data: { notifications },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notifications count
// @access  Private
router.get("/unread-count", [auth], async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put("/:id/read", [auth], async (req, res) => {
  try {
    const notification = await NotificationService.markAsRead(
      req.params.id,
      req.user.userId
    );

    res.json({
      success: true,
      message: "Notification marked as read",
      data: { notification },
    });
  } catch (error) {
    console.error("Mark as read error:", error);

    if (error.message === "Notification not found") {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put("/mark-all-read", [auth], async (req, res) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user.userId);

    res.json({
      success: true,
      message: "All notifications marked as read",
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   PUT /api/notifications/:id/archive
// @desc    Archive notification
// @access  Private
router.put("/:id/archive", [auth], async (req, res) => {
  try {
    const notification = await NotificationService.archiveNotification(
      req.params.id,
      req.user.userId
    );

    res.json({
      success: true,
      message: "Notification archived",
      data: { notification },
    });
  } catch (error) {
    console.error("Archive notification error:", error);

    if (error.message === "Notification not found") {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/notifications/test
// @desc    Create test notification (development only)
// @access  Private
router.post("/test", [auth], async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      message: "Test endpoint not available in production",
    });
  }

  try {
    const {
      title,
      message,
      type = "system_announcement",
      priority = "medium",
    } = req.body;

    const notification = await NotificationService.createNotification({
      recipientId: req.user.userId,
      type,
      title: title || "Test Notification",
      message: message || "This is a test notification",
      priority,
      sendEmail: false,
    });

    res.json({
      success: true,
      message: "Test notification created",
      data: { notification },
    });
  } catch (error) {
    console.error("Create test notification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/notifications/system-announcement
// @desc    Create system announcement (admin only - future feature)
// @access  Private (Admin)
router.post(
  "/system-announcement",
  [
    auth,
    body("title")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Title must be between 1 and 100 characters"),
    body("message")
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage("Message must be between 1 and 500 characters"),
    body("targetUserType")
      .optional()
      .isIn(["jobseeker", "employer"])
      .withMessage("Invalid target user type"),
    body("priority")
      .optional()
      .isIn(["low", "medium", "high", "urgent"])
      .withMessage("Invalid priority"),
  ],
  async (req, res) => {
    try {
      // TODO: Add admin role check when admin system is implemented
      // For now, allow any authenticated user to create system announcements in development
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { title, message, targetUserType, priority = "medium" } = req.body;

      const notifications = await NotificationService.createSystemAnnouncement(
        title,
        message,
        targetUserType,
        priority
      );

      res.json({
        success: true,
        message: "System announcement created",
        data: {
          notificationsCreated: notifications.length,
          targetUserType: targetUserType || "all users",
        },
      });
    } catch (error) {
      console.error("Create system announcement error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

module.exports = router;
