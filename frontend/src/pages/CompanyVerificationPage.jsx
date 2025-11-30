import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

function CompanyVerificationPage({ onNavigate }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    companyWebsite: "",
    linkedinUrl: "",
    additionalInfo: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
      setTimeout(() => {
        onNavigate("employer-dashboard");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to submit verification request");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onNavigate("home");
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8">
          <button
            onClick={() => onNavigate("employer-dashboard")}
            className="text-slate-400 hover:text-primary-400 mb-4 flex items-center gap-2"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-2">
            Company <span className="gradient-text">Verification</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Verify your company to build trust with job seekers
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl animate-scale-in">
            <p className="text-green-400 flex items-center gap-2">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Verification request submitted! We'll review it within 2-3
              business days.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="glass-card p-6 rounded-xl mb-6">
          <h2 className="text-xl font-bold text-slate-100 mb-4">
            Why Get Verified?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 mb-1">
                  Build Trust
                </h3>
                <p className="text-sm text-slate-400">
                  Show candidates your company is legitimate
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 mb-1">
                  More Applications
                </h3>
                <p className="text-sm text-slate-400">
                  Verified companies receive 3x more applications
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
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
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 mb-1">Stand Out</h3>
                <p className="text-sm text-slate-400">
                  Get a verified badge on your job postings
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
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
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 mb-1">
                  Priority Support
                </h3>
                <p className="text-sm text-slate-400">
                  Get faster response from our support team
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 rounded-xl">
          <h2 className="text-xl font-bold text-slate-100 mb-6">
            Submit Verification Request
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Company Website <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                name="companyWebsite"
                value={formData.companyWebsite}
                onChange={handleChange}
                className="input-field"
                placeholder="https://yourcompany.com"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                We'll verify domain ownership
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                LinkedIn Company Page (Optional)
              </label>
              <input
                type="url"
                name="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={handleChange}
                className="input-field"
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Additional Information (Optional)
              </label>
              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                className="input-field min-h-[100px]"
                placeholder="Any additional information that can help us verify your company..."
                maxLength={500}
              />
              <p className="text-xs text-slate-500 mt-1">
                {formData.additionalInfo.length}/500 characters
              </p>
            </div>

            <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
              <p className="text-sm text-slate-300">
                <strong className="text-primary-400">Note:</strong> Our team
                will review your company information, website, and social media
                presence. The verification process typically takes 2-3 business
                days.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Verification Request"}
            </button>
          </div>
        </form>
      </div>

      <Footer user={user} />
    </div>
  );
}

export default CompanyVerificationPage;
