import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

function EmployerDashboard({ onNavigate }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    scheduledInterviews: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Fetch employer's recent jobs (for display)
      const jobsResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/jobs/employer/my-jobs?limit=3`,
        { headers }
      );
      const jobsData = await jobsResponse.json();

      // Fetch ALL jobs to get accurate active count
      const allJobsResponse = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/jobs/employer/my-jobs?status=active&limit=100`,
        { headers }
      );
      const allJobsData = await allJobsResponse.json();

      // Fetch application statistics
      const statsResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/applications/stats/employer`,
        { headers }
      );
      const statsData = await statsResponse.json();

      // Fetch recent applications
      const applicationsResponse = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/applications/employer/received?limit=3`,
        { headers }
      );
      const applicationsData = await applicationsResponse.json();

      if (jobsData.success) {
        const jobs = jobsData.data.jobs.map((job) => ({
          ...job,
          posted: formatDate(job.createdAt),
        }));
        setRecentJobs(jobs);
      }

      // Calculate active jobs count from all jobs
      if (allJobsData.success) {
        const activeJobsCount = allJobsData.data.pagination?.totalJobs || 0;
        setStats((prev) => ({
          ...prev,
          activeJobs: activeJobsCount,
        }));
      }

      if (statsData.success) {
        const appStats = statsData.data.stats;
        setStats((prev) => ({
          ...prev,
          totalApplications: appStats.total || 0,
          scheduledInterviews: appStats["interview-scheduled"] || 0,
        }));
      }

      if (applicationsData.success) {
        const applications = applicationsData.data.applications.map((app) => ({
          ...app,
          candidateName: `${app.applicant?.firstName || ""} ${
            app.applicant?.lastName || ""
          }`.trim(),
          jobTitle: app.job?.title || "N/A",
          appliedDate: formatDate(app.createdAt),
          experience:
            app.applicant?.jobSeekerProfile?.experience?.length > 0
              ? `${
                  app.applicant.jobSeekerProfile.experience[0]
                    .yearsOfExperience || "N/A"
                } years`
              : "N/A",
          avatar: app.applicant?.profile?.avatar || "/placeholder-user.jpg",
        }));
        setRecentApplications(applications);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60)
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} week${
        Math.floor(diffDays / 7) !== 1 ? "s" : ""
      } ago`;
    return `${Math.floor(diffDays / 30)} month${
      Math.floor(diffDays / 30) !== 1 ? "s" : ""
    } ago`;
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "active":
        return "text-green-400 bg-green-400/20 border-green-400/30";
      case "paused":
        return "text-yellow-400 bg-yellow-400/20 border-yellow-400/30";
      case "draft":
        return "text-slate-400 bg-slate-400/20 border-slate-400/30";
      case "closed":
        return "text-red-400 bg-red-400/20 border-red-400/30";
      case "pending":
        return "text-blue-400 bg-blue-400/20 border-blue-400/30";
      case "reviewed":
        return "text-purple-400 bg-purple-400/20 border-purple-400/30";
      case "shortlisted":
        return "text-cyan-400 bg-cyan-400/20 border-cyan-400/30";
      case "interview-scheduled":
      case "interview-completed":
        return "text-green-400 bg-green-400/20 border-green-400/30";
      case "offered":
        return "text-emerald-400 bg-emerald-400/20 border-emerald-400/30";
      case "hired":
        return "text-green-500 bg-green-500/20 border-green-500/30";
      case "rejected":
      case "withdrawn":
        return "text-red-400 bg-red-400/20 border-red-400/30";
      default:
        return "text-slate-400 bg-slate-400/20 border-slate-400/30";
    }
  };

  const formatStatus = (status) => {
    if (!status) return "N/A";
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleLogout = async () => {
    await logout();
    onNavigate("home");
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Welcome Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-2">
            Welcome back,{" "}
            <span className="gradient-text">{user?.firstName}</span>! 🏢
          </h1>
          <p className="text-slate-300 text-lg">
            Manage your job postings and track applications
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass-card p-4 rounded-xl border-red-500/50 bg-red-500/10 mb-6 animate-scale-in">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-red-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-300 text-sm font-medium">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="ml-auto btn-secondary text-xs px-3 py-1"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg
                className="w-12 h-12 animate-spin text-primary-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-slate-400">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Main Content */}
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-2xl animate-scale-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">
                        Active Jobs
                      </p>
                      <p className="text-3xl font-bold text-slate-100 mt-1">
                        {stats.activeJobs}
                      </p>
                    </div>
                    <div className="p-3 bg-primary-500/20 rounded-xl">
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
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div
                  className="glass-card p-6 rounded-2xl animate-scale-in"
                  style={{ animationDelay: "0.1s" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">
                        Total Applications
                      </p>
                      <p className="text-3xl font-bold text-slate-100 mt-1">
                        {stats.totalApplications}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <svg
                        className="w-6 h-6 text-blue-400"
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
                    </div>
                  </div>
                </div>

                <div
                  className="glass-card p-6 rounded-2xl animate-scale-in"
                  style={{ animationDelay: "0.2s" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">
                        Interviews
                      </p>
                      <p className="text-3xl font-bold text-slate-100 mt-1">
                        {stats.scheduledInterviews}
                      </p>
                      {stats.scheduledInterviews > 0 && (
                        <p className="text-blue-400 text-sm font-medium">
                          Scheduled
                        </p>
                      )}
                    </div>
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <svg
                        className="w-6 h-6 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Job Postings */}
                <div className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-100">
                      Recent Job Postings
                    </h2>
                    <button
                      onClick={() => onNavigate("my-jobs")}
                      className="text-primary-400 hover:text-primary-300 transition-colors text-sm font-semibold"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-4">
                    {recentJobs.length > 0 ? (
                      recentJobs.map((job) => (
                        <div
                          key={job._id}
                          className="glass-card-hover p-4 rounded-xl transition-all duration-300"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-slate-100 mb-1">
                                {job.title}
                              </h3>
                              <p className="text-slate-400 text-sm">
                                {job.location}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                job.status
                              )}`}
                            >
                              {formatStatus(job.status)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-slate-400 mb-3">
                            <div className="flex gap-4">
                              <span>
                                {job.applicationCount || 0} applications
                              </span>
                              <span>{job.viewCount || 0} views</span>
                            </div>
                            <span>{job.posted}</span>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => onNavigate("my-jobs")}
                              className="btn-secondary text-sm px-4 py-2 flex-1"
                            >
                              Manage Jobs
                            </button>
                            <button
                              onClick={() => onNavigate("applications")}
                              className="btn-primary text-sm px-4 py-2 flex-1"
                            >
                              View Applications
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <svg
                          className="w-16 h-16 text-slate-600 mx-auto mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                          />
                        </svg>
                        <p className="text-slate-400 mb-4">
                          No job postings yet
                        </p>
                        <button
                          onClick={() => onNavigate("post-job")}
                          className="btn-primary px-6 py-2"
                        >
                          Post Your First Job
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Applications */}
                <div
                  className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-100">
                      Recent Applications
                    </h2>
                    <button
                      onClick={() => onNavigate("applications")}
                      className="text-primary-400 hover:text-primary-300 transition-colors text-sm font-semibold"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-4">
                    {recentApplications.length > 0 ? (
                      recentApplications.map((application) => (
                        <div
                          key={application._id}
                          className="glass-card-hover p-4 rounded-xl transition-all duration-300"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={application.avatar}
                                alt={application.candidateName}
                                className="w-10 h-10 rounded-full bg-slate-700 object-cover"
                                onError={(e) => {
                                  e.target.src = "/placeholder-user.jpg";
                                }}
                              />
                              <div>
                                <h3 className="font-semibold text-slate-100 text-sm">
                                  {application.candidateName || "Anonymous"}
                                </h3>
                                <p className="text-slate-400 text-xs">
                                  {application.jobTitle}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                application.status
                              )}`}
                            >
                              {formatStatus(application.status)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-slate-400 mb-3">
                            <span>{application.experience} experience</span>
                            <span>{application.appliedDate}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => onNavigate("applications")}
                              className="btn-primary text-xs px-3 py-1 w-full"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <svg
                          className="w-16 h-16 text-slate-600 mx-auto mb-4"
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
                        <p className="text-slate-400">No applications yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer user={user} />
    </div>
  );
}

export default EmployerDashboard;
