import { useState } from "react";
import { showToast } from "./ToastContainer";
import LocationAutocomplete from "./LocationAutocomplete";

function CompanySetupModal({ isOpen, onClose, onComplete, user }) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [companyData, setCompanyData] = useState({
    companyName: "",
    companySize: "",
    industry: "",
    companyDescription: "",
    companyWebsite: "",
    companyLocation: "",
    foundedYear: "",
  });

  const handleInputChange = (field, value) => {
    setCompanyData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return companyData.companyName.trim() && companyData.industry;
      case 2:
        return companyData.companySize && companyData.companyLocation;
      case 3:
        return companyData.companyDescription.trim().length >= 50;
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
    if (!validateStep(3)) {
      showToast("Please complete all required fields", "error");
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
            employerProfile: companyData,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        showToast("Company information saved successfully!", "success");
        onComplete(companyData);
        onClose();
      } else {
        showToast(
          data.message || "Failed to save company information",
          "error"
        );
      }
    } catch (error) {
      console.error("Company setup error:", error);
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-400"
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
              </div>
              <h3 className="text-xl font-semibold text-slate-100 mb-2">
                Company Basics
              </h3>
              <p className="text-slate-400">
                Let's start with your company's basic information
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Company Name *
              </label>
              <input
                type="text"
                value={companyData.companyName}
                onChange={(e) =>
                  handleInputChange("companyName", e.target.value)
                }
                className="input-field"
                placeholder="e.g., Acme Corporation"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Industry *
              </label>
              <select
                value={companyData.industry}
                onChange={(e) => handleInputChange("industry", e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select your industry</option>
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance & Banking</option>
                <option value="education">Education</option>
                <option value="retail">Retail & E-commerce</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="consulting">Consulting</option>
                <option value="media">Media & Entertainment</option>
                <option value="real-estate">Real Estate</option>
                <option value="automotive">Automotive</option>
                <option value="food-beverage">Food & Beverage</option>
                <option value="travel">Travel & Tourism</option>
                <option value="nonprofit">Non-profit</option>
                <option value="government">Government</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Founded Year
              </label>
              <input
                type="number"
                value={companyData.foundedYear}
                onChange={(e) =>
                  handleInputChange("foundedYear", e.target.value)
                }
                className="input-field"
                placeholder="e.g., 2020"
                min="1800"
                max={new Date().getFullYear()}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-400"
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
              </div>
              <h3 className="text-xl font-semibold text-slate-100 mb-2">
                Company Details
              </h3>
              <p className="text-slate-400">
                Tell us more about your company size and location
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Company Size *
              </label>
              <select
                value={companyData.companySize}
                onChange={(e) =>
                  handleInputChange("companySize", e.target.value)
                }
                className="input-field"
                required
              >
                <option value="">Select company size</option>
                <option value="1-10">1-10 employees (Startup)</option>
                <option value="11-50">11-50 employees (Small)</option>
                <option value="51-200">51-200 employees (Medium)</option>
                <option value="201-500">201-500 employees (Large)</option>
                <option value="501-1000">
                  501-1000 employees (Enterprise)
                </option>
                <option value="1000+">1000+ employees (Corporation)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Company Location *
              </label>
              <LocationAutocomplete
                value={companyData.companyLocation}
                onChange={(value) =>
                  handleInputChange("companyLocation", value)
                }
                placeholder="City, State, Country"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Company Website
              </label>
              <input
                type="url"
                value={companyData.companyWebsite}
                onChange={(e) =>
                  handleInputChange("companyWebsite", e.target.value)
                }
                className="input-field"
                placeholder="https://yourcompany.com"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-400"
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
              </div>
              <h3 className="text-xl font-semibold text-slate-100 mb-2">
                Company Description
              </h3>
              <p className="text-slate-400">
                Describe your company to attract the right candidates
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Company Description *
              </label>
              <textarea
                value={companyData.companyDescription}
                onChange={(e) =>
                  handleInputChange("companyDescription", e.target.value)
                }
                className="input-field resize-none"
                rows={6}
                placeholder="Describe your company's mission, values, culture, and what makes it a great place to work..."
                maxLength={1000}
                required
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-slate-400">
                  {companyData.companyDescription.length}/1000 characters
                </p>
                <p className="text-xs text-slate-400">
                  Minimum 50 characters required
                </p>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="text-blue-300 font-medium text-sm mb-1">
                    Pro Tip
                  </h4>
                  <p className="text-blue-200 text-sm">
                    A compelling company description helps attract quality
                    candidates. Include your mission, values, and what makes
                    your workplace unique.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 border border-dark-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl">
        {/* Header */}
        <div className="p-6 border-b border-dark-600">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">
                Complete Your Company Profile
              </h2>
              <p className="text-slate-400 mt-1">Step {currentStep} of 3</p>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step <= currentStep ? "bg-primary-500" : "bg-slate-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">{renderStep()}</div>

        {/* Footer */}
        <div className="p-6 border-t border-dark-600 flex justify-between">
          <button
            onClick={currentStep === 1 ? onClose : handleBack}
            className="btn-secondary px-6 py-2"
            disabled={isLoading}
          >
            {currentStep === 1 ? "Skip for Now" : "Back"}
          </button>

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="btn-primary px-6 py-2"
              disabled={!validateStep(currentStep)}
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="btn-primary px-6 py-2"
              disabled={isLoading || !validateStep(3)}
            >
              {isLoading ? "Saving..." : "Complete Setup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompanySetupModal;
