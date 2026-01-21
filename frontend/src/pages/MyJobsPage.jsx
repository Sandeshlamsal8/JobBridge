import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "../components/ToastContainer";
import { isCompanyProfileComplete } from "../utils/companyProfile";
import { jobAPI } from "../utils/api";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";

function MyJobsPage({ onNavigate }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const { toast, showInfo, hideToast } = useToast();
  const [filter, setFilter] = useState("all");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0,
  });

  // Check if company profile is complete
  useEffect(() => {
    if (!isCompanyProfileComplete(user)) {
      showToast(
        "Please complete your company profile to manage jobs",
        "warning",
        5000
      );
      onNavigate("employer-dashboard");
      return;
    }
  }, [user, onNavigate]);

  useEffect(() => {
    fetchJobs();
  }, [filter]);

  const fetchJobs = async (page = 1) => {
    try {
      setLoading(true);
      const filters = { page, limit: 10 };
      if (filter !== "all") {
        filters.status = filter;
      }

      const data = await jobAPI.getMyJobs(filters);

      if (data.success) {
        setJobs(data.data.jobs);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      active: "text-green-400 bg-green-400/20 border-green-400/30",
      paused: "text-yellow-400 bg-yellow-400/20 border-yellow-400/30",
      closed: "text-red-400 bg-red-400/20 border-red-400/30",
      draft: "text-slate-400 bg-slate-400/20 border-slate-400/30",
    };
    return (
      statusMap[status] || "text-slate-400 bg-slate-400/20 border-slate-400/30"
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleLogout = async () => {
    await logout();
    onNavigate("home");
  };

  const handleCloseJob = async (jobId) => {
    if (
      !confirm(
        "Are you sure you want to close this job listing? This will stop accepting new applications."
      )
    ) {
      return;
    }

    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/jobs/${jobId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "closed" }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast("Job listing closed successfully!", "success", 3000);
        fetchJobs(); // Refresh the jobs list
      } else {
        showToast(data.message || "Failed to close job", "error", 3000);
      }
    } catch (error) {
      console.error("Error closing job:", error);
      showToast("Network error. Please try again.", "error", 3000);
    }
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-2">
                My <span className="gradient-text">Job Postings</span>
              </h1>
              <p className="text-slate-300 text-lg">
                Manage all your job listings
              </p>
            </div>
            <button
              onClick={() => onNavigate("post-job")}
              className="btn-primary px-6 py-3 flex items-center gap-2"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Post New Job
            </button>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl mb-6">
          <div className="flex flex-wrap gap-3">
            {[
              { value: "all", label: "All Jobs" },
              { value: "active", label: "Active" },
              { value: "paused", label: "Paused" },
              { value: "closed", label: "Closed" },
              { value: "draft", label: "Draft" },
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
        ) : jobs.length > 0 ? (
          <>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  className="glass-card p-6 rounded-xl hover:shadow-glow transition-all"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-100 mb-2">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap gap-3 text-sm text-slate-400">
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
                              {job.location}
                            </span>
                            <span>•</span>
                            <span>{job.jobType}</span>
                            <span>•</span>
                            <span>Posted {formatDate(job.createdAt)}</span>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            job.status
                          )}`}
                        >
                          {job.status}
                        </span>
                      </div>

                      <div className="flex gap-6 text-sm text-slate-400 mb-4">
                        <span className="flex items-center gap-2">
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
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <strong className="text-slate-300">
                            {job.applicationCount || 0}
                          </strong>{" "}
                          Applications
                        </span>
                        <span className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          <strong className="text-slate-300">
                            {job.viewCount || 0}
                          </strong>{" "}
                          Views
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => onNavigate(`edit-job/${job._id}`)}
                          className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit Job
                        </button>
                        <button
                          onClick={() => onNavigate("applications")}
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
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          Applications ({job.applicationCount || 0})
                        </button>
                        {job.status !== "closed" && (
                          <button
                            onClick={() => handleCloseJob(job._id)}
                            className="btn-secondary px-4 py-2 text-sm text-red-400 hover:text-red-300 flex items-center gap-2"
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Close Job
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => fetchJobs(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="btn-secondary px-4 py-2 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 glass-card rounded-lg">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchJobs(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="btn-secondary px-4 py-2 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
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
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0h-8m8 0v2a2 2 0 01-2 2H8a2 2 0 01-2-2V8m8-2h2a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h2"
              />
            </svg>
            <h3 className="text-2xl font-bold text-slate-300 mb-2">
              No job postings found
            </h3>
            <p className="text-slate-400 mb-6">
              {filter === "all"
                ? "Create your first job posting"
                : `No ${filter} jobs found`}
            </p>
            <button
              onClick={() => onNavigate("post-job")}
              className="btn-primary px-6 py-3"
            >
              Post Your First Job
            </button>
          </div>
        )}
      </div>

      <Footer user={user} onNavigate={onNavigate} />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}

export default MyJobsPage;
