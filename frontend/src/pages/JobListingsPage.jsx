import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import JobApplicationModal from "../components/JobApplicationModal";
import { useJobCategories } from "../hooks/useJobCategories";

function JobListingsPage({ onNavigate }) {
  const { user, logout } = useAuth();
  const { categories } = useJobCategories(true); // includeAll = true for "All Categories" option
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  const [filters, setFilters] = useState({
    search: "",
    location: "",
    jobType: "",
    workMode: "",
    experienceLevel: "",
    category: "",
    page: 1,
    limit: 12,
  });

  // Application modal state
  const [applicationModal, setApplicationModal] = useState({
    isOpen: false,
    job: null,
  });

  // Saved jobs state
  const [savedJobs, setSavedJobs] = useState(new Set());

  const jobTypes = [
    { value: "", label: "All Types" },
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
    { value: "freelance", label: "Freelance" },
  ];

  const workModes = [
    { value: "", label: "All Modes" },
    { value: "remote", label: "Remote" },
    { value: "onsite", label: "On-site" },
    { value: "hybrid", label: "Hybrid" },
  ];

  const experienceLevels = [
    { value: "", label: "All Levels" },
    { value: "entry", label: "Entry Level" },
    { value: "mid", label: "Mid Level" },
    { value: "senior", label: "Senior Level" },
    { value: "executive", label: "Executive" },
  ];

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/jobs?${queryParams}`,
      );
      const data = await response.json();

      if (data.success) {
        setJobs(data.data.jobs);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || "Failed to fetch jobs");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/saved-jobs?limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        const savedJobIds = new Set(
          data.data.savedJobs.map((savedJob) => savedJob.job._id),
        );
        setSavedJobs(savedJobIds);
      }
    } catch (error) {
      console.error("Failed to fetch saved jobs:", error);
    }
  };

  useEffect(() => {
    fetchJobs();
    if (user?.userType === "jobseeker") {
      fetchSavedJobs();
    }
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleLogout = async () => {
    await logout();
    onNavigate("home");
  };

  const handleApplyClick = (job) => {
    if (user?.userType !== "jobseeker") {
      alert(
        "Only job seekers can apply for jobs. Please login as a job seeker.",
      );
      return;
    }
    setApplicationModal({ isOpen: true, job });
  };

  const handleApplicationSuccess = () => {
    // Optionally refresh jobs or show success message
    alert("Application submitted successfully!");
  };

  const toggleSaveJob = async (jobId) => {
    if (user?.userType !== "jobseeker") {
      alert("Only job seekers can save jobs. Please login as a job seeker.");
      return;
    }

    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const isSaved = savedJobs.has(jobId);

      if (isSaved) {
        // Find the saved job to get its ID
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/saved-jobs/check/${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();

        if (data.success && data.data.savedJob) {
          // Remove from saved jobs
          await fetch(
            `${import.meta.env.VITE_API_URL}/saved-jobs/${
              data.data.savedJob._id
            }`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          setSavedJobs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(jobId);
            return newSet;
          });
        }
      } else {
        // Save the job
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/saved-jobs`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ jobId }),
          },
        );

        if (response.ok) {
          setSavedJobs((prev) => new Set([...prev, jobId]));
        }
      }
    } catch (error) {
      console.error("Failed to toggle save job:", error);
      alert("Failed to save/unsave job. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-2">
            Find Your Dream <span className="gradient-text">Job</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Discover opportunities that match your skills and aspirations
          </p>
        </div>

        {/* Search and Filters */}
        <div className="glass-card p-6 lg:p-8 rounded-3xl mb-8 animate-slide-up">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Search Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5">
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Search Jobs
                </label>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="input-field h-12 text-lg"
                  placeholder="Job title, company, or keywords..."
                />
              </div>
              <div className="lg:col-span-4">
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="input-field h-12 text-lg"
                  placeholder="City, state, or remote"
                />
              </div>
              <div className="lg:col-span-3 flex items-end">
                <button
                  type="submit"
                  className="w-full btn-primary h-12 text-lg font-bold"
                  disabled={loading}
                >
                  <div className="flex items-center justify-center gap-3">
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
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Search
                  </div>
                </button>
              </div>
            </div>

            {/* Filter Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Job Type
                </label>
                <select
                  name="jobType"
                  value={filters.jobType}
                  onChange={handleFilterChange}
                  className="input-field h-12 py-3"
                >
                  {jobTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Work Mode
                </label>
                <select
                  name="workMode"
                  value={filters.workMode}
                  onChange={handleFilterChange}
                  className="input-field h-12 py-3"
                >
                  {workModes.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Experience
                </label>
                <select
                  name="experienceLevel"
                  value={filters.experienceLevel}
                  onChange={handleFilterChange}
                  className="input-field h-12 py-3"
                >
                  {experienceLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="input-field h-12 py-3"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Results Header */}
        {!loading && (
          <div className="flex justify-between items-center mb-6">
            <p className="text-slate-300">
              {pagination.totalJobs} jobs found
              {filters.search && ` for "${filters.search}"`}
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="glass-card p-6 rounded-xl border-red-500/50 bg-red-500/10 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-6 rounded-2xl animate-pulse">
                <div className="h-6 bg-slate-700 rounded mb-4"></div>
                <div className="h-4 bg-slate-700 rounded mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Job Listings */}
        {!loading && jobs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {jobs.map((job, index) => (
              <div
                key={job._id}
                className="glass-card-hover p-6 rounded-2xl transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-100 mb-2 hover:text-primary-400 transition-colors cursor-pointer">
                      {job.title}
                    </h3>
                    {user?.userType === "jobseeker" && job.company?._id ? (
                      <button
                        onClick={() =>
                          onNavigate(`company-profile/${job.company._id}`, {
                            referrer: "job-listings",
                          })
                        }
                        className="text-primary-400 font-semibold mb-2 hover:text-primary-300 transition-colors underline text-left"
                      >
                        {job.companyName}
                      </button>
                    ) : (
                      <p className="text-primary-400 font-semibold mb-2">
                        {job.companyName}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-3">
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
                        {job.location}
                      </span>
                      <span className="px-2 py-1 bg-slate-700/50 rounded-full text-xs">
                        {job.jobType}
                      </span>
                      <span className="px-2 py-1 bg-slate-700/50 rounded-full text-xs">
                        {job.workMode}
                      </span>
                      {job.formattedSalary && (
                        <span className="text-green-400 font-medium">
                          {job.formattedSalary}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-2">{job.timeAgo}</p>
                    <div className="flex gap-2">
                      {user?.userType === "jobseeker" && (
                        <button
                          onClick={() => toggleSaveJob(job._id)}
                          className={`p-2 transition-colors ${
                            savedJobs.has(job._id)
                              ? "text-red-400 hover:text-red-300"
                              : "text-slate-400 hover:text-primary-400"
                          }`}
                          title={
                            savedJobs.has(job._id)
                              ? "Remove from saved"
                              : "Save job"
                          }
                        >
                          <svg
                            className="w-5 h-5"
                            fill={
                              savedJobs.has(job._id) ? "currentColor" : "none"
                            }
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
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 mb-4 line-clamp-2">
                  {job.shortDescription ||
                    job.description?.substring(0, 150) + "..."}
                </p>

                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.slice(0, 4).map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm border border-primary-500/30"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 4 && (
                      <span className="px-3 py-1 bg-slate-700/50 text-slate-400 rounded-full text-sm">
                        +{job.skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>{job.applicationCount} applications</span>
                    <span>{job.viewCount} views</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => onNavigate(`job-details/${job._id}`)}
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      View Details
                    </button>
                    {user?.userType === "jobseeker" && (
                      <button
                        onClick={() => handleApplyClick(job)}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && jobs.length === 0 && !error && (
          <div className="text-center py-12">
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              No jobs found
            </h3>
            <p className="text-slate-400">
              Try adjusting your search criteria or filters
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="px-4 py-2 border border-dark-600 rounded-lg text-slate-300 hover:bg-dark-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
              const pageNum = Math.max(1, pagination.currentPage - 2) + i;
              if (pageNum > pagination.totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    pageNum === pagination.currentPage
                      ? "bg-primary-500 text-white"
                      : "border border-dark-600 text-slate-300 hover:bg-dark-700"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="px-4 py-2 border border-dark-600 rounded-lg text-slate-300 hover:bg-dark-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Footer user={user} onNavigate={onNavigate} />

      {/* Job Application Modal */}
      <JobApplicationModal
        job={applicationModal.job}
        isOpen={applicationModal.isOpen}
        onClose={() => setApplicationModal({ isOpen: false, job: null })}
        onSuccess={handleApplicationSuccess}
      />
    </div>
  );
}

export default JobListingsPage;
