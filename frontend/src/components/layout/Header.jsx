import { useState } from "react";

function Header({ onNavigate, user, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Get navigation items based on user type
  const getNavigationItems = () => {
    if (!user) {
      return [
        { label: "Find Jobs", onClick: () => handleNavigation("job-listings") },
        { label: "For Employers", onClick: () => handleNavigation("signup") },
      ];
    } else if (user.userType === "jobseeker") {
      return [
        { label: "Find Jobs", onClick: () => handleNavigation("job-listings") },
        {
          label: "My Applications",
          onClick: () => handleNavigation("my-applications"),
        },
        {
          label: "Dashboard",
          onClick: () => handleNavigation("jobseeker-dashboard"),
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
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
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
                      {user.userType === "employer" && (
                        <>
                          <button
                            onClick={() =>
                              handleNavigation("company-verification")
                            }
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-dark-700/50 hover:text-white transition-colors flex items-center gap-2"
                          >
                            <svg
                              className="w-4 h-4 text-purple-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                              />
                            </svg>
                            Company Verification
                          </button>
                          <div className="my-1 border-t border-dark-700"></div>
                        </>
                      )}
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
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
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
    </header>
  );
}

export default Header;
