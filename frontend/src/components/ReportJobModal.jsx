import { useState } from "react";
import { showToast } from "./ToastContainer";

const ReportJobModal = ({ isOpen, onClose, jobId, jobTitle }) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    { value: "spam", label: "Spam or Fake Job" },
    { value: "misleading", label: "Misleading Information" },
    { value: "inappropriate", label: "Inappropriate Content" },
    { value: "scam", label: "Potential Scam" },
    { value: "duplicate", label: "Duplicate Posting" },
    { value: "discrimination", label: "Discriminatory Content" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason || !description.trim()) {
      showToast("Please select a reason and provide details", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/job-reports`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            jobId,
            reason,
            description,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        showToast(data.message, "success");
        onClose();
        setReason("");
        setDescription("");
      } else {
        showToast(data.message || "Failed to submit report", "error");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      showToast("Failed to submit report", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-700 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-dark-800 border-b border-dark-700 px-4 py-3 flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-3">
            <h3 className="text-base font-bold text-slate-100">Report Job</h3>
            <p className="text-xs text-slate-400 truncate">{jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Reason <span className="text-red-400">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm bg-dark-900/50 border border-dark-700/50 rounded text-slate-200 focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Select a reason</option>
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Details <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details..."
              rows={3}
              maxLength={500}
              className="w-full px-2.5 py-1.5 text-sm bg-dark-900/50 border border-dark-700/50 rounded text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-primary-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-slate-500 mt-0.5">
              {description.length}/500
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
            <p className="text-xs text-yellow-400">
              ⚠️ False reports may result in restrictions.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm bg-dark-700/50 text-slate-300 rounded hover:bg-dark-700 transition-all"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportJobModal;
