import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import ReportJobModal from "../components/ReportJobModal";

function JobDetailsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [expectedSalary, setExpectedSalary] = useState({
    amount: "",
    period: "yearly",
  });
  const [isSaved, setIsSaved] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchJobDetails();
    if (user) {
      checkIfSaved();
    }
  }, [jobId, user]);

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/jobs/${jobId}`,
      );
      const data = await response.json();

      if (data.success) {
        setJob(data.data.job || data.data);
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

  const checkIfSaved = async () => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/saved-jobs/check/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        setIsSaved(data.data.isSaved);
      }
    } catch (error) {
      console.error("Error checking saved status:", error);
    }
  };

  const handleSaveJob = async () => {
    if (!user) {
      showToast("Please login to save jobs", "error");
      return;
    }

    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const url = isSaved
        ? `${import.meta.env.VITE_API_URL}/saved-jobs/${jobId}`
        : `${import.meta.env.VITE_API_URL}/saved-jobs`;

      const response = await fetch(url, {
        method: isSaved ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: isSaved ? undefined : JSON.stringify({ jobId }),
      });

      const data = await response.json();
      if (data.success) {
        setIsSaved(!isSaved);
        showToast(
          isSaved ? "Job removed from saved jobs" : "Job saved successfully",
          "success",
        );
      } else {
        showToast(data.message || "Failed to save job", "error");
      }
    } catch (error) {
      console.error("Error saving job:", error);
      showToast("Failed to save job. Please try again.", "error");
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();

    if (!user) {
      showToast("Please login to apply for jobs", "error");
      return;
    }

    if (!cvFile) {
      showToast("Please upload your CV", "error");
      return;
    }

    try {
      setIsApplying(true);
      const token = sessionStorage.getItem("jobbridge_token");

      const formData = new FormData();
      formData.append("cv", cvFile);
      formData.append("coverLetter", coverLetter);
      if (expectedSalary.amount) {
        formData.append("expectedSalary", expectedSalary.amount);
        formData.append("salaryPeriod", expectedSalary.period);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/applications/${jobId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (data.success) {
        showToast("Application submitted successfully!", "success");
        setCvFile(null);
        setCoverLetter("");
        setExpectedSalary({ amount: "", period: "yearly" });
        fetchJobDetails();
      } else {
        showToast(data.message || "Failed to submit application", "error");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      showToast("Failed to submit application. Please try again.", "error");
    } finally {
      setIsApplying(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-dark-950 text-slate-100">
        <Header user={user} onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              {error || "Job not found"}
            </h2>
            <button
              onClick={() => navigate("/job-listings")}
              className="btn-primary px-6 py-3"
            >
              Browse Jobs
            </button>
          </div>
        </div>
        <Footer user={user} />
      </div>
    );
  }

  const hasApplied =
    job.hasApplied ||
    job.applications?.some((app) => app.applicant === user?._id);

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Header user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors mb-6"
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
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-xl p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-100 mb-2">
                    {job.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-slate-300">
                    <span className="flex items-center gap-2">
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
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      {user && user.userType === "jobseeker" && job.company ? (
                        <button
                          onClick={() => {
                            const companyId =
                              typeof job.company === "string"
                                ? job.company
                                : job.company._id;
                            navigate(
                              `/jobseeker/company-profile/${companyId}`,
                              {
                                state: {
                                  referrer: `/job-details/${jobId}`,
                                },
                              },
                            );
                          }}
                          className="text-primary-400 hover:text-primary-300 hover:underline transition-colors"
                        >
                          {job.companyName}
                        </button>
                      ) : (
                        <span>{job.companyName}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
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
                  </div>
                </div>

                <div className="flex gap-3">
                  {user && user.userType === "jobseeker" && (
                    <>
                      <button
                        onClick={handleSaveJob}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          isSaved
                            ? "bg-primary-500/20 text-primary-400 border-primary-500/30"
                            : "bg-dark-700/50 text-slate-300 border-dark-600/50 hover:bg-dark-700"
                        }`}
                      >
                        {isSaved ? "Saved" : "Save Job"}
                      </button>
                      <button
                        onClick={() => setShowReportModal(true)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all"
                      >
                        Report Job
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700/30">
                  <p className="text-slate-400 text-sm mb-1">Job Type</p>
                  <p className="text-slate-100 font-medium capitalize">
                    {job.jobType}
                  </p>
                </div>
                <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700/30">
                  <p className="text-slate-400 text-sm mb-1">Work Mode</p>
                  <p className="text-slate-100 font-medium capitalize">
                    {job.workMode}
                  </p>
                </div>
                <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700/30">
                  <p className="text-slate-400 text-sm mb-1">Experience</p>
                  <p className="text-slate-100 font-medium capitalize">
                    {job.experienceLevel}
                  </p>
                </div>
                <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700/30">
                  <p className="text-slate-400 text-sm mb-1">Salary</p>
                  <p className="text-slate-100 font-medium">
                    {job.salary?.min && job.salary?.max
                      ? `${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}`
                      : "Not specified"}
                  </p>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <h3 className="text-xl font-semibold text-slate-100 mb-3">
                  Job Description
                </h3>
                <p className="text-slate-300 whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>

              {job.requirements && job.requirements.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-slate-100 mb-3">
                    Requirements
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-300">
                    {job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job.benefits && job.benefits.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-slate-100 mb-3">
                    Benefits
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-300">
                    {job.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              {user && user.userType === "jobseeker" && !hasApplied && (
                <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-slate-100 mb-4">
                    Apply for this Job
                  </h2>
                  <form onSubmit={handleApply} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Upload CV <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setCvFile(e.target.files[0])}
                        className="w-full px-3 py-2 bg-dark-900/50 border border-dark-700/50 rounded-lg text-slate-200 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary-500/20 file:text-primary-400 file:text-sm hover:file:bg-primary-500/30"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Cover Letter
                      </label>
                      <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 bg-dark-900/50 border border-dark-700/50 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        placeholder="Tell us why you're a great fit..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Expected Salary (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={expectedSalary.amount}
                          onChange={(e) =>
                            setExpectedSalary({
                              ...expectedSalary,
                              amount: e.target.value,
                            })
                          }
                          placeholder="Amount"
                          className="flex-1 px-3 py-2 bg-dark-900/50 border border-dark-700/50 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <select
                          value={expectedSalary.period}
                          onChange={(e) =>
                            setExpectedSalary({
                              ...expectedSalary,
                              period: e.target.value,
                            })
                          }
                          className="px-3 py-2 bg-dark-900/50 border border-dark-700/50 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="yearly">Yearly</option>
                          <option value="monthly">Monthly</option>
                          <option value="hourly">Hourly</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isApplying}
                      className="w-full btn-primary py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isApplying ? "Submitting..." : "Submit Application"}
                    </button>
                  </form>
                </div>
              )}

              {hasApplied && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                  <p className="text-green-400 font-semibold">
                    ✓ You have already applied for this job
                  </p>
                </div>
              )}

              {!user && (
                <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-xl p-6 text-center">
                  <p className="text-slate-300 mb-4 text-sm">
                    Please login to apply for this job
                  </p>
                  <button
                    onClick={() => navigate("/login")}
                    className="btn-primary px-6 py-2 text-sm"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer user={user} />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
      <ReportJobModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        jobId={jobId}
        jobTitle={job?.title}
      />
    </div>
  );
}

export default JobDetailsPage;
