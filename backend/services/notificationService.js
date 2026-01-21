const Notification = require("../models/Notification");
const { sendNotificationEmail } = require("../utils/emailService");

class NotificationService {
  // Create a new notification
  static async createNotification({
    recipientId,
    senderId = null,
    type,
    title,
    message,
    data = {},
    priority = "medium",
    actionUrl = null,
    sendEmail = false,
  }) {
    try {
      const notificationData = {
        recipient: recipientId,
        sender: senderId,
        type,
        title,
        message,
        data,
        priority,
        actionUrl,
      };

      const notification = await Notification.createNotification(
        notificationData
      );

      // Send email if requested and user has email notifications enabled
      if (
        sendEmail &&
        notification.recipient.notificationSettings?.emailNotifications
      ) {
        try {
          await sendNotificationEmail(
            notification.recipient.email,
            notification.recipient.firstName,
            title,
            message,
            actionUrl
          );

          notification.emailSent = true;
          notification.emailSentAt = new Date();
          await notification.save();
        } catch (emailError) {
          console.error("Failed to send notification email:", emailError);
          // Don't fail the notification creation if email fails
        }
      }

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Application status update notification
  static async notifyApplicationStatusUpdate(
    application,
    newStatus,
    performedBy
  ) {
    const statusMessages = {
      reviewed: "Your application has been reviewed",
      shortlisted: "Congratulations! You've been shortlisted",
      "interview-scheduled": "Interview scheduled for your application",
      "interview-completed": "Interview completed - awaiting feedback",
      offered: "Congratulations! You've received a job offer",
      hired: "Congratulations! You've been hired",
      rejected: "Application status updated",
      withdrawn: "Application withdrawn",
    };

    const title = statusMessages[newStatus] || "Application status updated";
    const message = `Your application for ${application.job.title} at ${application.job.companyName} has been updated to: ${newStatus}`;

    return this.createNotification({
      recipientId: application.applicant._id,
      senderId: performedBy,
      type: "application_status_update",
      title,
      message,
      data: {
        applicationId: application._id,
        jobId: application.job._id,
        metadata: { newStatus, previousStatus: application.status },
      },
      priority: ["offered", "hired", "shortlisted"].includes(newStatus)
        ? "high"
        : "medium",
      actionUrl: `/applications/${application._id}`,
      sendEmail: true,
    });
  }

  // New application notification for employers
  static async notifyNewApplication(application) {
    const title = "New job application received";
    const message = `${application.applicant.firstName} ${application.applicant.lastName} has applied for ${application.job.title}`;

    return this.createNotification({
      recipientId: application.employer._id,
      senderId: application.applicant._id,
      type: "new_application",
      title,
      message,
      data: {
        applicationId: application._id,
        jobId: application.job._id,
        metadata: {
          applicantName: `${application.applicant.firstName} ${application.applicant.lastName}`,
        },
      },
      priority: "medium",
      actionUrl: `/employer/applications/${application._id}`,
      sendEmail: true,
    });
  }

  // Job match notification for job seekers
  static async notifyJobMatch(userId, job, matchScore = null) {
    const title = "New job matches your profile";
    const message = `Check out this ${job.jobType} position: ${job.title} at ${job.companyName}`;

    return this.createNotification({
      recipientId: userId,
      type: "new_job_match",
      title,
      message,
      data: {
        jobId: job._id,
        metadata: { matchScore, jobType: job.jobType, location: job.location },
      },
      priority: "medium",
      actionUrl: `/jobs/${job._id}`,
      sendEmail: false, // Don't send email for job matches by default
    });
  }

  // Interview scheduled notification
  static async notifyInterviewScheduled(application, interview) {
    const title = "Interview scheduled";
    const message = `Your interview for ${
      application.job.title
    } has been scheduled for ${new Date(
      interview.scheduledAt
    ).toLocaleDateString()}`;

    return this.createNotification({
      recipientId: application.applicant._id,
      senderId: application.employer._id,
      type: "interview_scheduled",
      title,
      message,
      data: {
        applicationId: application._id,
        jobId: application.job._id,
        interviewId: interview._id,
        metadata: {
          scheduledAt: interview.scheduledAt,
          type: interview.type,
          location: interview.location || interview.meetingLink,
        },
      },
      priority: "high",
      actionUrl: `/applications/${application._id}/interview`,
      sendEmail: true,
    });
  }

  // Profile viewed notification
  static async notifyProfileViewed(profileOwnerId, viewerId, viewerType) {
    const title = "Profile viewed";
    const message = `A ${viewerType} has viewed your profile`;

    return this.createNotification({
      recipientId: profileOwnerId,
      senderId: viewerId,
      type: "profile_viewed",
      title,
      message,
      data: {
        metadata: { viewerType },
      },
      priority: "low",
      actionUrl: "/profile",
      sendEmail: false,
    });
  }

  // System announcement
  static async createSystemAnnouncement(
    title,
    message,
    targetUserType = null,
    priority = "medium"
  ) {
    const User = require("../models/User");

    let query = {};
    if (targetUserType) {
      query.userType = targetUserType;
    }

    const users = await User.find(query, "_id");
    const notifications = [];

    for (const user of users) {
      const notification = await this.createNotification({
        recipientId: user._id,
        type: "system_announcement",
        title,
        message,
        priority,
        sendEmail: priority === "high" || priority === "urgent",
      });
      notifications.push(notification);
    }

    return notifications;
  }

  // Get user notifications with pagination
  static async getUserNotifications(userId, options = {}) {
    return Notification.getUserNotifications(userId, options);
  }

  // Get unread count
  static async getUnreadCount(userId) {
    return Notification.getUnreadCount(userId);
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification.markAsRead();
  }

  // Mark all notifications as read
  static async markAllAsRead(userId) {
    return Notification.markAllAsRead(userId);
  }

  // Archive notification
  static async archiveNotification(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification.archive();
  }

  // Clean up old notifications (run as cron job)
  static async cleanupOldNotifications(daysOld = 30) {
    return Notification.cleanupOldNotifications(daysOld);
  }

  // Bulk create notifications (for system announcements)
  static async bulkCreateNotifications(notifications) {
    const results = [];
    for (const notificationData of notifications) {
      try {
        const notification = await this.createNotification(notificationData);
        results.push(notification);
      } catch (error) {
        console.error("Failed to create notification:", error);
        results.push({ error: error.message, data: notificationData });
      }
    }
    return results;
  }
}

module.exports = NotificationService;
