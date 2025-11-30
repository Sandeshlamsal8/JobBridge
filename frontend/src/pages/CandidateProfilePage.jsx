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
      const token = localStorage.getItem("jobbridge_token");
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
            <div className="w-24 h-24 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-3xl flex-shrink-0">
              {candidate.firstName?.[0]}
              {candidate.lastName?.[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-100 mb-2">
                {candidate.firstName} {candidate.lastName}
              </h1>
              <p className="text-xl text-primary-400 mb-4">
                {profile.title || "Job Seeker"}
              </p>
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
                {profile.location && (
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
                    {profile.location}
                  </span>
                )}
                {profile.phone && (
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
                    {profile.phone}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href={`mailto:${candidate.email}`}
                className="btn-primary px-6 py-3"
              >
                Contact Candidate
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {profile.bio && (
              <div className="glass-card p-6 rounded-3xl animate-slide-up">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  About
                </h2>
                <p className="text-slate-300 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Experience */}
            {profile.experience && profile.experience.length > 0 && (
              <div className="glass-card p-6 rounded-3xl animate-slide-up">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  Work Experience
                </h2>
                <div className="space-y-6">
                  {profile.experience.map((exp, index) => (
                    <div
                      key={index}
                      className="border-l-2 border-primary-500 pl-4"
                    >
                      <h3 className="text-lg font-semibold text-slate-100">
                        {exp.title}
                      </h3>
                      <p className="text-primary-400 mb-2">{exp.company}</p>
                      <p className="text-sm text-slate-400 mb-2">
                        {exp.startDate} - {exp.endDate || "Present"}
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
                      key={index}
                      className="border-l-2 border-blue-500 pl-4"
                    >
                      <h3 className="text-lg font-semibold text-slate-100">
                        {edu.degree}
                      </h3>
                      <p className="text-blue-400 mb-2">{edu.institution}</p>
                      <p className="text-sm text-slate-400">
                        {edu.startDate} - {edu.endDate || "Present"}
                        {edu.gpa && ` • GPA: ${edu.gpa}`}
                      </p>
                      {edu.description && (
                        <p className="text-slate-300 mt-2">{edu.description}</p>
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

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <div className="glass-card p-6 rounded-3xl animate-slide-up">
                <h2 className="text-xl font-bold text-slate-100 mb-4">
                  Languages
                </h2>
                <div className="space-y-2">
                  {profile.languages.map((lang, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-slate-300">{lang.language}</span>
                      <span className="text-slate-400 text-sm">
                        {lang.proficiency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="glass-card p-6 rounded-3xl animate-slide-up">
              <h2 className="text-xl font-bold text-slate-100 mb-4">Links</h2>
              <div className="space-y-3">
                {profile.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    LinkedIn Profile
                  </a>
                )}
                {profile.github && (
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub Profile
                  </a>
                )}
                {profile.portfolio && (
                  <a
                    href={profile.portfolio}
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
                    Portfolio Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer user={user} />
    </div>
  );
}

export default CandidateProfilePage;
