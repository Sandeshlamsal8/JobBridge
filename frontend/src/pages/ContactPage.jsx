import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

function ContactPage({ onNavigate }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onNavigate("home");
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />

      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-100 mb-6">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Have questions, feedback, or need support? We'd love to hear from
              you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slide-up">
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary-400"
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
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      Email Us
                    </h3>
                    <p className="text-slate-400">
                      We'll respond within 24 hours
                    </p>
                  </div>
                </div>
                <p className="text-primary-400 font-medium">
                  jobbridge123@gmail.com
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      Response Time
                    </h3>
                    <p className="text-slate-400">Quick and reliable support</p>
                  </div>
                </div>
                <p className="text-slate-300">
                  Usually within 2-4 hours during business days
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      Office
                    </h3>
                    <p className="text-slate-400">Our headquarters</p>
                  </div>
                </div>
                <p className="text-slate-300">
                  Remote-first company
                  <br />
                  Serving clients worldwide
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer user={user} onNavigate={onNavigate} />
    </div>
  );
}

export default ContactPage;
