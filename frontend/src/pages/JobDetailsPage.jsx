import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";

function JobDetailsPage({ onNavigate, jobId }) {
  const { user, logout } = useAuth();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [expectedSalary, setExpectedSalary] = useState({ amount: "", period: "yearly" });
  const [hasApplied, setHasApplied] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      if (user?.userType === "jobseeker") {
        checkExistingApplication();
      }
    }
  }, [jobId, user]);

  const fetchJobDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/jobs/${jobId}`
      );

      const data = await response.json();

      if (data.success) {
        setJob(data.data.job);
        // Increment view count
        await incrementViewCount();
      } else {
        setError(data.message || "Failed to load job details");
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      setError("Failed to load job details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/jobs/${jobId}/view`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
  };

  const checkExistingApplication = async () => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/applications/my-applications?jobId=${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success && data.data.applications.length > 0) {
        // Find the most recent non-withdrawn application
        const activeApplication = data.data.applications.find(
          app => app.status !== "withdrawn"
        );
        
        if (activeApplication) {
          setHasApplied(true);
          setExistingApplication(activeApplication);
        } else {
          setHasApplied(false);
          setExistingApplication(null);
        }
      } else {
        setHasApplied(false);
        setExistingApplication(null);
      }
    } catch (error) {
      console.error("Error checking existing application:", error);
      // Don't show error to user, just assume they haven't applied
      setHasApplied(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        showError("Please upload a PDF or Word document");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showError("File size must be less than 5MB");
        return;
      }

      setCvFile(file);
      showSuccess("CV uploaded successfully");
    }
  };

  const handleApply = async () => {
    if (!cvFile) {
      showError("Please upload your CV to apply");
      return;
    }

    setIsApplying(true);

    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const formData = new FormData();
      
      formData.append("jobId", jobId);
      formData.append("coverLetter", coverLetter);
      formData.append("cv", cvFile);
      
      if (expectedSalary.amount) {
        formData.append("expectedSalary[amount]", expectedSalary.amount);
        formData.append("expectedSalary[period]", expectedSalary.period);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/applications`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        showSuccess("Application submitted successfully!");
        setTimeout(() => {
          onNavigate("my-applications");
        }, 2000);
      } else {
        showError(data.message || "Failed to submit application");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      showError("Failed to submit application. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  const formatSalary = (salary) => {
    if (!salary.min && !salary.max) return "Salary not specified";

    const formatNumber = (num) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
      return num.toString();
    };

    const currency = salary.currency === "USD" ? "$" : salary.currency;

    if (salary.min && salary.max) {
      return `${currency}${formatNumber(salary.min)} - ${currency}${formatNumber(salary.max)} per ${salary.period}`;
    } else if (salary.min) {
      return `${currency}${formatNumber(salary.min)}+ per ${salary.period}`;
    } else if (salary.max) {
      return `Up to ${currency}${formatNumber(salary.max)} per ${salary.period}`;
    }
  };

  const formatJobType = (type) => {
    return type.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const formatExperienceLevel = (level) => {
    const levels = {
      entry: "Entry Level",
      mid: "Mid Level", 
      senior: "Senior Level",
      executive: "Executive Level"
    };
    return levels[level] || level;
  };

  const handleLogout = async () => {
    await logout();
    onNavigate("home");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 text-slate-100">
        <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
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
              <p className="text-slate-400">Loading job details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-dark-950 text-slate-100">
        <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="glass-card p-8 rounded-xl text-center">
            <svg
              className="w-16 h-16 text-red-400 mx-auto mb-4"
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
            <h2 className="text-2xl font-bold text-slate-100 mb-2">
              {error || "Job not found"}
            </h2>
            <button
              onClick={() => onNavigate("job-listings")}
              className="btn-primary px-6 py-3 mt-4"
            >
              Back to Job Listings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Back Button */}
        <button
          onClick={() => onNavigate("jobseeker-dashboard")}
          className="text-slate-400 hover:text-primary-400 mb-6 flex items-center gap-2"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <div className="glass-card p-8 rounded-3xl animate-fade-in">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-slate-100 mb-3">
                    {job.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-lg text-slate-300 mb-4">
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {job.companyName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {job.location}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm font-medium">
                      {formatJobType(job.jobType)}
                    </span>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                      {formatJobType(job.workMode)}
                    </span>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                      {formatExperienceLevel(job.experienceLevel)}
                    </span>
                  </div>
                </div>
                {job.urgent && (
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                    Urgent
                  </span>
                )}
              </div>

              {/* Salary */}
              {(job.salary?.min || job.salary?.max) && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-slate-100 mb-2">Salary</h3>
                  <p className="text-2xl font-bold text-primary-400">
                    {formatSalary(job.salary)}
                  </p>
                </div>
              )}

              {/* Job Stats */}
              <div className="flex gap-6 text-sm text-slate-400">
                <span>Posted {job.timeAgo}</span>
                <span>•</span>
                <span>{job.applicationCount} applications</span>
                <span>•</span>
                <span>{job.viewCount} views</span>
              </div>
            </div>

            {/* Job Description */}
            <div className="glass-card p-8 rounded-3xl animate-slide-up">
              <h2 className="text-2xl font-bold text-slate-100 mb-4">Job Description</h2>
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="glass-card p-8 rounded-3xl animate-slide-up">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">Requirements</h2>
                <ul className="space-y-2">
                  {job.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-300">
                      <svg className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="glass-card p-8 rounded-3xl animate-slide-up">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">Responsibilities</h2>
                <ul className="space-y-2">
                  {job.responsibilities.map((responsibility, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-300">
                      <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      {responsibility}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="glass-card p-8 rounded-3xl animate-slide-up">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="glass-card p-8 rounded-3xl animate-slide-up">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">Benefits</h2>
                <ul className="space-y-2">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-300">
                      <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Application Sidebar */}
          <div className="space-y-6">
            {user?.userType === "jobseeker" && !hasApplied && (
              <div className="glass-card p-6 rounded-3xl animate-slide-up sticky top-24">
                <h2 className="text-xl font-bold text-slate-100 mb-6">Apply for this Job</h2>
                
                {/* CV Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Upload CV <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="cv-upload"
                    />
                    <label
                      htmlFor="cv-upload"
                      className={`block w-full p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                        cvFile
                          ? "border-green-500/50 bg-green-500/10"
                          : "border-slate-600/50 hover:border-primary-500/50 bg-slate-800/30"
                      }`}
                    >
                      <div className="text-center">
                        {cvFile ? (
                          <>
                            <svg className="w-8 h-8 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-green-400 font-medium">{cvFile.name}</p>
                            <p className="text-xs text-slate-400 mt-1">Click to change file</p>
                          </>
                        ) : (
                          <>
                            <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-slate-300 font-medium">Upload your CV</p>
                            <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX (Max 5MB)</p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Cover Letter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cover Letter (Optional)
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="input-field w-full h-32 resize-none"
                    placeholder="Tell us why you're interested in this position..."
                    maxLength={2000}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {coverLetter.length}/2000 characters
                  </p>
                </div>

                {/* Expected Salary */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Expected Salary (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={expectedSalary.amount}
                      onChange={(e) => setExpectedSalary({...expectedSalary, amount: e.target.value})}
                      className="input-field flex-1"
                      placeholder="Amount"
                    />
                    <select
                      value={expectedSalary.period}
                      onChange={(e) => setExpectedSalary({...expectedSalary, period: e.target.value})}
                      className="input-field w-24"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={handleApply}
                  disabled={!cvFile || isApplying}
                  className={`w-full px-6 py-4 rounded-xl font-semibold transition-all ${
                    cvFile && !isApplying
                      ? "btn-primary"
                      : "bg-slate-700 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {isApplying ? (
                    <>
                      <svg className="w-5 h-5 animate-spin inline mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting Application...
                    </>
                  ) : (
                    "Apply Now"
                  )}
                </button>

                {!cvFile && (
                  <p className="text-xs text-slate-400 text-center mt-2">
                    Please upload your CV to enable the apply button
                  </p>
                )}
              </div>
            )}

            {user?.userType === "jobseeker" && hasApplied && existingApplication && (
              <div className="glass-card p-6 rounded-3xl animate-slide-up sticky top-24">
                <h2 className="text-xl font-bold text-slate-100 mb-4">Application Status</h2>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">Already Applied</h3>
                  <p className="text-slate-300 mb-4">
                    You have already applied for this position
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        existingApplication.status === 'pending' ? 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30' :
                        existingApplication.status === 'reviewed' ? 'text-blue-400 bg-blue-400/20 border-blue-400/30' :
                        existingApplication.status === 'shortlisted' ? 'text-cyan-400 bg-cyan-400/20 border-cyan-400/30' :
                        existingApplication.status === 'interview-scheduled' ? 'text-green-400 bg-green-400/20 border-green-400/30' :
                        existingApplication.status === 'interview-completed' ? 'text-purple-400 bg-purple-400/20 border-purple-400/30' :
                        existingApplication.status === 'offered' ? 'text-emerald-400 bg-emerald-400/20 border-emerald-400/30' :
                        existingApplication.status === 'hired' ? 'text-green-500 bg-green-500/20 border-green-500/30' :
                        existingApplication.status === 'rejected' ? 'text-red-400 bg-red-400/20 border-red-400/30' :
                        'text-slate-400 bg-slate-400/20 border-slate-400/30'
                      }`}>
                        {existingApplication.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Applied:</span>
                      <span className="text-slate-300">
                        {new Date(existingApplication.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate("my-applications")}
                    className="btn-primary w-full px-4 py-3 mt-4"
                  >
                    View My Applications
                  </button>
                </div>
              </div>
            )}

            {/* Job Info */}
            <div className="glass-card p-6 rounded-3xl animate-slide-up">
              <h2 className="text-xl font-bold text-slate-100 mb-4">Job Information</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-slate-400">Job Type</p>
                  <p className="text-slate-100 font-semibold">{formatJobType(job.jobType)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Work Mode</p>
                  <p className="text-slate-100 font-semibold">{formatJobType(job.workMode)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Experience Level</p>
                  <p className="text-slate-100 font-semibold">{formatExperienceLevel(job.experienceLevel)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Category</p>
                  <p className="text-slate-100 font-semibold">{formatJobType(job.category)}</p>
                </div>
                {job.applicationDeadline && (
                  <div>
                    <p className="text-slate-400">Application Deadline</p>
                    <p className="text-slate-100 font-semibold">
                      {new Date(job.applicationDeadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer user={user} />
      
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

export default JobDetailsPage;