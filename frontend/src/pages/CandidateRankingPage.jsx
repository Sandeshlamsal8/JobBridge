import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { showToast } from "../components/ToastContainer";

function CandidateRankingPage({ onNavigate, jobId }) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState(false);
  const [job, setJob] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filterTier, setFilterTier] = useState("all");
  const [sortBy, setSortBy] = useState("rank");
  const [showShortlisted, setShowShortlisted] = useState(true);
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchRankings();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/jobs/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setJob(data.data.job);
      }
    } catch (error) {
      console.error("Error fetching job:", error);
    }
  };

  const fetchRankings = async () => {
    setLoading(true);
    setRanking(true);

    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/ai-matching/rank-all/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok && data.rankings) {
        setRankings(data.rankings);
        setSummary(data.summary);
        showToast(
          `Ranked ${data.rankings.length} candidates successfully!`,
          "success",
        );
      } else {
        showToast(data.message || "Failed to fetch rankings", "error");
      }
    } catch (error) {
      console.error("Error fetching rankings:", error);
      showToast("Failed to load rankings. Please try again.", "error");
    } finally {
      setLoading(false);
      setRanking(false);
    }
  };

  const handleShortlist = async (applicationId) => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/applications/${applicationId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "shortlisted" }),
        },
      );

      const data = await response.json();

      if (data.success) {
        showToast("Candidate shortlisted successfully!", "success");
        // Update local state to reflect shortlisted status
        setRankings(
          rankings.map((r) =>
            r.applicationId === applicationId
              ? { ...r, isShortlisted: true }
              : r,
          ),
        );
        // Remove from selected candidates
        const newSelected = new Set(selectedCandidates);
        newSelected.delete(applicationId);
        setSelectedCandidates(newSelected);
      } else {
        showToast(data.message || "Failed to shortlist candidate", "error");
      }
    } catch (error) {
      console.error("Error shortlisting candidate:", error);
      showToast("Failed to shortlist candidate", "error");
    }
  };

  const handleBulkShortlist = async () => {
    if (selectedCandidates.size === 0) {
      showToast("Please select candidates to shortlist", "info");
      return;
    }

    const promises = Array.from(selectedCandidates).map((applicationId) =>
      handleShortlist(applicationId),
    );

    await Promise.all(promises);
    setSelectedCandidates(new Set());
    showToast(`${selectedCandidates.size} candidates shortlisted!`, "success");
  };

  const toggleSelectCandidate = (applicationId) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId);
    } else {
      newSelected.add(applicationId);
    }
    setSelectedCandidates(newSelected);
  };

  const selectTopCandidates = (count) => {
    // Only select candidates that are not already shortlisted
    const topCandidates = filteredAndSortedRankings
      .filter((r) => !r.isShortlisted)
      .slice(0, count)
      .map((r) => r.applicationId);
    setSelectedCandidates(new Set(topCandidates));
    showToast(`Selected top ${count} candidates`, "success");
  };

  const getTierColor = (tier) => {
    const colors = {
      excellent: "bg-green-500/20 text-green-400 border-green-500/30",
      good: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      fair: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      poor: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[tier] || colors.poor;
  };

  const getTierIcon = (tier) => {
    const icons = {
      excellent: "🌟",
      good: "👍",
      fair: "👌",
      poor: "⚠️",
    };
    return icons[tier] || "📊";
  };

  const filteredAndSortedRankings = rankings
    .filter((r) => filterTier === "all" || r.tier === filterTier)
    .filter((r) => showShortlisted || !r.isShortlisted)
    .sort((a, b) => {
      if (sortBy === "rank") return a.rank - b.rank;
      if (sortBy === "score") return b.overallScore - a.overallScore;
      if (sortBy === "skills")
        return b.breakdown.skillMatch - a.breakdown.skillMatch;
      if (sortBy === "experience")
        return b.breakdown.experienceMatch - a.breakdown.experienceMatch;
      return 0;
    });

  const handleLogout = async () => {
    await logout();
    onNavigate("home");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 text-slate-100">
        <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-primary-400"
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
            </div>
            <p className="text-slate-300 mt-6 text-lg font-medium">
              {ranking ? "AI is ranking candidates..." : "Loading..."}
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Analyzing CVs and calculating match scores
            </p>
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
          onClick={() => onNavigate("my-jobs")}
          className="text-slate-400 hover:text-primary-400 mb-6 flex items-center gap-2 transition-colors"
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
          Back to My Jobs
        </button>

        {/* Header */}
        <div className="glass-card p-8 rounded-3xl mb-6 animate-fade-in">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-100 mb-2">
                  AI Candidate Rankings
                </h1>
                {job && (
                  <div>
                    <p className="text-xl text-primary-400 font-semibold mb-1">
                      {job.title}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {job.location} • {job.jobType}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={fetchRankings}
              disabled={ranking}
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              <svg
                className={`w-5 h-5 ${ranking ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {ranking ? "Ranking..." : "Refresh Rankings"}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="glass-card p-6 rounded-2xl text-center animate-slide-up">
              <p className="text-slate-400 text-sm mb-2">Total Candidates</p>
              <p className="text-3xl font-bold text-slate-100">
                {summary.total}
              </p>
            </div>
            <div
              className="glass-card p-6 rounded-2xl text-center animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              <p className="text-slate-400 text-sm mb-2">Shortlisted</p>
              <p className="text-3xl font-bold text-green-400">
                {rankings.filter((r) => r.isShortlisted).length}
              </p>
            </div>
            <div
              className="glass-card p-6 rounded-2xl text-center animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <p className="text-slate-400 text-sm mb-2">Excellent</p>
              <p className="text-3xl font-bold text-green-400">
                {summary.excellent}
              </p>
            </div>
            <div
              className="glass-card p-6 rounded-2xl text-center animate-slide-up"
              style={{ animationDelay: "0.3s" }}
            >
              <p className="text-slate-400 text-sm mb-2">Good</p>
              <p className="text-3xl font-bold text-blue-400">{summary.good}</p>
            </div>
            <div
              className="glass-card p-6 rounded-2xl text-center animate-slide-up"
              style={{ animationDelay: "0.4s" }}
            >
              <p className="text-slate-400 text-sm mb-2">Fair</p>
              <p className="text-3xl font-bold text-yellow-400">
                {summary.fair}
              </p>
            </div>
            <div
              className="glass-card p-6 rounded-2xl text-center animate-slide-up"
              style={{ animationDelay: "0.5s" }}
            >
              <p className="text-slate-400 text-sm mb-2">Poor</p>
              <p className="text-3xl font-bold text-red-400">{summary.poor}</p>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="glass-card p-6 rounded-2xl mb-6 animate-slide-up">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Filter by Tier
                </label>
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Tiers</option>
                  <option value="excellent">🌟 Excellent</option>
                  <option value="good">👍 Good</option>
                  <option value="fair">👌 Fair</option>
                  <option value="poor">⚠️ Poor</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field"
                >
                  <option value="rank">Rank (Default)</option>
                  <option value="score">Overall Score</option>
                  <option value="skills">Skill Match</option>
                  <option value="experience">Experience Match</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Show Shortlisted
                </label>
                <button
                  onClick={() => setShowShortlisted(!showShortlisted)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    showShortlisted
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-dark-800 text-slate-400 border-slate-600"
                  }`}
                >
                  {showShortlisted ? "✓ Showing" : "✗ Hidden"}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => selectTopCandidates(5)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Select Top 5
              </button>
              <button
                onClick={() => selectTopCandidates(10)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Select Top 10
              </button>
              {selectedCandidates.size > 0 && (
                <button
                  onClick={handleBulkShortlist}
                  className="btn-primary px-6 py-2 text-sm flex items-center gap-2"
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Shortlist {selectedCandidates.size} Selected
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rankings List */}
        {filteredAndSortedRankings.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl text-center">
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-2xl font-bold text-slate-300 mb-2">
              No Candidates Found
            </h3>
            <p className="text-slate-500">
              {filterTier !== "all"
                ? `No candidates in the "${filterTier}" tier`
                : "No applications with CV analysis available"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedRankings.map((candidate, index) => (
              <div
                key={candidate.applicationId}
                className={`glass-card p-6 rounded-2xl transition-all duration-300 animate-slide-up ${
                  candidate.isShortlisted
                    ? "border-green-500/50 bg-green-500/5"
                    : "hover:border-primary-500/50"
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-6">
                  {/* Checkbox */}
                  <div className="flex items-center pt-1">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.has(candidate.applicationId)}
                      onChange={() =>
                        toggleSelectCandidate(candidate.applicationId)
                      }
                      disabled={candidate.isShortlisted}
                      className="w-5 h-5 rounded border-slate-600 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Rank Badge */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold ${
                        candidate.rank === 1
                          ? "bg-gradient-to-br from-yellow-500 to-orange-500 text-white"
                          : candidate.rank === 2
                            ? "bg-gradient-to-br from-slate-400 to-slate-500 text-white"
                            : candidate.rank === 3
                              ? "bg-gradient-to-br from-orange-600 to-orange-700 text-white"
                              : "bg-dark-800 text-slate-400"
                      }`}
                    >
                      #{candidate.rank}
                    </div>
                  </div>

                  {/* Candidate Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold text-slate-100">
                            {candidate.applicantName}
                          </h3>
                          {candidate.isShortlisted && (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold border border-green-500/30 flex items-center gap-1">
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
                              Shortlisted
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full border font-semibold ${getTierColor(candidate.tier)}`}
                          >
                            {getTierIcon(candidate.tier)}{" "}
                            {candidate.tier?.toUpperCase()}
                          </span>
                          <span className="text-slate-400">
                            Overall Score:{" "}
                            <span className="text-primary-400 font-bold text-lg">
                              {candidate.overallScore}/100
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            onNavigate(
                              `application-review/${candidate.applicationId}`,
                            )
                          }
                          className="btn-secondary px-4 py-2 text-sm"
                        >
                          View Details
                        </button>
                        {candidate.isShortlisted ? (
                          <button
                            disabled
                            className="px-4 py-2 text-sm bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 cursor-not-allowed flex items-center gap-2"
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Shortlisted
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleShortlist(candidate.applicationId)
                            }
                            className="btn-primary px-4 py-2 text-sm"
                          >
                            Shortlist
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">AI Match</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-dark-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
                              style={{
                                width: `${candidate.breakdown.semanticMatch}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-slate-300 w-10">
                            {candidate.breakdown.semanticMatch}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Skills</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-dark-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                              style={{
                                width: `${candidate.breakdown.skillMatch}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-slate-300 w-10">
                            {candidate.breakdown.skillMatch}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          Experience
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-dark-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                              style={{
                                width: `${candidate.breakdown.experienceMatch}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-slate-300 w-10">
                            {candidate.breakdown.experienceMatch}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Education</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-dark-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                              style={{
                                width: `${candidate.breakdown.educationMatch}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-slate-300 w-10">
                            {candidate.breakdown.educationMatch}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-4">
                      {candidate.matchedSkills &&
                        candidate.matchedSkills.length > 0 && (
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-400 mb-2">
                              ✅ Matched Skills (
                              {candidate.matchedSkills.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {candidate.matchedSkills
                                .slice(0, 5)
                                .map((skill, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs border border-green-500/30"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              {candidate.matchedSkills.length > 5 && (
                                <span className="px-2 py-1 bg-dark-800 text-slate-400 rounded text-xs">
                                  +{candidate.matchedSkills.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      {candidate.missingSkills &&
                        candidate.missingSkills.length > 0 && (
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-400 mb-2">
                              ❌ Missing Skills (
                              {candidate.missingSkills.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {candidate.missingSkills
                                .slice(0, 3)
                                .map((skill, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs border border-red-500/30"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              {candidate.missingSkills.length > 3 && (
                                <span className="px-2 py-1 bg-dark-800 text-slate-400 rounded text-xs">
                                  +{candidate.missingSkills.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer user={user} onNavigate={onNavigate} />
    </div>
  );
}

export default CandidateRankingPage;
