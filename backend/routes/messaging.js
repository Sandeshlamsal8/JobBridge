const express = require("express");
const { body, validationResult } = require("express-validator");
const messageService = require("../services/messageService");
const AttachmentService = require("../services/attachmentService");
const Conversation = require("../models/Conversation");
const { auth, requireAnyUserType } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// ============================================================================
// CONVERSATION ROUTES
// ============================================================================

// @route   POST /api/messaging/conversations
// @desc    Create a new conversation for an application
// @access  Private (Job seekers and employers)
router.post(
  "/conversations",
  [
    auth,
    requireAnyUserType(["jobseeker", "employer"]),
    body("applicationId").isMongoId().withMessage("Invalid application ID"),
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

      const { applicationId } = req.body;

      const conversation = await messageService.createConversation(
        applicationId,
        req.user.userId,
      );

      res.status(201).json({
        success: true,
        message: "Conversation created successfully",
        data: { conversation },
      });
    } catch (error) {
      console.error("Create conversation error:", error);

      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// @route   GET /api/messaging/conversations
// @desc    Get all conversations for the current user
// @access  Private
router.get(
  "/conversations",
  [auth, requireAnyUserType(["jobseeker", "employer"])],
  async (req, res) => {
    try {
      const userId = req.user.userId;

      // Find conversations where user is a participant
      const conversations = await Conversation.find({
        $or: [
          { "participants.jobSeeker": userId },
          { "participants.employer": userId },
        ],
      })
        .populate("participants.jobSeeker", "firstName lastName email")
        .populate("participants.employer", "firstName lastName email")
        .populate("applicationId", "status")
        .populate({
          path: "applicationId",
          populate: {
            path: "job",
            select: "title companyName",
          },
        })
        .sort({ updatedAt: -1 });

      // Format conversations for frontend
      const formattedConversations = conversations.map((conv) => {
        const isJobSeeker =
          conv.participants.jobSeeker._id.toString() === userId;
        const otherParticipant = isJobSeeker
          ? conv.participants.employer
          : conv.participants.jobSeeker;

        return {
          _id: conv._id,
          applicationId: conv.applicationId._id,
          jobTitle: conv.applicationId.job?.title || "Unknown Job",
          companyName: conv.applicationId.job?.companyName || "Unknown Company",
          otherParticipant: {
            _id: otherParticipant._id,
            name: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
            email: otherParticipant.email,
          },
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount.get(userId) || 0,
          archived: conv.archived.get(userId) || false,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      });

      res.json({
        success: true,
        data: { conversations: formattedConversations },
      });
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// @route   GET /api/messaging/conversations/:id
// @desc    Get a specific conversation
// @access  Private
router.get(
  "/conversations/:id",
  [auth, requireAnyUserType(["jobseeker", "employer"])],
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const conversationId = req.params.id;

      const conversation = await Conversation.findById(conversationId)
        .populate("participants.jobSeeker", "firstName lastName email")
        .populate("participants.employer", "firstName lastName email")
        .populate("applicationId", "status")
        .populate({
          path: "applicationId",
          populate: {
            path: "job",
            select: "title companyName",
          },
        });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }

      // Check if user is a participant
      const isParticipant =
        conversation.participants.jobSeeker._id.toString() === userId ||
        conversation.participants.employer._id.toString() === userId;

      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this conversation",
        });
      }

      // Format conversation for frontend
      const isJobSeeker =
        conversation.participants.jobSeeker._id.toString() === userId;
      const otherParticipant = isJobSeeker
        ? conversation.participants.employer
        : conversation.participants.jobSeeker;

      const formattedConversation = {
        _id: conversation._id,
        applicationId: conversation.applicationId._id,
        jobTitle: conversation.applicationId.job?.title || "Unknown Job",
        companyName:
          conversation.applicationId.job?.companyName || "Unknown Company",
        otherParticipant: {
          _id: otherParticipant._id,
          name: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
          email: otherParticipant.email,
        },
        lastMessage: conversation.lastMessage,
        unreadCount: conversation.unreadCount.get(userId) || 0,
        archived: conversation.archived.get(userId) || false,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };

      res.json({
        success: true,
        data: { conversation: formattedConversation },
      });
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// @route   PUT /api/messaging/conversations/:id/read
// @desc    Mark conversation messages as read
// @access  Private
router.put(
  "/conversations/:id/read",
  [auth, requireAnyUserType(["jobseeker", "employer"])],
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const conversationId = req.params.id;

      await messageService.markAsRead(conversationId, userId);

      res.json({
        success: true,
        message: "Messages marked as read",
      });
    } catch (error) {
      console.error("Mark as read error:", error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// ============================================================================
// MESSAGE ROUTES
// ============================================================================

// @route   GET /api/messaging/conversations/:conversationId/messages
// @desc    Get messages for a conversation
// @access  Private
router.get(
  "/conversations/:conversationId/messages",
  [auth, requireAnyUserType(["jobseeker", "employer"])],
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { limit = 50, before } = req.query;

      const messages = await messageService.getMessages(
        conversationId,
        req.user.userId,
        parseInt(limit),
        before ? new Date(before) : null,
      );

      res.json({
        success: true,
        data: { messages },
      });
    } catch (error) {
      console.error("Get messages error:", error);

      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// @route   POST /api/messaging/conversations/:conversationId/messages
// @desc    Send a message in a conversation
// @access  Private
router.post(
  "/conversations/:conversationId/messages",
  [
    auth,
    requireAnyUserType(["jobseeker", "employer"]),
    body("content")
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage("Message content must be between 1 and 5000 characters"),
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

      const { conversationId } = req.params;
      const { content, attachmentIds = [] } = req.body;

      const message = await messageService.sendMessage(
        conversationId,
        req.user.userId,
        content,
        attachmentIds,
      );

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: { message },
      });
    } catch (error) {
      console.error("Send message error:", error);

      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// @route   GET /api/messaging/messages/search
// @desc    Search messages
// @access  Private
router.get(
  "/messages/search",
  [auth, requireAnyUserType(["jobseeker", "employer"])],
  async (req, res) => {
    try {
      // TODO: Implement message search
      res.json({
        success: true,
        message: "Message search endpoint - to be implemented",
        data: { results: [] },
      });
    } catch (error) {
      console.error("Search messages error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// ============================================================================
// ATTACHMENT ROUTES
// ============================================================================

// @route   POST /api/messaging/attachments
// @desc    Upload an attachment
// @access  Private
router.post(
  "/attachments",
  [auth, requireAnyUserType(["jobseeker", "employer"]), upload.single("file")],
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file provided",
        });
      }

      const { conversationId } = req.body;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: "Conversation ID is required",
        });
      }

      const attachment = await AttachmentService.uploadAttachment(
        req.file,
        req.user.userId,
        conversationId,
      );

      // Trigger malware scan in background
      AttachmentService.scanForMalware(attachment._id.toString()).catch(
        (error) => {
          console.error("Background malware scan failed:", error);
        },
      );

      res.status(201).json({
        success: true,
        message: "Attachment uploaded successfully",
        data: { attachment },
      });
    } catch (error) {
      console.error("Upload attachment error:", error);

      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// @route   GET /api/messaging/attachments/:id
// @desc    Download an attachment
// @access  Private
router.get(
  "/attachments/:id",
  [auth, requireAnyUserType(["jobseeker", "employer"])],
  async (req, res) => {
    try {
      const { stream, filename, fileType, fileSize } =
        await AttachmentService.downloadAttachment(
          req.params.id,
          req.user.userId,
        );

      // Set appropriate headers
      res.set({
        "Content-Type": fileType,
        "Content-Length": fileSize,
        "Content-Disposition": `attachment; filename="${filename}"`,
      });

      // Pipe the stream to response
      stream.pipe(res);
    } catch (error) {
      console.error("Download attachment error:", error);

      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);

// @route   GET /api/messaging/attachments/types/allowed
// @desc    Get allowed file types for client-side validation
// @access  Public
router.get("/attachments/types/allowed", (req, res) => {
  try {
    const allowedTypes = AttachmentService.getAllowedFileTypes();

    res.json({
      success: true,
      data: allowedTypes,
    });
  } catch (error) {
    console.error("Get allowed file types error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
