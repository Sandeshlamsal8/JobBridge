import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

function CandidateProfilePage({ onNavigate, candidateId }) {
  const { user, logout } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (candidateId) {
      fetchCandidateProfile();
    }
  }, [candidateId]);

  const fetchCandidateProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/${candidateId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setCandidate(data.data.user);
      } else {
        setError(data.message || "Failed to load candidate profile");
      }
    } catch (error) {
      console.error("Error fetching candidate:", error);
      setError("Failed to load candidate profile. Please try again.");
    } finally {
      setIsLoading(false);
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
              <p className="text-slate-400">Loading candidate profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
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
              {error || "Candidate not found"}
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

  const profile = candidate.jobSeekerProfile || {};
  const basicProfile = candidate.profile || {};

  const formatExperienceLevel = (level) => {
    const levels = {
      entry: "Entry Level",
      mid: "Mid Level",
      senior: "Senior Level",
      executive: "Executive Level",
    };
    return levels[level] || level;
  };

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

        {/* Profile Header */}
        <div className="glass-card p-8 rounded-3xl mb-6 animate-fade-in">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Profile Picture */}
            <div className="relative">
              {basicProfile.avatar ? (
                <img
                  src={`http://localhost:5000${basicProfile.avatar}`}
                  alt={`${candidate.firstName} ${candidate.lastName}`}
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary-500/30"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-3xl flex-shrink-0">
                  {candidate.firstName?.[0]}
                  {candidate.lastName?.[0]}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-100 mb-2">
                {candidate.firstName} {candidate.lastName}
              </h1>
              {profile.headline && (
                <p className="text-xl text-primary-400 mb-4">
                  {profile.headline}
                </p>
              )}
              {profile.experienceLevel && (
                <p className="text-lg text-slate-300 mb-4">
                  {formatExperienceLevel(profile.experienceLevel)}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-slate-300">
                <span className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-slate-400"
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
                {basicProfile.location && (
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-slate-400"
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
                    {basicProfile.location}
                  </span>
                )}
                {basicProfile.phone && (
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-slate-400"
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
                    {basicProfile.phone}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={`mailto:${candidate.email}`}
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Send Email
              </a>
              {basicProfile.phone && (
                <a
                  href={`tel:${basicProfile.phone}`}
                  className="btn-secondary px-6 py-3 flex items-center gap-2"
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
                  Call
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {basicProfile.bio && (
              <div className="glass-card p-6 rounded-3xl animate-slide-up">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  About
                </h2>
                <p className="text-slate-300 leading-relaxed">
                  {basicProfile.bio}
                </p>
              </div>
            )}

            {/* Work Experience */}
            {profile.experienceHistory &&
              profile.experienceHistory.length > 0 && (
                <div className="glass-card p-6 rounded-3xl animate-slide-up">
                  <h2 className="text-2xl font-bold text-slate-100 mb-4">
                    Work Experience
                  </h2>
                  <div className="space-y-6">
                    {profile.experienceHistory.map((exp, index) => (
                      <div
                        key={exp.id || index}
                        className="border-l-2 border-primary-500 pl-4"
                      >
                        <h3 className="text-lg font-semibold text-slate-100">
                          {exp.title}
                        </h3>
                        <p className="text-primary-400 mb-2">{exp.company}</p>
                        <p className="text-sm text-slate-400 mb-2">
                          {exp.startDate} -{" "}
                          {exp.current ? "Present" : exp.endDate}
                          {exp.location && ` • ${exp.location}`}
                        </p>
                        {exp.description && (
                          <p className="text-slate-300">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <div className="glass-card p-6 rounded-3xl animate-slide-up">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  Education
                </h2>
                <div className="space-y-6">
                  {profile.education.map((edu, index) => (
                    <div
                      key={edu.id || index}
                      className="border-l-2 border-blue-500 pl-4"
                    >
                      <h3 className="text-lg font-semibold text-slate-100">
                        {edu.degree}
                      </h3>
                      <p className="text-blue-400 mb-2">{edu.institution}</p>
                      <p className="text-sm text-slate-400">
                        {edu.startDate} -{" "}
                        {edu.current ? "Present" : edu.endDate}
                        {edu.location && ` • ${edu.location}`}
                      </p>
                      {edu.description && (
                        <p className="text-slate-300 mt-2">{edu.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {profile.certifications && profile.certifications.length > 0 && (
              <div className="glass-card p-6 rounded-3xl animate-slide-up">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  Certifications
                </h2>
                <div className="space-y-4">
                  {profile.certifications.map((cert, index) => (
                    <div
                      key={cert.id || index}
                      className="border-l-2 border-green-500 pl-4"
                    >
                      <h3 className="text-lg font-semibold text-slate-100">
                        {cert.name}
                      </h3>
                      <p className="text-green-400 mb-2">{cert.issuer}</p>
                      <p className="text-sm text-slate-400">
                        Issued: {cert.issueDate}
                        {cert.expiryDate && ` • Expires: ${cert.expiryDate}`}
                        {cert.credentialId && ` • ID: ${cert.credentialId}`}
                      </p>
                      {cert.url && (
                        <a
                          href={cert.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-flex items-center gap-1"
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
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          View Certificate
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="glass-card p-6 rounded-3xl animate-slide-up">
                <h2 className="text-xl font-bold text-slate-100 mb-4">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm border border-primary-500/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Job Preferences */}
            {profile.jobPreferences && (
              <div className="glass-card p-6 rounded-3xl animate-slide-up">
                <h2 className="text-xl font-bold text-slate-100 mb-4">
                  Job Preferences
                </h2>
                <div className="space-y-4">
                  {profile.jobPreferences.jobTypes &&
                    profile.jobPreferences.jobTypes.length > 0 && (
                      <div>
                        <p className="text-slate-400 text-sm mb-2">Job Types</p>
                        <div className="flex flex-wrap gap-2">
                          {profile.jobPreferences.jobTypes.map(
                            (type, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs border border-blue-500/30"
                              >
                                {type
                                  .split("-")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(" ")}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {profile.jobPreferences.workModes &&
                    profile.jobPreferences.workModes.length > 0 && (
                      <div>
                        <p className="text-slate-400 text-sm mb-2">
                          Work Modes
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {profile.jobPreferences.workModes.map(
                            (mode, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs border border-green-500/30"
                              >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {profile.jobPreferences.categories &&
                    profile.jobPreferences.categories.length > 0 && (
                      <div>
                        <p className="text-slate-400 text-sm mb-2">
                          Preferred Categories
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {profile.jobPreferences.categories.map(
                            (category, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs border border-purple-500/30"
                              >
                                {category
                                  .split("-")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(" ")}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Remote Work</span>
                      <span
                        className={
                          profile.jobPreferences.remoteWork
                            ? "text-green-400"
                            : "text-slate-500"
                        }
                      >
                        {profile.jobPreferences.remoteWork ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Willing to Relocate
                      </span>
                      <span
                        className={
                          profile.jobPreferences.willingToRelocate
                            ? "text-green-400"
                            : "text-slate-500"
                        }
                      >
                        {profile.jobPreferences.willingToRelocate
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Links */}
            <div className="glass-card p-6 rounded-3xl animate-slide-up">
              <h2 className="text-xl font-bold text-slate-100 mb-4">Links</h2>
              <div className="space-y-3">
                {basicProfile.website && (
                  <a
                    href={basicProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
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
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                      />
                    </svg>
                    Personal Website
                  </a>
                )}

                {/* Member Since */}
                <div className="pt-4 border-t border-dark-700">
                  <p className="text-slate-400 text-sm">Member Since</p>
                  <p className="text-slate-300">
                    {new Date(candidate.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer user={user} onNavigate={onNavigate} />
    </div>
  );
}

export default CandidateProfilePage;
