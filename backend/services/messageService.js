const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Application = require("../models/Application");
const mongoose = require("mongoose");
const NotificationService = require("./notificationService");

/**
 * MessageService - Handles conversation and message operations
 * for the messaging feature
 */
class MessageService {
  /**
   * Create a conversation for an application with validation
   * Implements idempotency - returns existing conversation if already exists
   *
   * @param {string} applicationId - The application ID to create conversation for
   * @param {string} initiatorId - The user ID initiating the conversation
   * @returns {Promise<Object>} The conversation object
   * @throws {Error} Authorization error if application is not active or user is not a participant
   *
   * Validates Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   */
  async createConversation(applicationId, initiatorId) {
    // Validate ObjectId format
    if (
      !mongoose.Types.ObjectId.isValid(applicationId) ||
      !mongoose.Types.ObjectId.isValid(initiatorId)
    ) {
      const error = new Error("Invalid application ID or initiator ID");
      error.statusCode = 400;
      throw error;
    }

    // Check if conversation already exists for this application (idempotency)
    const existingConversation =
      await Conversation.findByApplicationId(applicationId);
    if (existingConversation) {
      return existingConversation;
    }

    // Fetch the application with populated fields
    const application = await Application.findById(applicationId)
      .populate("job", "title companyName")
      .populate("applicant", "firstName lastName email")
      .populate("employer", "firstName lastName email");

    if (!application) {
      const error = new Error("Application not found");
      error.statusCode = 404;
      throw error;
    }

    // Verify initiator is a participant (either job seeker or employer)
    const isJobSeeker =
      application.applicant._id.toString() === initiatorId.toString();
    const isEmployer =
      application.employer._id.toString() === initiatorId.toString();

    if (!isJobSeeker && !isEmployer) {
      const error = new Error(
        "You do not have permission to create a conversation for this application",
      );
      error.statusCode = 403;
      throw error;
    }

    // Check if application has active status
    // Active statuses based on design: submitted, under_review, interviewing
    // Note: The Application model uses different status values, so we need to map them
    // Based on the Application model, active statuses should be:
    // - pending (equivalent to submitted)
    // - reviewed (equivalent to under_review)
    // - shortlisted (equivalent to under_review)
    // - interview-scheduled (equivalent to interviewing)
    // - interview-completed (equivalent to interviewing)
    const activeStatuses = [
      "pending",
      "reviewed",
      "shortlisted",
      "interview-scheduled",
      "interview-completed",
    ];

    if (!activeStatuses.includes(application.status)) {
      const error = new Error(
        "Cannot create conversation. Application must have an active status (pending, reviewed, shortlisted, interview-scheduled, or interview-completed)",
      );
      error.statusCode = 403;
      throw error;
    }

    // Create the conversation
    const conversation = await Conversation.create({
      applicationId: application._id,
      participants: {
        jobSeeker: application.applicant._id,
        employer: application.employer._id,
      },
      lastMessage: {
        content: null,
        timestamp: null,
        senderId: null,
      },
      unreadCount: new Map([
        [application.applicant._id.toString(), 0],
        [application.employer._id.toString(), 0],
      ]),
      archived: new Map([
        [application.applicant._id.toString(), false],
        [application.employer._id.toString(), false],
      ]),
    });

    // Update the application with the conversation ID
    application.conversationId = conversation._id;
    await application.save();

    // Populate the conversation before returning
    await conversation.populate(
      "participants.jobSeeker",
      "firstName lastName email",
    );
    await conversation.populate(
      "participants.employer",
      "firstName lastName email",
    );
    await conversation.populate("applicationId", "job status");

    return conversation;
  }

  /**
   * Send a message in a conversation
   *
   * @param {string} conversationId - The conversation ID
   * @param {string} senderId - The user ID sending the message
   * @param {string} content - The message content
   * @param {Array} attachmentIds - Optional array of attachment IDs
   * @returns {Promise<Object>} The created message
   * @throws {Error} Authorization error if user is not a participant
   */
  async sendMessage(conversationId, senderId, content, attachmentIds = []) {
    // Validate ObjectId format
    if (
      !mongoose.Types.ObjectId.isValid(conversationId) ||
      !mongoose.Types.ObjectId.isValid(senderId)
    ) {
      const error = new Error("Invalid conversation ID or sender ID");
      error.statusCode = 400;
      throw error;
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      const error = new Error("Message content cannot be empty");
      error.statusCode = 400;
      throw error;
    }

    // Fetch the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      const error = new Error("Conversation not found");
      error.statusCode = 404;
      throw error;
    }

