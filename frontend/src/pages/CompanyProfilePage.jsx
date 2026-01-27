import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

function CompanyProfilePage({ onNavigate, companyId, referrer }) {
  const { user, logout } = useAuth();
  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (companyId) {
      fetchCompanyProfile();
    }
  }, [companyId]);

  const handleBackNavigation = () => {
    // Smart back navigation based on referrer or user type
    if (referrer) {
      if (referrer.startsWith("job-details/")) {
        // Navigate back to the specific job details page
        onNavigate(referrer);
      } else {
        // Navigate to the referrer page
        onNavigate(referrer);
      }
    } else if (user?.userType === "jobseeker") {
      onNavigate("jobseeker-dashboard");
    } else {
      onNavigate("home");
    }
  };

  const fetchCompanyProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/company/${companyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (data.success) {
        setCompany(data.data.company);
        // Record profile view
        await recordProfileView();
      } else {
        setError(data.message || "Failed to load company profile");
      }
    } catch (error) {
      console.error("Error fetching company:", error);
      setError("Failed to load company profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const recordProfileView = async () => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      await fetch(`${import.meta.env.VITE_API_URL}/profile-views`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profileOwnerId: companyId,
          viewerType: user?.userType || "anonymous",
          source: "direct_link",
        }),
      });
    } catch (error) {
      console.error("Error recording profile view:", error);
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
              <p className="text-slate-400">Loading company profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
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
              {error || "Company not found"}
            </h2>
            <button
              onClick={handleBackNavigation}
              className="btn-primary px-6 py-3 mt-4"
            >
              Go Back
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
          onClick={handleBackNavigation}
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
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Header */}
            <div className="glass-card p-8 rounded-3xl animate-fade-in">
              <div className="flex items-start gap-6 mb-6">
                {/* Company Avatar */}
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                  {company.profile?.avatar ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}/users/avatar/${company._id}?t=${Date.now()}`}
                      alt={
                        company.employerProfile?.companyName ||
                        `${company.firstName} ${company.lastName}`
                      }
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {(
                        company.employerProfile?.companyName ||
                        company.firstName
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-slate-100 mb-2">
                    {company.employerProfile?.companyName ||
                      `${company.firstName} ${company.lastName}`}
                  </h1>
                  {company.employerProfile?.industry && (
                    <p className="text-xl text-slate-300 mb-3">
                      {company.employerProfile.industry}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-slate-400">
                    {company.profile?.location && (
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
                        {company.profile.location}
                      </span>
                    )}
                    {company.employerProfile?.companySize && (
                      <>
                        <span>•</span>
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
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          {company.employerProfile.companySize} employees
                        </span>
                      </>
                    )}
                    {company.employerProfile?.foundedYear && (
                      <>
                        <span>•</span>
                        <span>
                          Founded {company.employerProfile.foundedYear}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Stats */}
              <div className="flex gap-6 text-sm text-slate-400 pt-4 border-t border-slate-700/50">
                <span>
                  Member since{" "}
                  {new Date(company.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* About Company */}
            {(company.employerProfile?.companyDescription ||
              company.profile?.bio) && (
              <div className="glass-card p-8 rounded-3xl animate-slide-up">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">
                  About {company.employerProfile?.companyName || "Company"}
                </h2>
                <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {company.employerProfile?.companyDescription ||
                    company.profile?.bio}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="glass-card p-6 rounded-3xl animate-slide-up">
                <h2 className="text-xl font-bold text-slate-100 mb-4">
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Email</p>
                    <p className="text-slate-100">{company.email}</p>
                  </div>
                  {company.profile?.phone && (
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Phone</p>
                      <p className="text-slate-100">{company.profile.phone}</p>
                    </div>
                  )}
                  {(company.employerProfile?.companyWebsite ||
                    company.profile?.website) && (
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Website</p>
                      <a
                        href={
                          company.employerProfile?.companyWebsite ||
                          company.profile?.website
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:text-primary-300 break-all"
                      >
                        {company.employerProfile?.companyWebsite ||
                          company.profile?.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Details */}
              <div className="glass-card p-6 rounded-3xl animate-slide-up">
                <h2 className="text-xl font-bold text-slate-100 mb-4">
                  Company Details
                </h2>
                <div className="space-y-4">
                  {company.employerProfile?.industry && (
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Industry</p>
                      <p className="text-slate-100">
                        {company.employerProfile.industry}
                      </p>
                    </div>
                  )}
                  {company.employerProfile?.companySize && (
                    <div>
                      <p className="text-slate-400 text-sm mb-1">
                        Company Size
                      </p>
                      <p className="text-slate-100">
                        {company.employerProfile.companySize} employees
                      </p>
                    </div>
                  )}
                  {company.employerProfile?.foundedYear && (
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Founded</p>
                      <p className="text-slate-100">
                        {company.employerProfile.foundedYear}
                      </p>
                    </div>
                  )}
                  {company.employerProfile?.companyLocation && (
                    <div>
                      <p className="text-slate-400 text-sm mb-1">
                        Headquarters
                      </p>
                      <p className="text-slate-100">
                        {company.employerProfile.companyLocation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default CompanyProfilePage;
