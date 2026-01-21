import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

// Hero Section Component
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/20 via-transparent to-transparent"></div>
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative max-w-7xl mx-auto text-center animate-fade-in">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-100 mb-8 leading-tight">
            Welcome to
            <span className="gradient-text block mt-2">JobBridge</span>
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 mb-16 max-w-4xl mx-auto leading-relaxed">
            Your gateway to connecting talented professionals with amazing
            opportunities. Whether you're seeking your next career move or
            looking to hire top talent,
            <span className="text-primary-400 font-semibold">
              {" "}
              JobBridge
            </span>{" "}
            is here to help you succeed.
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center max-w-md mx-auto">
            <button
              onClick={() => (window.location.href = "#features")}
              className="btn-primary text-lg px-8 py-4 w-full sm:w-auto flex items-center justify-center gap-2"
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Learn More
            </button>
            <button
              onClick={() => (window.location.href = "#contact")}
              className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto flex items-center justify-center gap-2"
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
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Get in Touch
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Features Section Component
function Features() {
  const features = [
    {
      icon: (
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
      title: "Smart Job Matching",
      description:
        "Our intelligent platform connects job seekers with opportunities that match their skills and career goals.",
    },
    {
      icon: (
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      title: "Top Companies",
      description:
        "Access exclusive opportunities from leading companies across various industries and sectors.",
    },
    {
      icon: (
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      title: "Quick Applications",
      description:
        "Streamlined application process that saves time for both job seekers and employers.",
    },
    {
      icon: (
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: "Trusted Platform",
      description:
        "A secure and reliable platform that prioritizes user privacy and data protection.",
    },
  ];

  return (
    <section
      id="features"
      className="py-20 lg:py-32 bg-dark-900 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16 lg:mb-20 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-100 mb-6">
            Why Choose <span className="gradient-text">JobBridge</span>?
          </h2>
          <p className="text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            We provide a comprehensive platform that makes career connections
            simple, efficient, and successful for everyone involved.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group glass-card-hover p-6 lg:p-8 rounded-2xl text-center animate-scale-in hover:scale-105 transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-primary-500/20 to-primary-600/20 text-primary-400 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-slate-100 mb-4">
                {feature.title}
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section Component
function CTA({ onNavigate }) {
  return (
    <section
      id="contact"
      className="py-20 lg:py-32 bg-gradient-to-br from-dark-800 to-dark-900 relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-900/10 via-transparent to-transparent"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative animate-fade-in">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-100 mb-6">
          Ready to Get <span className="gradient-text">Started</span>?
        </h2>
        <p className="text-lg lg:text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Join thousands of professionals who trust JobBridge to advance their
          careers and connect with amazing opportunities.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center max-w-md mx-auto">
          <button
            onClick={() => onNavigate("contact")}
            className="btn-primary text-lg px-8 py-4 w-full sm:w-auto flex items-center justify-center gap-2"
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
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact Us
          </button>
          <button
            onClick={() => onNavigate("signup")}
            className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto flex items-center justify-center gap-2"
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Sign Up
          </button>
        </div>
      </div>
    </section>
  );
}

function HomePage({ onNavigate }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onNavigate("home");
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />
      <Hero />
      <Features />
      <CTA onNavigate={onNavigate} />
      <Footer user={user} onNavigate={onNavigate} />
    </div>
  );
}

export default HomePage;
