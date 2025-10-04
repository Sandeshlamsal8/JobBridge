import { useState } from "react"

function Header({ onNavigate, user, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-dark-700/30 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button
              onClick={() => onNavigate && onNavigate("home")}
              className="text-2xl lg:text-3xl font-bold gradient-text hover:scale-105 transition-transform duration-300"
            >
              JobBridge
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-8 xl:space-x-12">
            <button
              onClick={() => onNavigate && onNavigate("job-listings")}
              className="text-slate-300 hover:text-primary-400 transition-all duration-300 font-medium relative group"
            >
              Find Jobs
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 transition-all duration-300 group-hover:w-full"></span>
            </button>
            <a href="#companies" className="text-slate-300 hover:text-primary-400 transition-all duration-300 font-medium relative group">
              Companies
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#about" className="text-slate-300 hover:text-primary-400 transition-all duration-300 font-medium relative group">
              About
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#contact" className="text-slate-300 hover:text-primary-400 transition-all duration-300 font-medium relative group">
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>

          {/* Desktop Auth Buttons / User Menu */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-3 glass-card px-4 py-2 rounded-xl hover:bg-primary-400/10 transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <span className="text-slate-300 font-medium">{user.firstName}</span>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 glass-card rounded-xl shadow-glow-lg border border-dark-700/50 py-2 z-50">
                    <div className="px-4 py-2 border-b border-dark-700/50">
                      <p className="text-sm font-medium text-slate-300">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                      <p className="text-xs text-primary-400 capitalize">{user.userType}</p>
                    </div>
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-primary-400/10 hover:text-primary-400 transition-colors">
                      Profile Settings
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-primary-400/10 hover:text-primary-400 transition-colors">
                      Account Settings
                    </button>
                    <div className="border-t border-dark-700/50 mt-2 pt-2">
                      <button
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => onNavigate && onNavigate("login")}
                  className="text-slate-300 hover:text-primary-400 transition-all duration-300 font-semibold px-4 py-2 rounded-lg hover:bg-primary-400/10"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate && onNavigate("signup")}
                  className="btn-primary"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-300 hover:text-primary-400 transition-colors p-2 rounded-lg hover:bg-primary-400/10"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-6 border-t border-dark-700/30 animate-slide-up">
            <div className="flex flex-col space-y-6">
              <button
                onClick={() => onNavigate && onNavigate("job-listings")}
                className="text-slate-300 hover:text-primary-400 transition-colors font-medium text-lg text-left"
              >
                Find Jobs
              </button>
              <a href="#companies" className="text-slate-300 hover:text-primary-400 transition-colors font-medium text-lg">
                Companies
              </a>
              <a href="#about" className="text-slate-300 hover:text-primary-400 transition-colors font-medium text-lg">
                About
              </a>
              <a href="#contact" className="text-slate-300 hover:text-primary-400 transition-colors font-medium text-lg">
                Contact
              </a>
              <div className="pt-6 border-t border-dark-700/30 space-y-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 glass-card rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-slate-300 font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-primary-400 capitalize">{user.userType}</p>
                      </div>
                    </div>
                    <button
                      onClick={onLogout}
                      className="w-full text-red-400 hover:text-red-300 transition-colors font-semibold py-3 text-lg"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onNavigate && onNavigate("login")}
                      className="w-full text-slate-300 hover:text-primary-400 transition-colors font-semibold py-3 text-lg"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => onNavigate && onNavigate("signup")}
                      className="w-full btn-primary text-lg"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
