import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import JobSeekerSetupModal from "../components/JobSeekerSetupModal";
import { showToast } from "../components/ToastContainer";

function JobSeekerDashboard({ onNavigate }) {
  const { user, logout, updateUser } = useAuth();
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const [stats, setStats] = useState({
    appliedJobs: 0,
    savedJobs: 0,
    profileViews: 0,
    interviewsScheduled: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkProfileCompletion();
    fetchDashboardData();
  }, []);

  const checkProfileCompletion = () => {
    // Check if basic profile info is missing
    const hasBasicInfo = user?.profile?.phone && user?.profile?.location;
    const hasProfessionalInfo = user?.jobSeekerProfile?.headline && user?.jobSeekerProfile?.experienceLevel;
    const hasSkills = user?.jobSeekerProfile?.skills && user?.jobSeekerProfile?.skills.length > 0;
    const hasJobPreferences = user?.jobSeekerProfile?.jobPreferences?.jobTypes && 
                             user?.jobSeekerProfile?.jobPreferences?.jobTypes.length > 0;

    const isProfileComplete = hasBasicInfo && hasProfessionalInfo && hasSkills && hasJobPreferences;

    if (!isProfileComplete) {
      // Show welcome message for new job seekers
      if (!user?.jobSeekerProfile?.headline) {
        setTimeout(() => {
          showToast(
            "Welcome to JobBridge! Let's set up your profile to find the perfect job opportunities.",
            "info",
            6000
          );
        }, 1000);
      }
      setShowProfileSetup(true);
    }
  };

  const handleProfileSetupComplete = (profileData) => {
    // Update user context with new profile data
    updateUser({
      ...user,
      profile: {
        ...user.profile,
        phone: profileData.phone,
        location: profileData.location,
        bio: profileData.bio,
        website: profileData.website,
      },
      jobSeekerProfile: {
        ...user.jobSeekerProfile,
        headline: profileData.headline,
        experienceLevel: profileData.experienceLevel,
        skills: profileData.skills,
        jobPreferences: {
          ...user.jobSeekerProfile?.jobPreferences,
          jobTypes: profileData.jobTypes,
          workModes: profileData.workModes,
          categories: profileData.categories,
          willingToRelocate: profileData.willingToRelocate,
        },
        expectedSalary: profileData.expectedSalary,
      },
    });

    showToast(
      "Welcome to JobBridge! Your profile is now set up and ready to go.",
      "success",
      5000
    );
    setShowProfileSetup(false);
  };

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

      // Fetch job seeker's applications
      const applicationsResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/applications/my-applications?limit=3`,
        { headers }
      );
      const applicationsData = await applicationsResponse.json();

      // Fetch recommended jobs
      const jobsResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/jobs?limit=3`,
        { headers }
      );
      const jobsData = await jobsResponse.json();

      // Fetch profile view statistics
      const profileViewsResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/profile-views/stats/${
          user.id
        }?period=all`,
        { headers }
      );
      const profileViewsData = await profileViewsResponse.json();

      // Fetch saved jobs count
      const savedJobsResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/saved-jobs/stats`,
        { headers }
      );
      const savedJobsData = await savedJobsResponse.json();

      if (applicationsData.success) {
        const applications = applicationsData.data.applications.map((app) => ({
          ...app,
          jobTitle: app.job?.title || "N/A",
          company:
            app.job?.companyName ||
            app.job?.company?.employerProfile?.companyName ||
            "N/A",
          appliedDate: formatDate(app.createdAt),
          salary: app.job?.salary
            ? `$${app.job.salary.min}k - $${app.job.salary.max}k`
            : "N/A",
          location: app.job?.location || "N/A",
        }));
        setRecentApplications(applications);

        // Calculate stats
        const totalApplications =
          applicationsData.data.pagination?.totalApplications || 0;
        const interviewCount = applications.filter(
          (app) =>
            app.status === "interview-scheduled" ||
            app.status === "interview-completed"
        ).length;

        setStats((prev) => ({
          ...prev,
          appliedJobs: totalApplications,
          interviewsScheduled: interviewCount,
          profileViews: profileViewsData.success
            ? profileViewsData.data.totalViews
            : 0,
          savedJobs: savedJobsData.success ? savedJobsData.data.stats.saved : 0,
        }));
      }

      if (jobsData.success) {
        const jobs = jobsData.data.jobs.map((job) => ({
          ...job,
          company:
            job.companyName ||
            job.company?.employerProfile?.companyName ||
            "N/A",
          posted: formatDate(job.createdAt),
          salary: job.salary
            ? `$${job.salary.min}k - $${job.salary.max}k`
            : "Competitive",
        }));
        setRecommendedJobs(jobs);
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
            <span className="gradient-text">{user?.firstName}</span>! 👋
          </h1>
          <p className="text-slate-300 text-lg">
            Here's what's happening with your job search
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="glass-card p-6 rounded-2xl animate-scale-in">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">
                      Applied Jobs
                    </p>
                    <p className="text-3xl font-bold text-slate-100 mt-1">
                      {stats.appliedJobs}
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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
                      Saved Jobs
                    </p>
                    <p className="text-3xl font-bold text-slate-100 mt-1">
                      {stats.savedJobs}
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <svg
                      className="w-6 h-6 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
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
                      Profile Views
                    </p>
                    <p className="text-3xl font-bold text-slate-100 mt-1">
                      {stats.profileViews}
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div
                className="glass-card p-6 rounded-2xl animate-scale-in"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">
                      Interviews
                    </p>
                    <p className="text-3xl font-bold text-slate-100 mt-1">
                      {stats.interviewsScheduled}
                    </p>
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
              {/* Recent Applications */}
              <div className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-100">
                    Recent Applications
                  </h2>
                  <button
                    onClick={() => onNavigate("my-applications")}
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
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-slate-100 mb-1">
                              {application.jobTitle}
                            </h3>
                            <p className="text-primary-400 text-sm font-medium">
                              {application.company}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              application.status
                            )}`}
                          >
                            {formatStatus(application.status)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-slate-400">
                          <div className="flex gap-4">
                            <span>{application.salary}</span>
                            <span>{application.location}</span>
                          </div>
                          <span>{application.appliedDate}</span>
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-slate-400 mb-4">No applications yet</p>
                      <button
                        onClick={() => onNavigate("job-listings")}
                        className="btn-primary px-6 py-2"
                      >
                        Browse Jobs
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommended Jobs */}
              <div
                className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-100">
                    Recommended for You
                  </h2>
                  <button
                    onClick={() => onNavigate("job-listings")}
                    className="text-primary-400 hover:text-primary-300 transition-colors text-sm font-semibold"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {recommendedJobs.length > 0 ? (
                    recommendedJobs.map((job) => (
                      <div
                        key={job._id}
                        className="glass-card-hover p-4 rounded-xl transition-all duration-300"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-slate-100 mb-1">
                              {job.title}
                            </h3>
                            <p className="text-primary-400 text-sm font-medium">
                              {job.company}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              job.status === "active"
                                ? "text-green-400 bg-green-400/20 border-green-400/30"
                                : "text-slate-400 bg-slate-400/20 border-slate-400/30"
                            }`}
                          >
                            {job.status === "active" ? "Active" : "Closed"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-slate-400 mb-3">
                          <div className="flex gap-4">
                            <span>{job.salary}</span>
                            <span>{job.location}</span>
                          </div>
                          <span>{job.posted}</span>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => onNavigate(`job-details/${job._id}`)}
                            className="btn-primary text-sm px-4 py-2 w-full"
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
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                        />
                      </svg>
                      <p className="text-slate-400">No jobs available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer user={user} onNavigate={onNavigate} />

      {/* Profile Setup Modal */}
      <JobSeekerSetupModal
        isOpen={showProfileSetup}
        onClose={() => setShowProfileSetup(false)}
        onComplete={handleProfileSetupComplete}
        user={user}
      />
    </div>
  );
}

export default JobSeekerDashboard;
