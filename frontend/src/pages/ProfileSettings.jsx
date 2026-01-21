import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "../components/ToastContainer";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import LocationAutocomplete from "../components/LocationAutocomplete";
import { useProfileCompletion } from "../hooks/useProfileCompletion";

function ProfileSettings({ onNavigate }) {
  const { user, logout, updateUser } = useAuth();
  const { completionData, refreshCompletion } = useProfileCompletion();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Basic Info State
  const [basicInfo, setBasicInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    website: "",
    avatar: "",
  });

  // Profile picture state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Experience modal state
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState(null);
  const [experienceForm, setExperienceForm] = useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });

  // Job Seeker Profile State
  const [jobSeekerProfile, setJobSeekerProfile] = useState({
    headline: "",
    skills: [],
    experienceLevel: "",
    expectedSalary: { min: "", max: "", currency: "USD", period: "yearly" },
    jobPreferences: {
      jobTypes: [],
      workModes: [],
      categories: [],
      willingToRelocate: false,
    },
    resume: null,
  });

  // Experience State
  const [experiences, setExperiences] = useState([]);
  const [education, setEducation] = useState([]);
  const [certifications, setCertifications] = useState([]);

  // Employer Profile State
  const [employerProfile, setEmployerProfile] = useState({
    companyName: "",
    companySize: "",
    industry: "",
    companyDescription: "",
    companyWebsite: "",
    companyLocation: "",
    foundedYear: "",
  });

  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem("jobbridge_token");

      if (!token) {
        showToast("No authentication token found", "error");
        return;
      }

      console.log(
        "Fetching profile with token:",
        token.substring(0, 20) + "..."
      );

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Profile response status:", response.status);

      const data = await response.json();
      console.log("Profile response data:", data);

      if (data.success) {
        const profile = data.data.user;
        console.log("User profile loaded:", profile);

        // Set basic info conditionally based on user type
        const basicInfoData = {
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          email: profile.email || "",
          avatar: profile.profile?.avatar || "",
        };

        // Only include additional fields for job seekers
        if (profile.userType === "jobseeker") {
          basicInfoData.phone = profile.profile?.phone || "";
          basicInfoData.location = profile.profile?.location || "";
          basicInfoData.bio = profile.profile?.bio || "";
          basicInfoData.website = profile.profile?.website || "";
        } else {
          // For employers, set empty values to avoid undefined errors
          basicInfoData.phone = "";
          basicInfoData.location = "";
          basicInfoData.bio = "";
          basicInfoData.website = "";
        }

        setBasicInfo(basicInfoData);

        // Set job seeker profile
        if (profile.userType === "jobseeker" && profile.jobSeekerProfile) {
          setJobSeekerProfile({
            headline: profile.jobSeekerProfile.headline || "",
            skills: profile.jobSeekerProfile.skills || [],
            experienceLevel:
              profile.jobSeekerProfile.experienceLevel ||
              profile.jobSeekerProfile.experience ||
              "",
            expectedSalary: profile.jobSeekerProfile.expectedSalary || {
              min: "",
              max: "",
              currency: "USD",
              period: "yearly",
            },
            jobPreferences: profile.jobSeekerProfile.jobPreferences || {
              jobTypes: [],
              workModes: [],
              categories: [],
              willingToRelocate: false,
            },
            resume: profile.jobSeekerProfile.resume || null,
          });
          setExperiences(
            profile.jobSeekerProfile.experienceHistory ||
              profile.jobSeekerProfile.experience ||
              []
          );
          setEducation(profile.jobSeekerProfile.education || []);
          setCertifications(profile.jobSeekerProfile.certifications || []);
        }

        // Set employer profile
        if (profile.userType === "employer" && profile.employerProfile) {
          setEmployerProfile({
            companyName: profile.employerProfile.companyName || "",
            companySize: profile.employerProfile.companySize || "",
            industry: profile.employerProfile.industry || "",
            companyDescription:
              profile.employerProfile.companyDescription || "",
            companyWebsite: profile.employerProfile.companyWebsite || "",
            companyLocation: profile.employerProfile.companyLocation || "",
            foundedYear: profile.employerProfile.foundedYear || "",
          });
        }
      } else {
        showToast(data.message || "Failed to load profile", "error");
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
      showToast("Failed to load profile", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBasicInfoSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem("jobbridge_token");

      if (!token) {
        showToast("No authentication token found", "error");
        return;
      }

      const updateData = {
        firstName: basicInfo.firstName,
        lastName: basicInfo.lastName,
      };

      // Only include profile fields for job seekers
      if (user?.userType === "jobseeker") {
        updateData.profile = {
          phone: basicInfo.phone,
          location: basicInfo.location,
          bio: basicInfo.bio,
          website: basicInfo.website,
        };
      }

      console.log("Updating basic info:", updateData);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      console.log("Update response status:", response.status);

      const data = await response.json();
      console.log("Update response data:", data);

      if (data.success) {
        showToast("Basic information updated successfully", "success");
        refreshCompletion(); // Refresh completion data
      } else {
        showToast(data.message || "Failed to update profile", "error");
      }
    } catch (error) {
      console.error("Update error:", error);
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobSeekerProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            jobSeekerProfile: {
              ...jobSeekerProfile,
              experience: experiences,
              education: education,
              certifications: certifications,
            },
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        showToast("Job seeker profile updated successfully", "success");
        refreshCompletion(); // Refresh completion data
      } else {
        showToast(data.message || "Failed to update profile", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployerProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            employerProfile: employerProfile,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        showToast("Company profile updated successfully", "success");
        refreshCompletion(); // Refresh completion data
      } else {
        showToast(data.message || "Failed to update profile", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !jobSeekerProfile.skills.includes(newSkill.trim())) {
      setJobSeekerProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setJobSeekerProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const addExperience = () => {
    setExperienceForm({
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    });
    setEditingExperience(null);
    setShowExperienceModal(true);
  };

  const editExperience = (exp) => {
    setExperienceForm({
      title: exp.title || "",
      company: exp.company || "",
      location: exp.location || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      current: exp.current || false,
      description: exp.description || "",
    });
    setEditingExperience(exp.id);
    setShowExperienceModal(true);
  };

  const saveExperience = () => {
    if (!experienceForm.title || !experienceForm.company) {
      showToast("Please fill in job title and company name", "error");
      return;
    }

    if (editingExperience) {
      // Update existing experience
      setExperiences((prev) =>
        prev.map((exp) =>
          exp.id === editingExperience ? { ...exp, ...experienceForm } : exp
        )
      );
    } else {
      // Add new experience
      const newExp = {
        id: Date.now(),
        ...experienceForm,
      };
      setExperiences((prev) => [...prev, newExp]);
    }

    setShowExperienceModal(false);
    setEditingExperience(null);
    showToast(
      editingExperience
        ? "Experience updated successfully"
        : "Experience added successfully",
      "success"
    );
  };

  const cancelExperienceModal = () => {
    setShowExperienceModal(false);
    setEditingExperience(null);
    setExperienceForm({
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    });
  };

  const removeExperience = (id) => {
    setExperiences((prev) => prev.filter((exp) => exp.id !== id));
    showToast("Experience removed successfully", "success");
  };

  const handleLogout = async () => {
    await logout();
    onNavigate("home");
  };

  // Profile picture functions
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast("Please select a valid image file", "error");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size must be less than 5MB", "error");
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!selectedImage) {
      showToast("Please select an image first", "error");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", selectedImage);

      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/profile-picture`,
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
        showToast("Profile picture updated successfully", "success");
        setSelectedImage(null);
        setImagePreview(null);
        // Update avatar in basicInfo
        setBasicInfo((prev) => ({ ...prev, avatar: data.data.avatar }));
        // Update user context with new avatar
        updateUser({
          ...user,
          profile: {
            ...user.profile,
            avatar: data.data.avatar,
          },
        });
      } else {
        showToast(data.message || "Failed to update profile picture", "error");
      }
    } catch (error) {
      console.error("Profile picture upload error:", error);
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: "👤" },
    ...(user?.userType === "jobseeker"
      ? [
          { id: "professional", label: "Professional", icon: "💼" },
          { id: "experience", label: "Experience", icon: "🏢" },
          { id: "preferences", label: "Job Preferences", icon: "⚙️" },
        ]
      : []),
    ...(user?.userType === "employer"
      ? [{ id: "company", label: "Company Info", icon: "🏢" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() =>
                onNavigate(
                  user?.userType === "employer"
                    ? "employer-dashboard"
                    : "jobseeker-dashboard"
                )
              }
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
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
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-100">
                Profile Settings
              </h1>
              <p className="text-slate-400">
                Manage your profile information and preferences
              </p>

              {/* Profile Completion Indicator */}
              {completionData && (
                <div className="mt-4 p-4 glass-card rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">
                      Profile Completion
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        completionData.overallPercentage >= 80
                          ? "text-green-400"
                          : completionData.overallPercentage >= 50
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {completionData.overallPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        completionData.overallPercentage >= 80
                          ? "bg-green-400"
                          : completionData.overallPercentage >= 50
                          ? "bg-yellow-400"
                          : "bg-red-400"
                      }`}
                      style={{ width: `${completionData.overallPercentage}%` }}
                    ></div>
                  </div>
                  {completionData.overallPercentage < 100 && (
                    <p className="text-xs text-slate-400 mt-2">
                      Complete your profile to increase your visibility to
                      employers
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="border-b border-dark-600/50">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "text-primary-400 border-b-2 border-primary-400"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6 lg:p-8">
            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <div className="space-y-8">
                {/* Profile Picture Section */}
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Profile Picture
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <img
                        src={
                          imagePreview ||
                          (basicInfo.avatar
                            ? `http://localhost:5000${basicInfo.avatar}`
                            : "/placeholder-user.jpg")
                        }
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-2 border-slate-600"
                      />
                      {isLoading && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        id="profilePicture"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                      <div className="flex gap-3">
                        <label
                          htmlFor="profilePicture"
                          className="btn-secondary px-4 py-2 text-sm cursor-pointer inline-block"
                        >
                          Choose Image
                        </label>
                        {selectedImage && (
                          <button
                            type="button"
                            onClick={handleUploadProfilePicture}
                            disabled={isLoading}
                            className="btn-primary px-4 py-2 text-sm"
                          >
                            {isLoading ? "Uploading..." : "Upload"}
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        JPG, PNG or GIF. Max size 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Basic Information Form */}
                <form onSubmit={handleBasicInfoSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-3">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={basicInfo.firstName}
                        onChange={(e) =>
                          setBasicInfo((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-3">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={basicInfo.lastName}
                        onChange={(e) =>
                          setBasicInfo((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        className="input-field"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-3">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={basicInfo.email}
                      className="input-field bg-slate-700/50 cursor-not-allowed"
                      disabled
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      Email cannot be changed
                    </p>
                  </div>

                  {/* Show additional fields only for job seekers */}
                  {user?.userType === "jobseeker" && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-3">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={basicInfo.phone}
                            onChange={(e) =>
                              setBasicInfo((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            className="input-field"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-300 mb-3">
                            Location
                          </label>
                          <LocationAutocomplete
                            value={basicInfo.location}
                            onChange={(value) =>
                              setBasicInfo((prev) => ({
                                ...prev,
                                location: value,
                              }))
                            }
                            placeholder="City, State, Country"
                            className="input-field"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-3">
                          Bio
                        </label>
                        <textarea
                          value={basicInfo.bio}
                          onChange={(e) =>
                            setBasicInfo((prev) => ({
                              ...prev,
                              bio: e.target.value,
                            }))
                          }
                          className="input-field resize-none"
                          rows={4}
                          placeholder="Tell us about yourself..."
                          maxLength={500}
                        />
                        <p className="text-xs text-slate-400 mt-2">
                          {basicInfo.bio.length}/500 characters
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-3">
                          Website
                        </label>
                        <input
                          type="url"
                          value={basicInfo.website}
                          onChange={(e) =>
                            setBasicInfo((prev) => ({
                              ...prev,
                              website: e.target.value,
                            }))
                          }
                          className="input-field"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="btn-primary px-8 py-3"
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Job Seeker Professional Tab */}
            {activeTab === "professional" && user?.userType === "jobseeker" && (
              <form
                onSubmit={handleJobSeekerProfileSubmit}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Professional Headline
                  </label>
                  <input
                    type="text"
                    value={jobSeekerProfile.headline}
                    onChange={(e) =>
                      setJobSeekerProfile((prev) => ({
                        ...prev,
                        headline: e.target.value,
                      }))
                    }
                    className="input-field"
                    placeholder="e.g., Senior Software Engineer | React & Node.js Expert"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Skills
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      className="input-field flex-1"
                      placeholder="Add a skill..."
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addSkill())
                      }
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="btn-primary px-4 py-2"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {jobSeekerProfile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm border border-primary-500/30 flex items-center gap-2"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="text-primary-400 hover:text-primary-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Experience Level
                  </label>
                  <select
                    value={jobSeekerProfile.experienceLevel}
                    onChange={(e) =>
                      setJobSeekerProfile((prev) => ({
                        ...prev,
                        experienceLevel: e.target.value,
                      }))
                    }
                    className="input-field"
                  >
                    <option value="">Select experience level</option>
                    <option value="entry">Entry Level (0-2 years)</option>
                    <option value="mid">Mid Level (2-5 years)</option>
                    <option value="senior">Senior Level (5-10 years)</option>
                    <option value="executive">Executive (10+ years)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Expected Salary Range
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <input
                      type="number"
                      value={jobSeekerProfile.expectedSalary.min}
                      onChange={(e) =>
                        setJobSeekerProfile((prev) => ({
                          ...prev,
                          expectedSalary: {
                            ...prev.expectedSalary,
                            min: e.target.value,
                          },
                        }))
                      }
                      className="input-field"
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      value={jobSeekerProfile.expectedSalary.max}
                      onChange={(e) =>
                        setJobSeekerProfile((prev) => ({
                          ...prev,
                          expectedSalary: {
                            ...prev.expectedSalary,
                            max: e.target.value,
                          },
                        }))
                      }
                      className="input-field"
                      placeholder="Max"
                    />
                    <select
                      value={jobSeekerProfile.expectedSalary.currency}
                      onChange={(e) =>
                        setJobSeekerProfile((prev) => ({
                          ...prev,
                          expectedSalary: {
                            ...prev.expectedSalary,
                            currency: e.target.value,
                          },
                        }))
                      }
                      className="input-field"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                    <select
                      value={jobSeekerProfile.expectedSalary.period}
                      onChange={(e) =>
                        setJobSeekerProfile((prev) => ({
                          ...prev,
                          expectedSalary: {
                            ...prev.expectedSalary,
                            period: e.target.value,
                          },
                        }))
                      }
                      className="input-field"
                    >
                      <option value="hourly">Per Hour</option>
                      <option value="monthly">Per Month</option>
                      <option value="yearly">Per Year</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn-primary px-8 py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {/* Experience Tab */}
            {activeTab === "experience" && user?.userType === "jobseeker" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-100">
                    Work Experience
                  </h3>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    Add Experience
                  </button>
                </div>

                {experiences.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <div className="text-4xl mb-2">💼</div>
                    <p>No work experience added yet</p>
                    <p className="text-sm mt-2">
                      Click "Add Experience" to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="glass-card p-6 rounded-xl">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-100 text-lg">
                              {exp.title || "Untitled Position"}
                            </h4>
                            <p className="text-primary-400 font-medium">
                              {exp.company || "Company Name"}
                            </p>
                            <p className="text-slate-400 text-sm">
                              {exp.location && `${exp.location} • `}
                              {exp.startDate && (
                                <>
                                  {new Date(
                                    exp.startDate + "-01"
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    year: "numeric",
                                  })}
                                  {" - "}
                                  {exp.current
                                    ? "Present"
                                    : exp.endDate
                                    ? new Date(
                                        exp.endDate + "-01"
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "End Date"}
                                </>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => editExperience(exp)}
                              className="text-slate-400 hover:text-primary-400 transition-colors"
                              title="Edit"
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeExperience(exp.id)}
                              className="text-slate-400 hover:text-red-400 transition-colors"
                              title="Delete"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {exp.description && (
                          <div className="mt-3 p-3 bg-dark-800/50 rounded-lg">
                            <p className="text-slate-300 text-sm leading-relaxed">
                              {exp.description}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handleJobSeekerProfileSubmit}
                    className="btn-primary px-8 py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Experience"}
                  </button>
                </div>
              </div>
            )}

            {/* Job Preferences Tab */}
            {activeTab === "preferences" && user?.userType === "jobseeker" && (
              <form
                onSubmit={handleJobSeekerProfileSubmit}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Job Types
                  </label>
                  <p className="text-xs text-slate-400 mb-3">
                    Select the types of employment you're interested in
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "full-time",
                      "part-time",
                      "contract",
                      "internship",
                      "freelance",
                    ].map((type) => (
                      <label
                        key={type}
                        className="flex items-center gap-2 p-3 glass-card rounded-lg cursor-pointer hover:bg-dark-700/30 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={jobSeekerProfile.jobPreferences.jobTypes.includes(
                            type
                          )}
                          onChange={(e) => {
                            const updatedTypes = e.target.checked
                              ? [
                                  ...jobSeekerProfile.jobPreferences.jobTypes,
                                  type,
                                ]
                              : jobSeekerProfile.jobPreferences.jobTypes.filter(
                                  (t) => t !== type
                                );

                            setJobSeekerProfile((prev) => ({
                              ...prev,
                              jobPreferences: {
                                ...prev.jobPreferences,
                                jobTypes: updatedTypes,
                              },
                            }));
                          }}
                          className="rounded border-slate-600 bg-dark-700 text-primary-500"
                        />
                        <span className="text-sm text-slate-300 capitalize">
                          {type.replace("-", " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Work Modes
                  </label>
                  <p className="text-xs text-slate-400 mb-3">
                    Choose your preferred work arrangements
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {["remote", "hybrid", "onsite"].map((mode) => (
                      <label
                        key={mode}
                        className="flex items-center gap-2 p-3 glass-card rounded-lg cursor-pointer hover:bg-dark-700/30 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={jobSeekerProfile.jobPreferences.workModes.includes(
                            mode
                          )}
                          onChange={(e) => {
                            const updatedModes = e.target.checked
                              ? [
                                  ...jobSeekerProfile.jobPreferences.workModes,
                                  mode,
                                ]
                              : jobSeekerProfile.jobPreferences.workModes.filter(
                                  (m) => m !== mode
                                );

                            setJobSeekerProfile((prev) => ({
                              ...prev,
                              jobPreferences: {
                                ...prev.jobPreferences,
                                workModes: updatedModes,
                              },
                            }));
                          }}
                          className="rounded border-slate-600 bg-dark-700 text-primary-500"
                        />
                        <span className="text-sm text-slate-300 capitalize">
                          {mode}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Job Categories
                  </label>
                  <p className="text-xs text-slate-400 mb-3">
                    Select industries and fields you're interested in
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "technology",
                      "healthcare",
                      "finance",
                      "education",
                      "marketing",
                      "sales",
                      "design",
                      "engineering",
                      "consulting",
                      "retail",
                      "manufacturing",
                      "media",
                      "legal",
                      "nonprofit",
                      "government",
                    ].map((category) => (
                      <label
                        key={category}
                        className="flex items-center gap-2 p-3 glass-card rounded-lg cursor-pointer hover:bg-dark-700/30 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={jobSeekerProfile.jobPreferences.categories.includes(
                            category
                          )}
                          onChange={(e) => {
                            const updatedCategories = e.target.checked
                              ? [
                                  ...jobSeekerProfile.jobPreferences.categories,
                                  category,
                                ]
                              : jobSeekerProfile.jobPreferences.categories.filter(
                                  (c) => c !== category
                                );

                            setJobSeekerProfile((prev) => ({
                              ...prev,
                              jobPreferences: {
                                ...prev.jobPreferences,
                                categories: updatedCategories,
                              },
                            }));
                          }}
                          className="rounded border-slate-600 bg-dark-700 text-primary-500"
                        />
                        <span className="text-sm text-slate-300 capitalize">
                          {category}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Relocation Preferences
                  </label>
                  <div className="glass-card p-4 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          jobSeekerProfile.jobPreferences.willingToRelocate
                        }
                        onChange={(e) =>
                          setJobSeekerProfile((prev) => ({
                            ...prev,
                            jobPreferences: {
                              ...prev.jobPreferences,
                              willingToRelocate: e.target.checked,
                            },
                          }))
                        }
                        className="rounded border-slate-600 bg-dark-700 text-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-300">
                          I'm willing to relocate for the right opportunity
                        </span>
                        <p className="text-xs text-slate-400 mt-1">
                          This will help employers know if you're open to
                          positions in different locations
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn-primary px-8 py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </form>
            )}

            {/* Company Info Tab */}
            {activeTab === "company" && user?.userType === "employer" && (
              <form
                onSubmit={handleEmployerProfileSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-3">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={employerProfile.companyName}
                      onChange={(e) =>
                        setEmployerProfile((prev) => ({
                          ...prev,
                          companyName: e.target.value,
                        }))
                      }
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-3">
                      Company Size
                    </label>
                    <select
                      value={employerProfile.companySize}
                      onChange={(e) =>
                        setEmployerProfile((prev) => ({
                          ...prev,
                          companySize: e.target.value,
                        }))
                      }
                      className="input-field"
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-3">
                      Industry
                    </label>
                    <select
                      value={employerProfile.industry}
                      onChange={(e) =>
                        setEmployerProfile((prev) => ({
                          ...prev,
                          industry: e.target.value,
                        }))
                      }
                      className="input-field"
                    >
                      <option value="">Select industry</option>
                      <option value="technology">Technology</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="finance">Finance</option>
                      <option value="education">Education</option>
                      <option value="retail">Retail</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="consulting">Consulting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-3">
                      Founded Year
                    </label>
                    <input
                      type="number"
                      value={employerProfile.foundedYear}
                      onChange={(e) =>
                        setEmployerProfile((prev) => ({
                          ...prev,
                          foundedYear: e.target.value,
                        }))
                      }
                      className="input-field"
                      min="1800"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Company Description
                  </label>
                  <textarea
                    value={employerProfile.companyDescription}
                    onChange={(e) =>
                      setEmployerProfile((prev) => ({
                        ...prev,
                        companyDescription: e.target.value,
                      }))
                    }
                    className="input-field resize-none"
                    rows={4}
                    placeholder="Describe your company, mission, and culture..."
                    maxLength={1000}
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    {employerProfile.companyDescription.length}/1000 characters
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-3">
                      Company Website
                    </label>
                    <input
                      type="url"
                      value={employerProfile.companyWebsite}
                      onChange={(e) =>
                        setEmployerProfile((prev) => ({
                          ...prev,
                          companyWebsite: e.target.value,
                        }))
                      }
                      className="input-field"
                      placeholder="https://company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-3">
                      Company Location
                    </label>
                    <LocationAutocomplete
                      value={employerProfile.companyLocation}
                      onChange={(value) =>
                        setEmployerProfile((prev) => ({
                          ...prev,
                          companyLocation: value,
                        }))
                      }
                      placeholder="City, State, Country"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="btn-primary px-8 py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Experience Modal */}
      {showExperienceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-600">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-slate-100">
                  {editingExperience
                    ? "Edit Experience"
                    : "Add Work Experience"}
                </h3>
                <button
                  onClick={cancelExperienceModal}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={experienceForm.title}
                    onChange={(e) =>
                      setExperienceForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="input-field"
                    placeholder="e.g., Software Engineer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={experienceForm.company}
                    onChange={(e) =>
                      setExperienceForm((prev) => ({
                        ...prev,
                        company: e.target.value,
                      }))
                    }
                    className="input-field"
                    placeholder="e.g., Google"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Location
                </label>
                <LocationAutocomplete
                  value={experienceForm.location}
                  onChange={(value) =>
                    setExperienceForm((prev) => ({
                      ...prev,
                      location: value,
                    }))
                  }
                  placeholder="City, State, Country"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="month"
                    value={experienceForm.startDate}
                    onChange={(e) =>
                      setExperienceForm((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="month"
                    value={experienceForm.endDate}
                    onChange={(e) =>
                      setExperienceForm((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="input-field"
                    disabled={experienceForm.current}
                    placeholder={experienceForm.current ? "Present" : ""}
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={experienceForm.current}
                    onChange={(e) =>
                      setExperienceForm((prev) => ({
                        ...prev,
                        current: e.target.checked,
                        endDate: e.target.checked ? "" : prev.endDate,
                      }))
                    }
                    className="rounded border-slate-600 bg-dark-700 text-primary-500"
                  />
                  I currently work here
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={experienceForm.description}
                  onChange={(e) =>
                    setExperienceForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="input-field resize-none"
                  rows={4}
                  placeholder="Describe your responsibilities, achievements, and key projects..."
                />
                <p className="text-xs text-slate-400 mt-1">
                  Include specific achievements, technologies used, and impact
                  made
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-dark-600 flex justify-end gap-3">
              <button
                onClick={cancelExperienceModal}
                className="btn-secondary px-6 py-2"
              >
                Cancel
              </button>
              <button
                onClick={saveExperience}
                className="btn-primary px-6 py-2"
                disabled={!experienceForm.title || !experienceForm.company}
              >
                {editingExperience ? "Update Experience" : "Add Experience"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer user={user} onNavigate={onNavigate} />
    </div>
  );
}

export default ProfileSettings;
