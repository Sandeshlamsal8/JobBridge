import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

function AccountSettings({ onNavigate }) {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification settings state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    applicationUpdates: true,
    jobAlerts: false,
    marketingEmails: false,
  });

  // Profile picture state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        // Load notification settings
        if (data.data.user.notificationSettings) {
          setNotifications(data.data.user.notificationSettings);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    onNavigate("home");
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "Image size must be less than 5MB" });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!selectedImage) {
      setMessage({ type: "error", text: "Please select an image first" });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("profilePicture", selectedImage);

      const token = localStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/profile-picture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: "Profile picture updated successfully",
        });
        setSelectedImage(null);
        setImagePreview(null);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to update profile picture",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Password changed successfully" });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to change password",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationToggle = async (key) => {
    const newValue = !notifications[key];
    setNotifications({ ...notifications, [key]: newValue });

    try {
      const token = localStorage.getItem("jobbridge_token");
      await fetch(
        `${import.meta.env.VITE_API_URL}/users/notification-settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ [key]: newValue }),
        }
      );
    } catch (error) {
      console.error("Failed to update notification settings:", error);
      setNotifications({ ...notifications, [key]: !newValue });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setMessage({ type: "error", text: 'Please type "DELETE" to confirm' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/account`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        await logout();
        onNavigate("home");
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to delete account",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Back Button */}
        <button
          onClick={() =>
            onNavigate(
              user?.userType === "employer"
                ? "employer-dashboard"
                : "jobseeker-dashboard"
            )
          }
          className="flex items-center gap-2 text-slate-400 hover:text-primary-400 transition-colors mb-6"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            Account Settings
          </h1>
          <p className="text-slate-400">
            Manage your account preferences and security
          </p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div
            className={`glass-card p-4 rounded-xl mb-6 ${
              message.type === "success"
                ? "border-green-500/50 bg-green-500/10"
                : "border-red-500/50 bg-red-500/10"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                message.type === "success" ? "text-green-300" : "text-red-300"
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Picture Section */}
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Profile Picture
            </h2>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-3xl overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  `${user?.firstName?.[0]}${user?.lastName?.[0]}`
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <label
                  htmlFor="profilePicture"
                  className="btn-secondary px-4 py-2 text-sm cursor-pointer inline-block"
                >
                  Choose Image
                </label>
                {selectedImage && (
                  <button
                    onClick={handleUploadProfilePicture}
                    disabled={isLoading}
                    className="btn-primary px-4 py-2 text-sm ml-3"
                  >
                    {isLoading ? "Uploading..." : "Upload"}
                  </button>
                )}
                <p className="text-slate-400 text-sm mt-2">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Change Password
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="input-field"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary px-6 py-2"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* Notification Settings Section */}
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary-400"
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
              Notification Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-200">
                    Email Notifications
                  </p>
                  <p className="text-sm text-slate-400">
                    Receive email updates about your account
                  </p>
                </div>
                <button
                  onClick={() => handleNotificationToggle("emailNotifications")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.emailNotifications
                      ? "bg-primary-500"
                      : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.emailNotifications
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Job Seeker Notifications */}
              {user?.userType === "jobseeker" && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-200">
                        Application Updates
                      </p>
                      <p className="text-sm text-slate-400">
                        Get notified about application status changes
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleNotificationToggle("applicationUpdates")
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications.applicationUpdates
                          ? "bg-primary-500"
                          : "bg-slate-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications.applicationUpdates
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-200">Job Alerts</p>
                      <p className="text-sm text-slate-400">
                        Receive alerts for new job postings matching your
                        preferences
                      </p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle("jobAlerts")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications.jobAlerts
                          ? "bg-primary-500"
                          : "bg-slate-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications.jobAlerts
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </>
              )}

              {/* Employer Notifications */}
              {user?.userType === "employer" && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-200">
                        New Applications
                      </p>
                      <p className="text-sm text-slate-400">
                        Get notified when candidates apply to your jobs
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleNotificationToggle("applicationUpdates")
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications.applicationUpdates
                          ? "bg-primary-500"
                          : "bg-slate-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications.applicationUpdates
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-200">
                        Job Performance
                      </p>
                      <p className="text-sm text-slate-400">
                        Receive updates about your job posting performance
                      </p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle("jobAlerts")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications.jobAlerts
                          ? "bg-primary-500"
                          : "bg-slate-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications.jobAlerts
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-200">Marketing Emails</p>
                  <p className="text-sm text-slate-400">
                    Receive promotional content and updates
                  </p>
                </div>
                <button
                  onClick={() => handleNotificationToggle("marketingEmails")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.marketingEmails
                      ? "bg-primary-500"
                      : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.marketingEmails
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Delete Account Section */}
          <div className="glass-card p-6 rounded-2xl border-red-500/30">
            <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Danger Zone
            </h2>
            <p className="text-slate-400 mb-4">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-all font-semibold"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl max-w-md w-full border-red-500/50">
            <h3 className="text-xl font-bold text-red-400 mb-4">
              Delete Account
            </h3>
            <p className="text-slate-300 mb-4">
              This action cannot be undone. This will permanently delete your
              account and remove all your data.
            </p>
            <p className="text-slate-400 mb-4">
              Please type <span className="font-bold text-white">DELETE</span>{" "}
              to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="input-field mb-4"
              placeholder="Type DELETE"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="btn-secondary flex-1 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading || deleteConfirmText !== "DELETE"}
                className="flex-1 py-2 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all font-semibold"
              >
                {isLoading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer user={user} />
    </div>
  );
}

export default AccountSettings;
