import { useState, useEffect } from "react";
import NotificationCenter from "../NotificationCenter";

function Header({ onNavigate, user, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Set up polling for unread count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

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

  // Get navigation items based on user type
  const getNavigationItems = () => {
    if (!user) {
      return [];
    } else if (user.userType === "jobseeker") {
      return [
        {
          label: "My Applications",
          onClick: () => handleNavigation("my-applications"),
        },
        {
          label: "Saved Jobs",
          onClick: () => handleNavigation("saved-jobs"),
        },
      ];
    } else if (user.userType === "employer") {
      return [];
    }
    return [];
  };

  const navigationItems = getNavigationItems();

  const handleNavigation = (path) => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    onNavigate && onNavigate(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark-800/95 backdrop-blur-xl border-b border-dark-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => handleNavigation("home")}
              className="text-2xl font-bold gradient-text hover:opacity-80 transition-opacity"
            >
              JobBridge
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-dark-700/50 rounded-lg transition-all"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationOpen(true)}
                    className={`relative p-2 rounded-lg transition-all ${
                      unreadCount > 0
                        ? "text-primary-400 bg-primary-500/10 hover:bg-primary-500/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-dark-700/50"
                    }`}
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
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <>
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                        <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 animate-ping"></span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Action Button - Post Job for Employers */}
                {user.userType === "employer" && (
                  <button
                    onClick={() => handleNavigation("post-job")}
                    className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Post Job
                  </button>
                )}

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-dark-700/50 rounded-lg transition-all"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                      {user.profile?.avatar ? (
                        <img
                          src={`http://localhost:5000${user.profile.avatar}`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-200">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">
                        {user.userType}
                      </p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-dark-800 border border-dark-700 rounded-lg shadow-xl py-2">
                      <button
                        onClick={() => handleNavigation("profile-settings")}
                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-dark-700/50 hover:text-white transition-colors flex items-center gap-2"
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Profile Settings
                      </button>
                      <button
                        onClick={() => handleNavigation("account-settings")}
                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-dark-700/50 hover:text-white transition-colors flex items-center gap-2"
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
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Account Settings
                      </button>
                      <div className="my-1 border-t border-dark-700"></div>
                      <button
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 transition-colors flex items-center gap-2"
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
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavigation("login")}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavigation("signup")}
                  className="btn-primary px-5 py-2 text-sm"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-dark-700/50 rounded-lg transition-all"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-dark-700/50">
            <div className="flex flex-col space-y-1">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="text-left px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-dark-700/50 rounded-lg transition-all"
                >
                  {item.label}
                </button>
              ))}

              {user ? (
                <>
                  <div className="pt-3 mt-3 border-t border-dark-700/50">
                    <div className="flex items-center gap-3 px-4 py-2.5 mb-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                        {user.profile?.avatar ? (
                          <img
                            src={`http://localhost:5000${user.profile.avatar}`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">
                          {user.userType}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavigation("profile-settings")}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-dark-700/50 rounded-lg transition-all"
                    >
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="pt-3 mt-3 border-t border-dark-700/50 space-y-1">
                  <button
                    onClick={() => handleNavigation("login")}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-dark-700/50 rounded-lg transition-all"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleNavigation("signup")}
                    className="w-full btn-primary text-sm py-2.5"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </header>
  );
}

export default Header;
