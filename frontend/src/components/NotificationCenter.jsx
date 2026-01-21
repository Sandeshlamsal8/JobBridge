import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "./ToastContainer";

function NotificationCenter({ isOpen, onClose }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all"); // all, unread, read

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isOpen, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("jobbridge_token");
      const params = new URLSearchParams({
        limit: "20",
        skip: "0",
      });

      if (filter === "unread") params.append("status", "unread");
      if (filter === "read") params.append("status", "read");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/notifications?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/notifications/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId
              ? { ...notif, status: "read", readAt: new Date() }
              : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/notifications/mark-all-read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => ({
            ...notif,
            status: "read",
            readAt: new Date(),
          }))
        );
        setUnreadCount(0);
        showToast("All notifications marked as read", "success");
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const archiveNotification = async (notificationId) => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/notifications/${notificationId}/archive`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((notif) => notif._id !== notificationId)
        );
        if (
          notifications.find((n) => n._id === notificationId)?.status ===
          "unread"
        ) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        showToast("Notification archived", "info");
      }
    } catch (error) {
      console.error("Failed to archive notification:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.status === "unread") {
      markAsRead(notification._id);
    }

    if (notification.actionUrl) {
      // Navigate to the action URL
      window.location.href = notification.actionUrl;
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      application_status_update: "📋",
      new_job_match: "💼",
      interview_scheduled: "📅",
      interview_reminder: "⏰",
      new_application: "📝",
      job_posted: "🚀",
      profile_viewed: "👁️",
      message_received: "💬",
      system_announcement: "📢",
      account_security: "🔒",
    };
    return icons[type] || "🔔";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "text-slate-400",
      medium: "text-blue-400",
      high: "text-orange-400",
      urgent: "text-red-400",
    };
    return colors[priority] || "text-slate-400";
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-20"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-dark-900 border border-dark-700 shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-dark-800 to-dark-850 border-b border-dark-600">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <p className="text-xs text-slate-400">{unreadCount} unread</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-dark-700 rounded-lg transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 bg-dark-700/50 p-1 rounded-lg">
            {[
              { key: "all", label: "All", count: notifications.length },
              { key: "unread", label: "Unread", count: unreadCount },
              {
                key: "read",
                label: "Read",
                count: notifications.filter((n) => n.status === "read").length,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  filter === tab.key
                    ? "bg-primary-500 text-white shadow-lg"
                    : "text-slate-400 hover:text-slate-200 hover:bg-dark-600"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`ml-1 text-xs ${
                      filter === tab.key ? "text-primary-100" : "text-slate-500"
                    }`}
                  >
                    ({tab.count})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Mark all as read
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: "calc(85vh - 200px)" }}
        >
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-400 mt-3 font-medium">
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <h3 className="text-slate-300 font-medium mb-1">
                No notifications
              </h3>
              <p className="text-slate-500 text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification, index) => (
                <div
                  key={notification._id}
                  className={`relative p-4 border-b border-dark-700/50 hover:bg-dark-800/50 transition-all cursor-pointer group ${
                    notification.status === "unread"
                      ? "bg-gradient-to-r from-primary-500/5 to-transparent border-l-2 border-l-primary-500"
                      : ""
                  } ${index === notifications.length - 1 ? "border-b-0" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        notification.status === "unread"
                          ? "bg-primary-500/20 text-primary-400"
                          : "bg-dark-700 text-slate-400"
                      }`}
                    >
                      <span className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3
                          className={`font-semibold text-sm leading-tight ${
                            notification.status === "unread"
                              ? "text-slate-100"
                              : "text-slate-300"
                          }`}
                        >
                          {notification.title}
                        </h3>

                        {/* Priority indicator and actions */}
                        <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              notification.priority === "urgent"
                                ? "bg-red-400"
                                : notification.priority === "high"
                                ? "bg-orange-400"
                                : notification.priority === "medium"
                                ? "bg-blue-400"
                                : "bg-slate-500"
                            }`}
                          ></div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveNotification(notification._id);
                            }}
                            className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
                            title="Archive notification"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-400 text-sm leading-relaxed mb-2 line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">
                          {notification.timeAgo}
                        </span>
                        {notification.status === "unread" && (
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
                            <span className="text-xs text-primary-400 font-medium">
                              New
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 bg-dark-800/50 border-t border-dark-700">
            <div className="text-center">
              <p className="text-xs text-slate-500">
                Showing {notifications.length} notification
                {notifications.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationCenter;
