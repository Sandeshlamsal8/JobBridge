import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { applicationAPI } from "../utils/api";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

function ApplicationsPage({ onNavigate }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

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

      const data = await applicationAPI.getReceivedApplications(filters);

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
    return `${Math.ceil(diffDays / 7)} weeks ago`;
  };

  const filteredApplications = applications.filter(
    (app) =>
      searchTerm === "" ||
      app.applicant?.firstName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      app.applicant?.lastName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            All <span className="gradient-text">Applications</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Review and manage candidate applications
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="glass-card p-4 rounded-xl">
              <div className="flex flex-wrap gap-3">
                {[
                  { value: "all", label: "All" },
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
          </div>

          <div className="glass-card p-4 rounded-xl">
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full"
            />
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
        ) : filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <div
                key={application._id}
                className="glass-card p-6 rounded-xl hover:shadow-glow transition-all"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-lg flex-shrink-0">
                      {application.applicant?.firstName?.[0]}
                      {application.applicant?.lastName?.[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-slate-100">
                            {application.applicant?.firstName}{" "}
                            {application.applicant?.lastName}
                          </h3>
                          <p className="text-slate-400 text-sm">
                            {application.job?.title}
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

                      <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-3">
                        <span>Applied {formatDate(application.createdAt)}</span>
                        {application.applicant?.jobSeekerProfile
                          ?.experience && (
                          <>
                            <span>•</span>
                            <span>
                              {
                                application.applicant.jobSeekerProfile
                                  .experience
                              }{" "}
                              level
                            </span>
                          </>
                        )}
                      </div>

                      {application.coverLetter && (
                        <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                          {application.coverLetter}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() =>
                            onNavigate(
                              `candidate-profile/${application.applicant?._id}`
                            )
                          }
                          className="btn-secondary px-4 py-2 text-sm"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() =>
                            onNavigate(`application-review/${application._id}`)
                          }
                          className="btn-primary px-4 py-2 text-sm"
                        >
                          Review Application
                        </button>
                      </div>
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-2xl font-bold text-slate-300 mb-2">
              No applications found
            </h3>
            <p className="text-slate-400 mb-6">
              {searchTerm
                ? "No applications match your search"
                : filter === "all"
                ? "No applications yet"
                : `No ${filter} applications`}
            </p>
            <button
              onClick={() => onNavigate("my-jobs")}
              className="btn-primary px-6 py-3"
            >
              View My Jobs
            </button>
          </div>
        )}
      </div>

      <Footer user={user} onNavigate={onNavigate} />
    </div>
  );
}

export default ApplicationsPage;
