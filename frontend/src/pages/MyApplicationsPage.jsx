import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { applicationAPI } from "../utils/api";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

function MyApplicationsPage({ onNavigate }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filter !== "all") {
        filters.status = filter;
      }

      const data = await applicationAPI.getMyApplications(filters);

      if (data.success) {
        setApplications(data.data.applications);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      pending: "text-yellow-400 bg-yellow-400/20 border-yellow-400/30",
      reviewed: "text-blue-400 bg-blue-400/20 border-blue-400/30",
      "interview-scheduled":
        "text-green-400 bg-green-400/20 border-green-400/30",
      accepted: "text-green-500 bg-green-500/20 border-green-500/30",
      rejected: "text-red-400 bg-red-400/20 border-red-400/30",
    };
    return (
      statusMap[status] || "text-slate-400 bg-slate-400/20 border-slate-400/30"
    );
  };

  const getStatusLabel = (status) => {
    return status
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const handleLogout = async () => {
    await logout();
    onNavigate("home");
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8">
          <button
            onClick={() => onNavigate("jobseeker-dashboard")}
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
            My <span className="gradient-text">Applications</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Track all your job applications
          </p>
        </div>

        <div className="glass-card p-4 rounded-xl mb-6">
          <div className="flex flex-wrap gap-3">
            {[
              { value: "all", label: "All Applications" },
              { value: "pending", label: "Pending" },
              { value: "reviewed", label: "Reviewed" },
              { value: "interview-scheduled", label: "Interview" },
              { value: "accepted", label: "Accepted" },
              { value: "rejected", label: "Rejected" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === item.value
                    ? "bg-primary-500 text-white"
                    : "bg-dark-800 text-slate-400 hover:bg-dark-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="glass-card p-6 rounded-xl animate-pulse">
                <div className="h-6 bg-slate-700 rounded mb-3 w-3/4"></div>
                <div className="h-4 bg-slate-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application._id}
                className="glass-card p-6 rounded-xl hover:shadow-glow transition-all"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-slate-100 mb-1">
                          {application.job?.title}
                        </h3>
                        <p className="text-slate-400">
                          {application.job?.companyName}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          application.status
                        )}`}
                      >
                        {getStatusLabel(application.status)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
                      <span className="flex items-center gap-1">
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
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                        </svg>
                        {application.job?.location}
                      </span>
                      <span>•</span>
                      <span>{application.job?.jobType}</span>
                      <span>•</span>
                      <span>Applied {formatDate(application.createdAt)}</span>
                    </div>

                    {application.coverLetter && (
                      <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                        {application.coverLetter}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          onNavigate(`job-details/${application.job?._id}`)
                        }
                        className="btn-secondary px-4 py-2 text-sm"
                      >
                        View Job
                      </button>
                      <button
                        onClick={() =>
                          onNavigate(`application-details/${application._id}`)
                        }
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        View Details
                      </button>
                      {application.status === "pending" && (
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to withdraw this application?"
                              )
                            ) {
                              // Handle withdrawal
                            }
                          }}
                          className="btn-secondary px-4 py-2 text-sm text-red-400 hover:bg-red-400/10"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 rounded-xl text-center">
            <svg
              className="w-20 h-20 text-slate-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-2xl font-bold text-slate-300 mb-2">
              No applications found
            </h3>
            <p className="text-slate-400 mb-6">
              {filter === "all"
                ? "Start applying to jobs"
                : `No ${filter} applications`}
            </p>
            <button
              onClick={() => onNavigate("job-listings")}
              className="btn-primary px-6 py-3"
            >
              Browse Jobs
            </button>
          </div>
        )}
      </div>

      <Footer user={user} />
    </div>
  );
}

export default MyApplicationsPage;
