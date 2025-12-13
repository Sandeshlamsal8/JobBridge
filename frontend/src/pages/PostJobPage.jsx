import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import LocationAutocomplete from "../components/LocationAutocomplete";

function PostJobPage({ onNavigate }) {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    jobType: "full-time",
    workMode: "onsite",
    experienceLevel: "mid",
    category: "technology",
    skills: [],
    requirements: [],
    responsibilities: [],
    benefits: [],
    salary: {
      min: "",
      max: "",
      currency: "USD",
      period: "yearly",
    },
    applicationDeadline: "",
    applicationEmail: "",
    status: "active",
  });

  const [currentSkill, setCurrentSkill] = useState("");
  const [currentRequirement, setCurrentRequirement] = useState("");
  const [currentResponsibility, setCurrentResponsibility] = useState("");
  const [currentBenefit, setCurrentBenefit] = useState("");

  const jobTypes = [
    { value: "full-time", label: "Full-time" },
    { value: "part-time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
    { value: "freelance", label: "Freelance" },
  ];

  const workModes = [
    { value: "remote", label: "Remote" },
    { value: "onsite", label: "On-site" },
    { value: "hybrid", label: "Hybrid" },
  ];

  const experienceLevels = [
    { value: "entry", label: "Entry Level" },
    { value: "mid", label: "Mid Level" },
    { value: "senior", label: "Senior Level" },
    { value: "executive", label: "Executive" },
  ];

  const categories = [
    { value: "technology", label: "Technology" },
    { value: "marketing", label: "Marketing" },
    { value: "sales", label: "Sales" },
    { value: "design", label: "Design" },
    { value: "finance", label: "Finance" },
    { value: "hr", label: "Human Resources" },
    { value: "operations", label: "Operations" },
    { value: "customer-service", label: "Customer Service" },
    { value: "healthcare", label: "Healthcare" },
    { value: "education", label: "Education" },
    { value: "legal", label: "Legal" },
    { value: "other", label: "Other" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (error) setError(null);
  };

  const addToArray = (arrayName, value, setValue) => {
    if (value.trim()) {
      setFormData((prev) => ({
        ...prev,
        [arrayName]: [...prev[arrayName], value.trim()],
      }));
      setValue("");
    }
  };

  const removeFromArray = (arrayName, index) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("jobbridge_token")}`,
        },
        body: JSON.stringify({
          ...formData,
          salary: {
            ...formData.salary,
            min: formData.salary.min ? parseInt(formData.salary.min) : null,
            max: formData.salary.max ? parseInt(formData.salary.max) : null,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onNavigate("employer-dashboard");
        }, 2000);
      } else {
        setError(data.message || "Failed to post job");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onNavigate("home");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            Job Posted Successfully!
          </h2>
          <p className="text-slate-300">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8 animate-fade-in">
          <button
            onClick={() => onNavigate("employer-dashboard")}
            className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors mb-4"
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
            Post a New <span className="gradient-text">Job</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Find the perfect candidate for your team
          </p>
        </div>

        {error && (
          <div className="glass-card p-4 rounded-xl border-red-500/50 bg-red-500/10 mb-6 animate-scale-in">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-red-400 flex-shrink-0"
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
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up">
            <h2 className="text-2xl font-bold text-slate-100 mb-6">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-primary-400"
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
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input-field h-12 text-lg"
                  placeholder="e.g. Senior Frontend Developer"
                  required
                  disabled={isLoading}
                  minLength={5}
                  maxLength={100}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Be specific and include seniority level (5-100 characters)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-primary-400"
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
                  Location *
                </label>
                <LocationAutocomplete
                  value={formData.location}
                  onChange={handleChange}
                  required={true}
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Type to search cities worldwide or select remote options
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input-field h-12 cursor-pointer"
                  required
                  disabled={isLoading}
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Select the primary job category
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0h-8m8 0v2a2 2 0 01-2 2H8a2 2 0 01-2-2V8m8-2h2a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h2"
                    />
                  </svg>
                  Job Type *
                </label>
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="input-field h-12 cursor-pointer"
                  required
                  disabled={isLoading}
                >
                  {jobTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Full-time, Part-time, Contract, etc.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Work Mode *
                </label>
                <select
                  name="workMode"
                  value={formData.workMode}
                  onChange={handleChange}
                  className="input-field h-12 cursor-pointer"
                  required
                  disabled={isLoading}
                >
                  {workModes.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Remote, On-site, or Hybrid
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  Experience Level *
                </label>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                  className="input-field h-12 cursor-pointer"
                  required
                  disabled={isLoading}
                >
                  {experienceLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Required experience for this role
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Application Email
                </label>
                <input
                  type="email"
                  name="applicationEmail"
                  value={formData.applicationEmail}
                  onChange={handleChange}
                  className="input-field h-12"
                  placeholder="applications@company.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h7"
                  />
                </svg>
                Job Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={8}
                className="input-field text-lg resize-none"
                placeholder="Describe the role, what the candidate will be doing, and what makes this opportunity exciting..."
                required
                disabled={isLoading}
                minLength={50}
                maxLength={5000}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-slate-500">
                  Minimum 50 characters for better visibility
                </p>
                <p className="text-xs text-slate-500">
                  {formData.description.length}/5000
                </p>
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up">
            <h2 className="text-2xl font-bold text-slate-100 mb-6">
              Salary Information
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Minimum Salary
                </label>
                <input
                  type="number"
                  name="salary.min"
                  value={formData.salary.min}
                  onChange={handleChange}
                  className="input-field h-12"
                  placeholder="80000"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Maximum Salary
                </label>
                <input
                  type="number"
                  name="salary.max"
                  value={formData.salary.max}
                  onChange={handleChange}
                  className="input-field h-12"
                  placeholder="120000"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Period
                </label>
                <select
                  name="salary.period"
                  value={formData.salary.period}
                  onChange={handleChange}
                  className="input-field h-12"
                  disabled={isLoading}
                >
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up">
            <h2 className="text-2xl font-bold text-slate-100 mb-6">
              Required Skills
            </h2>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                className="input-field h-12 flex-1"
                placeholder="e.g. React, Node.js, Python"
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToArray("skills", currentSkill, setCurrentSkill);
                  }
                }}
              />
              <button
                type="button"
                onClick={() =>
                  addToArray("skills", currentSkill, setCurrentSkill)
                }
                className="btn-primary px-6"
                disabled={isLoading}
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-2 bg-primary-500/20 text-primary-400 rounded-full text-sm border border-primary-500/30 flex items-center gap-2"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeFromArray("skills", index)}
                    className="text-primary-400 hover:text-red-400 transition-colors"
                    disabled={isLoading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up">
            <h2 className="text-2xl font-bold text-slate-100 mb-6">
              Requirements
            </h2>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={currentRequirement}
                onChange={(e) => setCurrentRequirement(e.target.value)}
                className="input-field h-12 flex-1"
                placeholder="e.g. 3+ years of experience with React"
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToArray(
                      "requirements",
                      currentRequirement,
                      setCurrentRequirement
                    );
                  }
                }}
              />
              <button
                type="button"
                onClick={() =>
                  addToArray(
                    "requirements",
                    currentRequirement,
                    setCurrentRequirement
                  )
                }
                className="btn-primary px-6"
                disabled={isLoading}
              >
                Add
              </button>
            </div>

            <div className="space-y-2">
              {formData.requirements.map((req, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 glass-card rounded-xl"
                >
                  <span className="flex-1 text-slate-300">{req}</span>
                  <button
                    type="button"
                    onClick={() => removeFromArray("requirements", index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    disabled={isLoading}
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Responsibilities */}
          <div className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up">
            <h2 className="text-2xl font-bold text-slate-100 mb-6">
              Responsibilities
            </h2>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={currentResponsibility}
                onChange={(e) => setCurrentResponsibility(e.target.value)}
                className="input-field h-12 flex-1"
                placeholder="e.g. Lead frontend development initiatives"
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToArray(
                      "responsibilities",
                      currentResponsibility,
                      setCurrentResponsibility
                    );
                  }
                }}
              />
              <button
                type="button"
                onClick={() =>
                  addToArray(
                    "responsibilities",
                    currentResponsibility,
                    setCurrentResponsibility
                  )
                }
                className="btn-primary px-6"
                disabled={isLoading}
              >
                Add
              </button>
            </div>

            <div className="space-y-2">
              {formData.responsibilities.map((resp, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 glass-card rounded-xl"
                >
                  <span className="flex-1 text-slate-300">{resp}</span>
                  <button
                    type="button"
                    onClick={() => removeFromArray("responsibilities", index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    disabled={isLoading}
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up">
            <h2 className="text-2xl font-bold text-slate-100 mb-6">
              Benefits & Perks
            </h2>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={currentBenefit}
                onChange={(e) => setCurrentBenefit(e.target.value)}
                className="input-field h-12 flex-1"
                placeholder="e.g. Health insurance, 401k matching, Remote work"
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addToArray("benefits", currentBenefit, setCurrentBenefit);
                  }
                }}
              />
              <button
                type="button"
                onClick={() =>
                  addToArray("benefits", currentBenefit, setCurrentBenefit)
                }
                className="btn-primary px-6"
                disabled={isLoading}
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.benefits.map((benefit, index) => (
                <span
                  key={index}
                  className="px-3 py-2 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30 flex items-center gap-2"
                >
                  {benefit}
                  <button
                    type="button"
                    onClick={() => removeFromArray("benefits", index)}
                    className="text-green-400 hover:text-red-400 transition-colors"
                    disabled={isLoading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="glass-card p-6 rounded-3xl animate-slide-up">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-green-400"
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
                  All required fields completed
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate("employer-dashboard")}
                  className="btn-secondary px-6 py-3 font-semibold"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log("Saving as draft...");
                    // TODO: Implement draft saving functionality
                  }}
                  disabled={isLoading}
                  className="btn-secondary px-6 py-3 font-semibold disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary px-8 py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
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
                      Posting Job...
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
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Post Job
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Footer user={user} />
    </div>
  );
}

export default PostJobPage;
