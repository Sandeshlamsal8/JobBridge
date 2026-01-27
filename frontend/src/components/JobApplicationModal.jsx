import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "./ToastContainer";

function JobApplicationModal({ job, isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    coverLetter: "",
    expectedSalary: {
      amount: "",
      period: "yearly",
    },
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("expectedSalary.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        expectedSalary: {
          ...prev.expectedSalary,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          resume: "Please upload a PDF or Word document",
        }));
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          resume: "File size must be less than 5MB",
        }));
        return;
      }
      setResumeFile(file);
      setErrors((prev) => ({ ...prev, resume: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!resumeFile) {
      newErrors.resume = "Resume is required";
    }

    if (formData.coverLetter.length > 2000) {
      newErrors.coverLetter = "Cover letter cannot exceed 2000 characters";
    }

    if (
      formData.expectedSalary.amount &&
      isNaN(formData.expectedSalary.amount)
    ) {
      newErrors.expectedSalary = "Expected salary must be a valid number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append("jobId", job._id);
      submitData.append("cv", resumeFile);

      if (formData.coverLetter.trim()) {
        submitData.append("coverLetter", formData.coverLetter.trim());
      }

      if (formData.expectedSalary.amount) {
        submitData.append(
          "expectedSalary[amount]",
          formData.expectedSalary.amount,
        );
        submitData.append(
          "expectedSalary[period]",
          formData.expectedSalary.period,
        );
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/applications`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("jobbridge_token")}`,
          },
          body: submitData,
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        showToast("Application submitted successfully! 🎉", "success");
        onSuccess?.();
        onClose();
        // Reset form
        setFormData({
          coverLetter: "",
          expectedSalary: { amount: "", period: "yearly" },
        });
        setResumeFile(null);
      } else {
        const errorMessage = data.message || "Failed to submit application";
        setErrors({ submit: errorMessage });
        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Application submission error:", error);
      const errorMessage = "Network error. Please try again.";
      setErrors({ submit: errorMessage });
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2">
                Apply for Position
              </h2>
              <div className="text-slate-300">
                <h3 className="font-semibold text-lg">{job?.title}</h3>
                <p className="text-primary-400">{job?.companyName}</p>
                <p className="text-sm text-slate-400">{job?.location}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resume Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Resume/CV <span className="text-red-400">*</span>
              </label>
              <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-slate-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    {resumeFile ? (
                      <div className="text-primary-400">
                        <p className="font-medium">{resumeFile.name}</p>
                        <p className="text-sm text-slate-400">
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-slate-300 font-medium mb-1">
                          Click to upload your resume
                        </p>
                        <p className="text-sm text-slate-400">
                          PDF, DOC, or DOCX (max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
              {errors.resume && (
                <p className="text-red-400 text-sm mt-2">{errors.resume}</p>
              )}
            </div>

            {/* Cover Letter */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Cover Letter
                <span className="text-slate-400 font-normal ml-2">
                  (Optional)
                </span>
              </label>
              <textarea
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleInputChange}
                rows={6}
                className="input-field resize-none"
                placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                maxLength={2000}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-slate-400">
                  {formData.coverLetter.length}/2000 characters
                </div>
                {errors.coverLetter && (
                  <p className="text-red-400 text-sm">{errors.coverLetter}</p>
                )}
              </div>
            </div>

            {/* Expected Salary */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Expected Salary
                <span className="text-slate-400 font-normal ml-2">
                  (Optional)
                </span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    name="expectedSalary.amount"
                    value={formData.expectedSalary.amount}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Amount"
                    min="0"
                  />
                </div>
                <div>
                  <select
                    name="expectedSalary.period"
                    value={formData.expectedSalary.period}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="hourly">Per Hour</option>
                    <option value="monthly">Per Month</option>
                    <option value="yearly">Per Year</option>
                  </select>
                </div>
              </div>
              {errors.expectedSalary && (
                <p className="text-red-400 text-sm mt-2">
                  {errors.expectedSalary}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
                <p className="text-red-300">{errors.submit}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 btn-primary py-3"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Submitting...
                  </div>
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default JobApplicationModal;
