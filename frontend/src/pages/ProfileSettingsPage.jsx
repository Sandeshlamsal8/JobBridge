import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userAPI } from "../utils/api";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

function ProfileSettingsPage({ onNavigate }) {
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profile: {
      phone: "",
      location: "",
      bio: "",
      website: "",
    },
    jobSeekerProfile: {
      skills: [],
      experience: "",
      expectedSalary: {
        min: "",
        max: "",
      },
      jobPreferences: {
        jobTypes: [],
        remoteWork: false,
        willingToRelocate: false,
      },
    },
    employerProfile: {
      companyName: "",
      companySize: "",
      industry: "",
      companyDescription: "",
      companyWebsite: "",
    },
  });

  const [currentSkill, setCurrentSkill] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        profile: {
          phone: user.profile?.phone || "",
          location: user.profile?.location || "",
          bio: user.profile?.bio || "",
          website: user.profile?.website || "",
        },
        jobSeekerProfile: {
          skills: user.jobSeekerProfile?.skills || [],
          experience: user.jobSeekerProfile?.experience || "",
          expectedSalary: {
            min: user.jobSeekerProfile?.expectedSalary?.min || "",
            max: user.jobSeekerProfile?.expectedSalary?.max || "",
          },
          jobPreferences: {
            jobTypes: user.jobSeekerProfile?.jobPreferences?.jobTypes || [],
            remoteWork:
              user.jobSeekerProfile?.jobPreferences?.remoteWork || false,
            willingToRelocate:
              user.jobSeekerProfile?.jobPreferences?.willingToRelocate || false,
          },
        },
        employerProfile: {
          companyName: user.employerProfile?.companyName || "",
          companySize: user.employerProfile?.companySize || "",
          industry: user.employerProfile?.industry || "",
          companyDescription: user.employerProfile?.companyDescription || "",
          companyWebsite: user.employerProfile?.companyWebsite || "",
        },
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const parts = name.split(".");
      setFormData((prev) => {
        const updated = { ...prev };
        let current = updated;
        for (let i = 0; i < parts.length - 1; i++) {
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] =
          type === "checkbox" ? checked : value;
        return updated;
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    if (error) setError(null);
  };

  const handleAddSkill = () => {
    if (
      currentSkill.trim() &&
      !formData.jobSeekerProfile.skills.includes(currentSkill.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        jobSeekerProfile: {
          ...prev.jobSeekerProfile,
          skills: [...prev.jobSeekerProfile.skills, currentSkill.trim()],
        },
      }));
      setCurrentSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      jobSeekerProfile: {
        ...prev.jobSeekerProfile,
        skills: prev.jobSeekerProfile.skills.filter(
          (skill) => skill !== skillToRemove
        ),
      },
    }));
  };

  const handleJobTypeToggle = (jobType) => {
    setFormData((prev) => {
      const currentTypes = prev.jobSeekerProfile.jobPreferences.jobTypes;
      const newTypes = currentTypes.includes(jobType)
        ? currentTypes.filter((t) => t !== jobType)
        : [...currentTypes, jobType];

      return {
        ...prev,
        jobSeekerProfile: {
          ...prev.jobSeekerProfile,
          jobPreferences: {
            ...prev.jobSeekerProfile.jobPreferences,
            jobTypes: newTypes,
          },
        },
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const data = await userAPI.updateProfile(formData);

      if (data.success) {
        updateUser(data.data.user);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onNavigate("home");
  };

  const isJobSeeker = user?.userType === "jobseeker";
  const isEmployer = user?.userType === "employer";

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8">
          <button
            onClick={() =>
              onNavigate(
                isJobSeeker ? "jobseeker-dashboard" : "employer-dashboard"
              )
            }
            className="text-slate-400 hover:text-primary-400 mb-4 flex items-center gap-2"
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
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-2">
            Profile <span className="gradient-text">Settings</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Manage your profile information
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl animate-scale-in">
            <p className="text-green-400 flex items-center gap-2">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Profile updated successfully!
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Seeker: Basic Information */}
          {isJobSeeker && (
            <div className="glass-card p-6 rounded-xl">
              <h2 className="text-xl font-bold text-slate-100 mb-6">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="input-field opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="profile.phone"
                    value={formData.profile.phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="profile.location"
                    value={formData.profile.location}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="City, State, Country"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Employer: Company Information */}
          {isEmployer && (
            <div className="glass-card p-6 rounded-xl">
              <h2 className="text-xl font-bold text-slate-100 mb-6">
                Company Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Account Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="input-field opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="employerProfile.companyName"
                    value={formData.employerProfile.companyName}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Your Company Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    name="employerProfile.industry"
                    value={formData.employerProfile.industry}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Technology, Healthcare"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Company Size
                  </label>
                  <select
                    name="employerProfile.companySize"
                    value={formData.employerProfile.companySize}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Company Website
                  </label>
                  <input
                    type="url"
                    name="employerProfile.companyWebsite"
                    value={formData.employerProfile.companyWebsite}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="https://yourcompany.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Company Description
                  </label>
                  <textarea
                    name="employerProfile.companyDescription"
                    value={formData.employerProfile.companyDescription}
                    onChange={handleChange}
                    className="input-field min-h-[120px]"
                    placeholder="Tell us about your company..."
                    maxLength={1000}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.employerProfile.companyDescription.length}/1000
                    characters
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() =>
                onNavigate(
                  isJobSeeker ? "jobseeker-dashboard" : "employer-dashboard"
                )
              }
              className="btn-secondary px-8 py-3"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <Footer user={user} />
    </div>
  );
}

export default ProfileSettingsPage;
