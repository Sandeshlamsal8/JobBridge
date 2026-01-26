import { useState } from "react";
import { showToast } from "./ToastContainer";
import LocationAutocomplete from "./LocationAutocomplete";

function JobSeekerSetupModal({ isOpen, onClose, onComplete, user }) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] = useState({
    // Basic Info
    phone: "",
    location: "",
    bio: "",
    website: "",
    // Professional Info
    headline: "",
    experienceLevel: "",
    skills: [],
    // Job Preferences
    jobTypes: [],
    workModes: [],
    categories: [],
    willingToRelocate: false,
    expectedSalary: {
      min: "",
      max: "",
      currency: "USD",
      period: "yearly"
    }
  });

  const [newSkill, setNewSkill] = useState("");

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setProfileData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleArrayToggle = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill) => {
    setProfileData((prev) => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return profileData.phone.trim() && profileData.location.trim();
      case 2:
        return profileData.headline.trim() && profileData.experienceLevel && profileData.skills.length > 0;
      case 3:
        return profileData.jobTypes.length > 0 && profileData.workModes.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    } else {
      showToast("Please fill in all required fields", "error");
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      showToast("Please fill in all required fields", "error");
      return;
    }

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
            profile: {
              phone: profileData.phone,
              location: profileData.location,
              bio: profileData.bio,
              website: profileData.website,
            },
            jobSeekerProfile: {
              headline: profileData.headline,
              experienceLevel: profileData.experienceLevel,
              skills: profileData.skills,
              jobPreferences: {
                jobTypes: profileData.jobTypes,
                workModes: profileData.workModes,
                categories: profileData.categories,
                willingToRelocate: profileData.willingToRelocate,
              },
              expectedSalary: profileData.expectedSalary,
            },
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        showToast("Profile setup completed successfully!", "success");
        onComplete(profileData);
      } else {
        showToast(data.message || "Failed to save profile", "error");
      }
    } catch (error) {
      console.error("Profile setup error:", error);
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">📱</div>
        <h3 className="text-xl font-semibold text-slate-100 mb-2">
          Contact Information
        </h3>
        <p className="text-slate-400">
          Let employers know how to reach you
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={profileData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Location *
          </label>
          <LocationAutocomplete
            value={profileData.location}
            onChange={(value) => handleInputChange("location", value)}
            placeholder="Enter your city, state"
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Website (Optional)
          </label>
          <input
            type="url"
            value={profileData.website}
            onChange={(e) => handleInputChange("website", e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="https://your-portfolio.com"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">💼</div>
        <h3 className="text-xl font-semibold text-slate-100 mb-2">
          Professional Profile
        </h3>
        <p className="text-slate-400">
          Tell us about your professional background
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Professional Headline *
          </label>
          <input
            type="text"
            value={profileData.headline}
            onChange={(e) => handleInputChange("headline", e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., Full Stack Developer | React & Node.js Expert"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Experience Level *
          </label>
          <select
            value={profileData.experienceLevel}
            onChange={(e) => handleInputChange("experienceLevel", e.target.value)}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select experience level</option>
            <option value="entry">Entry Level (0-2 years)</option>
            <option value="mid">Mid Level (3-5 years)</option>
            <option value="senior">Senior Level (6+ years)</option>
            <option value="executive">Executive Level</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Skills * (Add at least 3)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Add a skill"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profileData.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-1 text-primary-400 hover:text-primary-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">⚙️</div>
        <h3 className="text-xl font-semibold text-slate-100 mb-2">
          Job Preferences
        </h3>
        <p className="text-slate-400">
          Help us find the perfect job matches for you
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Job Types * (Select all that apply)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {["full-time", "part-time", "contract", "internship", "freelance"].map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profileData.jobTypes.includes(type)}
                  onChange={() => handleArrayToggle("jobTypes", type)}
                  className="w-4 h-4 text-primary-600 bg-slate-700 border-slate-600 rounded focus:ring-primary-500"
                />
                <span className="text-slate-300 capitalize">{type.replace('-', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Work Modes * (Select all that apply)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {["remote", "hybrid", "onsite"].map((mode) => (
              <label key={mode} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profileData.workModes.includes(mode)}
                  onChange={() => handleArrayToggle("workModes", mode)}
                  className="w-4 h-4 text-primary-600 bg-slate-700 border-slate-600 rounded focus:ring-primary-500"
                />
                <span className="text-slate-300 capitalize">{mode}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={profileData.willingToRelocate}
              onChange={(e) => handleInputChange("willingToRelocate", e.target.checked)}
              className="w-4 h-4 text-primary-600 bg-slate-700 border-slate-600 rounded focus:ring-primary-500"
            />
            <span className="text-slate-300">Willing to relocate for the right opportunity</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Expected Salary Range (Optional)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={profileData.expectedSalary.min}
              onChange={(e) => handleInputChange("expectedSalary.min", e.target.value)}
              className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Min salary"
            />
            <input
              type="number"
              value={profileData.expectedSalary.max}
              onChange={(e) => handleInputChange("expectedSalary.max", e.target.value)}
              className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Max salary"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">
              Welcome to JobBridge!
            </h2>
            <p className="text-slate-300">
              Let's set up your profile to get you started
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Step {currentStep} of 3</span>
              <span className="text-sm text-slate-400">{Math.round((currentStep / 3) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <div>
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-colors"
                >
                  Back
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="px-6 py-3 text-slate-400 hover:text-slate-300 transition-colors"
              >
                Skip for now
              </button>
              
              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                  className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !validateStep(currentStep)}
                  className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Saving..." : "Complete Setup"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobSeekerSetupModal;