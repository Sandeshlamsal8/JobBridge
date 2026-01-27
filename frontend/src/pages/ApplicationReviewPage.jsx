import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";

function ApplicationReviewPage({ onNavigate, applicationId }) {
  const { user, logout } = useAuth();
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [note, setNote] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showUpdateButton, setShowUpdateButton] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId]);

  useEffect(() => {
    if (application) {
      setSelectedStatus(application.status);
    }
  }, [application]);

  const fetchApplication = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const apiUrl = `${
        import.meta.env.VITE_API_URL || "http://localhost:5000/api"
      }/applications/${applicationId}`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setApplication(data.data.application);
      } else {
        setError(data.message || "Failed to load application");
      }
    } catch (error) {
      console.error("Error fetching application:", error);
      setError(`Failed to load application: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
    setShowUpdateButton(newStatus !== application.status);
  };

  const updateStatus = async () => {
    if (selectedStatus === application.status) return;

    setIsUpdating(true);
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/applications/${applicationId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: selectedStatus }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setApplication(data.data.application);
        setShowUpdateButton(false);
        showSuccess(
          `Application status updated to: ${formatStatus(selectedStatus)}`,
        );
      } else {
        showError(data.message || "Failed to update status");
        setSelectedStatus(application.status); // Reset to original status
        setShowUpdateButton(false);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showError("Failed to update status. Please try again.");
      setSelectedStatus(application.status); // Reset to original status
      setShowUpdateButton(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;

    setIsUpdating(true);
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/applications/${applicationId}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: note, isPrivate: true }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setNote("");
        setShowNoteForm(false);
        fetchApplication(); // Refresh to get updated notes
        showSuccess("Note added successfully");
      } else {
        showError(data.message || "Failed to add note");
      }
    } catch (error) {
      console.error("Error adding note:", error);
      showError("Failed to add note. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      pending: "text-yellow-400 bg-yellow-400/20 border-yellow-400/30",
      reviewed: "text-blue-400 bg-blue-400/20 border-blue-400/30",
      shortlisted: "text-cyan-400 bg-cyan-400/20 border-cyan-400/30",
      "interview-scheduled":
        "text-green-400 bg-green-400/20 border-green-400/30",
      "interview-completed":
        "text-purple-400 bg-purple-400/20 border-purple-400/30",
      offered: "text-emerald-400 bg-emerald-400/20 border-emerald-400/30",
      hired: "text-green-500 bg-green-500/20 border-green-500/30",
      rejected: "text-red-400 bg-red-400/20 border-red-400/30",
      withdrawn: "text-slate-400 bg-slate-400/20 border-slate-400/30",
    };
    return (
      statusMap[status] || "text-slate-400 bg-slate-400/20 border-slate-400/30"
    );
  };

  const formatStatus = (status) => {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewResume = async () => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/applications/cv/${application._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        // Create a blob from the response
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Open in new tab
        window.open(url, "_blank");

        // Clean up the URL object after a delay
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        const errorData = await response.json();
        showError(errorData.message || "Failed to load resume");
      }
    } catch (error) {
      console.error("Error viewing resume:", error);
      showError("Failed to load resume. Please try again.");
    }
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
              <p className="text-slate-400">Loading application...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
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
              {error || "Application not found"}
            </h2>
            <button
              onClick={() => onNavigate("applications")}
              className="btn-primary px-6 py-3 mt-4"
            >
              Back to Applications
            </button>
          </div>
        </div>
      </div>
    );
  }

  const candidate = application.applicant || {};
  const job = application.job || {};

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Back Button */}
        <button
          onClick={() => onNavigate("applications")}
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
          Back to Applications
        </button>

        {/* Application Header */}
        <div className="glass-card p-8 rounded-3xl mb-6 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex gap-4 items-start flex-1">
              <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-2xl flex-shrink-0">
                {candidate.firstName?.[0]}
                {candidate.lastName?.[0]}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-100 mb-2">
                  {candidate.firstName} {candidate.lastName}
                </h1>
                <p className="text-xl text-slate-300 mb-2">
                  Applied for:{" "}
                  <span className="text-primary-400">{job.title}</span>
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                  <span>Applied {formatDate(application.createdAt)}</span>
                  <span>•</span>
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
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    {candidate.email}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                  application.status,
                )}`}
              >
                {formatStatus(application.status)}
              </span>
              <button
                onClick={() => onNavigate(`candidate-profile/${candidate._id}`)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>

        {/* AI Ranking Section */}
        {application.aiRanking && (
          <div className="glass-card p-8 rounded-3xl mb-6 animate-fade-in border-2 border-primary-500/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-100">
                  AI Candidate Analysis
                </h2>
                <p className="text-slate-400 text-sm">
                  Powered by machine learning
                </p>
              </div>
            </div>

            {/* Overall Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="text-center p-6 bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-2xl border border-primary-500/30">
                <p className="text-slate-300 text-sm mb-2">
                  Overall Match Score
                </p>
                <div className="text-6xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {application.aiRanking.overallScore}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                      application.aiRanking.tier === "excellent"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : application.aiRanking.tier === "good"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : application.aiRanking.tier === "fair"
                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {application.aiRanking.tier?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">AI Semantic Match</span>
                    <span className="text-primary-400 font-semibold">
                      {application.aiRanking.breakdown?.semanticMatch}%
                    </span>
                  </div>
                  <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-500"
                      style={{
                        width: `${application.aiRanking.breakdown?.semanticMatch}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Skill Match</span>
                    <span className="text-primary-400 font-semibold">
                      {application.aiRanking.breakdown?.skillMatch}%
                    </span>
                  </div>
                  <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                      style={{
                        width: `${application.aiRanking.breakdown?.skillMatch}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Experience Match</span>
                    <span className="text-primary-400 font-semibold">
                      {application.aiRanking.breakdown?.experienceMatch}%
                    </span>
                  </div>
                  <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                      style={{
                        width: `${application.aiRanking.breakdown?.experienceMatch}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">Education Match</span>
                    <span className="text-primary-400 font-semibold">
                      {application.aiRanking.breakdown?.educationMatch}%
                    </span>
                  </div>
                  <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                      style={{
                        width: `${application.aiRanking.breakdown?.educationMatch}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Matched Skills */}
              {application.aiRanking.matchedSkills &&
                application.aiRanking.matchedSkills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Matched Skills (
                      {application.aiRanking.matchedSkills.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {application.aiRanking.matchedSkills.map(
                        (skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm border border-green-500/30"
                          >
                            {skill}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Missing Skills */}
              {application.aiRanking.missingSkills &&
                application.aiRanking.missingSkills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Missing Skills (
                      {application.aiRanking.missingSkills.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {application.aiRanking.missingSkills.map(
                        (skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm border border-red-500/30"
                          >
                            {skill}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* AI Insights */}
            {application.aiRanking.insights &&
              application.aiRanking.insights.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
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
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    AI Insights
                  </h3>
                  <div className="space-y-2">
                    {application.aiRanking.insights.map((insight, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-dark-800/50 rounded-lg border border-dark-700"
                      >
                        <span className="text-2xl">💡</span>
                        <p className="text-slate-300 text-sm flex-1">
                          {insight}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resume/CV */}
            {application.resume && (
              <div className="glass-card p-6 rounded-3xl animate-slide-up">
                <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center gap-2">
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
                  Resume / CV
                </h2>
                <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
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
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-slate-100 font-semibold">
                          {application.resume.originalName}
                        </p>
                        <p className="text-sm text-slate-400">
                          {application.resume.size
                            ? `${(application.resume.size / 1024).toFixed(
                                2,
                              )} KB`
                            : "Unknown size"}{" "}
                          • Uploaded{" "}
                          {application.resume.uploadedAt
                            ? new Date(
                                application.resume.uploadedAt,
                              ).toLocaleDateString()
                            : "recently"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleViewResume}
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View Resume
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cover Letter */}
            {application.coverLetter && (
              <div className="glass-card p-6 rounded-3xl animate-slide-up">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  Cover Letter
                </h2>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {application.coverLetter}
                </p>
              </div>
            )}

            {/* Expected Salary */}
            {application.expectedSalary && (
              <div className="glass-card p-6 rounded-3xl animate-slide-up">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  Salary Expectations
                </h2>
                <p className="text-2xl text-primary-400 font-bold">
                  ${application.expectedSalary.amount?.toLocaleString()} /{" "}
                  {application.expectedSalary.period}
                </p>
              </div>
            )}

            {/* Additional Documents */}
            {application.additionalDocuments &&
              application.additionalDocuments.length > 0 && (
                <div className="glass-card p-6 rounded-3xl animate-slide-up">
                  <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center gap-2">
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
                    Additional Documents
                  </h2>
                  <div className="space-y-3">
                    {application.additionalDocuments.map((doc, index) => (
                      <div
                        key={index}
                        className="bg-dark-800/50 rounded-xl p-4 border border-dark-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
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
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-slate-100 font-medium">
                                {doc.originalName}
                              </p>
                              <p className="text-xs text-slate-400">
                                {doc.size
                                  ? `${(doc.size / 1024).toFixed(2)} KB`
                                  : "Unknown size"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={`${
                                import.meta.env.VITE_API_URL?.replace(
                                  "/api",
                                  "",
                                ) || "http://localhost:5000"
                              }/${doc.path.replace(/\\/g, "/")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1"
                            >
                              <svg
                                className="w-3 h-3"
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
                              View
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Notes */}
            <div className="glass-card p-6 rounded-3xl animate-slide-up">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-100">Notes</h2>
                <button
                  onClick={() => setShowNoteForm(!showNoteForm)}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  {showNoteForm ? "Cancel" : "Add Note"}
                </button>
              </div>

              {showNoteForm && (
                <div className="mb-4">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="input-field w-full h-32 resize-none"
                    placeholder="Add your notes about this candidate..."
                  />
                  <button
                    onClick={addNote}
                    disabled={isUpdating || !note.trim()}
                    className="btn-primary px-6 py-2 mt-2 disabled:opacity-50"
                  >
                    {isUpdating ? "Saving..." : "Save Note"}
                  </button>
                </div>
              )}

              {application.notes && application.notes.length > 0 ? (
                <div className="space-y-3">
                  {application.notes.map((note, index) => (
                    <div key={index} className="glass-card p-4 rounded-xl">
                      <p className="text-slate-300 mb-2">{note.content}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-4">
                  No notes yet. Add your first note above.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-6">
            {/* Status Update */}
            <div className="glass-card p-6 rounded-3xl animate-slide-up">
              <h2 className="text-xl font-bold text-slate-100 mb-4">
                Update Status
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Application Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={isUpdating}
                    className="input-field w-full"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="reviewed">👁️ Reviewed</option>
                    <option value="shortlisted">⭐ Shortlisted</option>
                    <option value="interview-scheduled">
                      📅 Interview Scheduled
                    </option>
                    <option value="interview-completed">
                      ✅ Interview Completed
                    </option>
                    <option value="offered">🎉 Offered</option>
                    <option value="hired">🎊 Hired</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </div>

                {showUpdateButton && (
                  <button
                    onClick={updateStatus}
                    disabled={isUpdating}
                    className="btn-primary w-full px-4 py-3 flex items-center justify-center gap-2 animate-fade-in"
                  >
                    {isUpdating ? (
                      <>
                        <svg
                          className="w-5 h-5 animate-spin"
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
                        Updating...
                      </>
                    ) : (
                      <>
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
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        Update Status
                      </>
                    )}
                  </button>
                )}

                <div className="text-xs text-slate-400 text-center">
                  Current status:{" "}
                  <span className="text-primary-400 font-medium">
                    {formatStatus(application.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="glass-card p-6 rounded-3xl animate-slide-up">
              <h2 className="text-xl font-bold text-slate-100 mb-4">Contact</h2>
              <div className="space-y-3">
                <a
                  href={`mailto:${candidate.email}`}
                  className="btn-primary w-full px-4 py-3 flex items-center justify-center gap-2"
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Send Email
                </a>
                {candidate.jobSeekerProfile?.phone && (
                  <a
                    href={`tel:${candidate.jobSeekerProfile.phone}`}
                    className="btn-secondary w-full px-4 py-3 flex items-center justify-center gap-2"
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
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Call Candidate
                  </a>
                )}
              </div>
            </div>

            {/* Quick Info */}
            <div className="glass-card p-6 rounded-3xl animate-slide-up">
              <h2 className="text-xl font-bold text-slate-100 mb-4">
                Application Info
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Resume</span>
                  {application.resume ? (
                    <span className="text-green-400 flex items-center gap-1">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Attached
                    </span>
                  ) : (
                    <span className="text-slate-500">Not provided</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cover Letter</span>
                  {application.coverLetter ? (
                    <span className="text-green-400 flex items-center gap-1">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Provided
                    </span>
                  ) : (
                    <span className="text-slate-500">Not provided</span>
                  )}
                </div>
                {application.additionalDocuments &&
                  application.additionalDocuments.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Additional Docs</span>
                      <span className="text-primary-400 font-medium">
                        {application.additionalDocuments.length}
                      </span>
                    </div>
                  )}
              </div>
            </div>

            {/* Job Details */}
            <div className="glass-card p-6 rounded-3xl animate-slide-up">
              <h2 className="text-xl font-bold text-slate-100 mb-4">
                Job Details
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-400">Position</p>
                  <p className="text-slate-100 font-semibold">{job.title}</p>
                </div>
                <div>
                  <p className="text-slate-400">Location</p>
                  <p className="text-slate-100">{job.location}</p>
                </div>
                <div>
                  <p className="text-slate-400">Job Type</p>
                  <p className="text-slate-100">{job.jobType}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
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

export default ApplicationReviewPage;