    // Verify sender is a participant
    const isParticipant =
      conversation.participants.jobSeeker.toString() === senderId ||
      conversation.participants.employer.toString() === senderId;

    if (!isParticipant) {
      const error = new Error(
        "You do not have permission to send messages in this conversation",
      );
      error.statusCode = 403;
      throw error;
    }

    // Create the message
    const message = await Message.create({
      conversationId,
      senderId,
      content: content.trim(),
      attachments: [], // TODO: Handle attachments
      status: "sent",
    });

    // Update conversation's lastMessage
    conversation.lastMessage = {
      content: content.trim(),
      timestamp: message.createdAt,
      senderId: senderId,
    };

    // Increment unread count for the recipient
    const recipientId =
      conversation.participants.jobSeeker.toString() === senderId
        ? conversation.participants.employer.toString()
        : conversation.participants.jobSeeker.toString();

    const currentUnreadCount = conversation.unreadCount.get(recipientId) || 0;
    conversation.unreadCount.set(recipientId, currentUnreadCount + 1);

    // Update conversation timestamp
    conversation.updatedAt = new Date();

    await conversation.save();

    // Populate sender details
    await message.populate("senderId", "firstName lastName email");

    // Create in-app notification for recipient (no email)
    try {
      // Get sender name for notification
      const senderName = `${message.senderId.firstName} ${message.senderId.lastName}`;

      // Get job title from application
      await conversation.populate({
        path: "applicationId",
        populate: { path: "job", select: "title" },
      });
      const jobTitle = conversation.applicationId?.job?.title || "a job";

      await NotificationService.createNotification({
        recipientId: recipientId,
        senderId: senderId,
        type: "message_received",
        title: "New message",
        message: `${senderName} sent you a message about ${jobTitle}`,
        data: {
          conversationId: conversation._id,
          messageId: message._id,
          metadata: {
            preview:
              content.trim().substring(0, 50) +
              (content.trim().length > 50 ? "..." : ""),
          },
        },
        priority: "medium",
        actionUrl: `messages/${conversation._id}`,
        sendEmail: false, // Don't send email notifications for messages
      });
    } catch (notificationError) {
      // Don't fail message sending if notification fails
      console.error(
        "Failed to create message notification:",
        notificationError,
      );
    }

    return message;
  }

  /**
   * Get messages for a conversation with pagination
   *
   * @param {string} conversationId - The conversation ID
   * @param {string} userId - The user ID requesting messages
   * @param {number} limit - Number of messages to return (default: 50)
   * @param {Date} before - Get messages before this date (for pagination)
   * @returns {Promise<Array>} Array of messages
   * @throws {Error} Authorization error if user is not a participant
   */
  async getMessages(conversationId, userId, limit = 50, before = null) {
    // Validate ObjectId format
    if (
      !mongoose.Types.ObjectId.isValid(conversationId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      const error = new Error("Invalid conversation ID or user ID");
      error.statusCode = 400;
      throw error;
    }

    // Fetch the conversation to verify participation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      const error = new Error("Conversation not found");
      error.statusCode = 404;
      throw error;
    }

    // Verify user is a participant
    const isParticipant =
      conversation.participants.jobSeeker.toString() === userId ||
      conversation.participants.employer.toString() === userId;

    if (!isParticipant) {
      const error = new Error(
        "You do not have permission to view messages in this conversation",
      );
      error.statusCode = 403;
      throw error;
    }

    // Fetch messages
    const messages = await Message.findByConversation(
      conversationId,
      limit,
      before,
    );

    // Return in chronological order (oldest first)
    return messages.reverse();
  }

  /**
   * Mark messages as read for a user in a conversation
   *
   * @param {string} conversationId - The conversation ID
   * @param {string} userId - The user ID marking messages as read
   * @returns {Promise<Object>} Updated conversation
   * @throws {Error} Authorization error if user is not a participant
   */
  async markAsRead(conversationId, userId) {
    // Validate ObjectId format
    if (
      !mongoose.Types.ObjectId.isValid(conversationId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      const error = new Error("Invalid conversation ID or user ID");
      error.statusCode = 400;
      throw error;
    }

    // Fetch the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      const error = new Error("Conversation not found");
      error.statusCode = 404;
      throw error;
    }

    // Verify user is a participant
    const isParticipant =
      conversation.participants.jobSeeker.toString() === userId ||
      conversation.participants.employer.toString() === userId;

    if (!isParticipant) {
      const error = new Error(
        "You do not have permission to access this conversation",
      );
      error.statusCode = 403;
      throw error;
    }

    // Reset unread count for this user
    conversation.unreadCount.set(userId, 0);
    await conversation.save();

    return conversation;
  }
}

module.exports = new MessageService();
