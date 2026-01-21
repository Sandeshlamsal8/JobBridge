import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

function SavedJobsPage({ onNavigate }) {
  const { user, logout } = useAuth();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("saved");
  const [sortBy, setSortBy] = useState("createdAt");
  const [stats, setStats] = useState({
    saved: 0,
    applied: 0,
    not_interested: 0,
    total: 0,
  });

  useEffect(() => {
    fetchSavedJobs();
    fetchStats();
  }, [filter, sortBy]);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("jobbridge_token");
      const params = new URLSearchParams({
        status: filter,
        sortBy,
        limit: "20",
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/saved-jobs?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setSavedJobs(data.data.savedJobs);
      } else {
        setError(data.message || "Failed to fetch saved jobs");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/saved-jobs/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const removeSavedJob = async (savedJobId) => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/saved-jobs/${savedJobId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setSavedJobs((prev) => prev.filter((job) => job._id !== savedJobId));
        setStats((prev) => ({
          ...prev,
          [filter]: Math.max(0, prev[filter] - 1),
          total: Math.max(0, prev.total - 1),
        }));
      }
    } catch (error) {
      console.error("Failed to remove saved job:", error);
    }
  };

  const updateJobStatus = async (savedJobId, newStatus) => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/saved-jobs/${savedJobId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        // Refresh the list
        fetchSavedJobs();
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to update job status:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    onNavigate("home");
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "text-slate-400 bg-slate-400/10",
      medium: "text-blue-400 bg-blue-400/10",
      high: "text-orange-400 bg-orange-400/10",
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      saved: "text-blue-400 bg-blue-400/10",
      applied: "text-green-400 bg-green-400/10",
      not_interested: "text-slate-400 bg-slate-400/10",
    };
    return colors[status] || colors.saved;
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => onNavigate("jobseeker-dashboard")}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
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
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">
                Saved <span className="gradient-text">Jobs</span>
              </h1>
              <p className="text-slate-400">
                Manage your saved job opportunities
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Saved",
                value: stats.saved,
                key: "saved",
                color: "text-blue-400",
              },
              {
                label: "Applied",
                value: stats.applied,
                key: "applied",
                color: "text-green-400",
              },
              {
                label: "Not Interested",
                value: stats.not_interested,
                key: "not_interested",
                color: "text-slate-400",
              },
              {
                label: "Total",
                value: stats.total,
                key: "total",
                color: "text-primary-400",
              },
            ].map((stat) => (
              <div key={stat.key} className="glass-card p-4 rounded-xl">
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="glass-card p-6 rounded-3xl mb-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            {/* Status Filter */}
            <div className="flex gap-2">
              {[
                { key: "saved", label: "Saved", count: stats.saved },
                { key: "applied", label: "Applied", count: stats.applied },
                {
                  key: "not_interested",
                  label: "Not Interested",
                  count: stats.not_interested,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === tab.key
                      ? "bg-primary-500 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field text-sm py-2 px-3"
              >
                <option value="createdAt">Date Saved</option>
                <option value="priority">Priority</option>
                <option value="job.title">Job Title</option>
                <option value="job.companyName">Company</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="glass-card p-6 rounded-xl border-red-500/50 bg-red-500/10 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card p-6 rounded-2xl animate-pulse">
                <div className="h-6 bg-slate-700 rounded mb-4"></div>
                <div className="h-4 bg-slate-700 rounded mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Saved Jobs List */}
        {!loading && savedJobs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {savedJobs.map((savedJob) => (
              <div
                key={savedJob._id}
                className="glass-card-hover p-6 rounded-2xl transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-100 mb-2 hover:text-primary-400 transition-colors cursor-pointer">
                      {savedJob.job.title}
                    </h3>
                    <p className="text-primary-400 font-semibold mb-2">
                      {savedJob.job.companyName}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400 mb-3">
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
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {savedJob.job.location}
                      </span>
                      <span className="px-2 py-1 bg-slate-700/50 rounded-full text-xs">
                        {savedJob.job.jobType}
                      </span>
                      <span className="px-2 py-1 bg-slate-700/50 rounded-full text-xs">
                        {savedJob.job.workMode}
                      </span>
                    </div>
                  </div>

                  {/* Priority and Status Badges */}
                  <div className="flex flex-col gap-2 items-end">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        savedJob.priority
                      )}`}
                    >
                      {savedJob.priority} priority
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        savedJob.status
                      )}`}
                    >
                      {savedJob.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {savedJob.notes && (
                  <div className="mb-4 p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-300">{savedJob.notes}</p>
                  </div>
                )}

                {/* Tags */}
                {savedJob.tags && savedJob.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {savedJob.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs border border-primary-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <div className="text-xs text-slate-500">
                    Saved {savedJob.timeAgo}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        onNavigate(`job-details/${savedJob.job._id}`)
                      }
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      View Job
                    </button>

                    {savedJob.status === "saved" && (
                      <button
                        onClick={() => updateJobStatus(savedJob._id, "applied")}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        Mark Applied
                      </button>
                    )}

                    <div className="relative group">
                      <button className="p-2 text-slate-400 hover:text-slate-200 transition-colors">
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
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      <div className="absolute right-0 top-full mt-1 w-48 bg-dark-800 border border-dark-600 rounded-lg shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        {savedJob.status !== "not_interested" && (
                          <button
                            onClick={() =>
                              updateJobStatus(savedJob._id, "not_interested")
                            }
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-dark-700/50 transition-colors"
                          >
                            Not Interested
                          </button>
                        )}
                        {savedJob.status !== "saved" && (
                          <button
                            onClick={() =>
                              updateJobStatus(savedJob._id, "saved")
                            }
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-dark-700/50 transition-colors"
                          >
                            Move to Saved
                          </button>
                        )}
                        <button
                          onClick={() => removeSavedJob(savedJob._id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          Remove from List
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && savedJobs.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💼</div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              No {filter.replace("_", " ")} jobs yet
            </h3>
            <p className="text-slate-400 mb-6">
              {filter === "saved"
                ? "Start saving jobs you're interested in to keep track of them"
                : `No jobs marked as ${filter.replace("_", " ")} yet`}
            </p>
            {filter === "saved" && (
              <button
                onClick={() => onNavigate("job-listings")}
                className="btn-primary px-6 py-3"
              >
                Browse Jobs
              </button>
            )}
          </div>
        )}
      </div>

      <Footer user={user} onNavigate={onNavigate} />
    </div>
  );
}

export default SavedJobsPage;
