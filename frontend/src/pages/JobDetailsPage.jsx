import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";

function JobDetailsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [expectedSalary, setExpectedSalary] = useState({
    amount: "",
    period: "yearly",
  });
  const [isSaved, setIsSaved] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchJobDetails();
    if (user) {
      checkIfSaved();
    }
  }, [jobId, user]);

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/jobs/${jobId}`,
      );
      const data = await response.json();

      if (data.success) {
        setJob(data.data);
      } else {
        setError(data.message || "Failed to load job details");
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      setError("Failed to load job details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/saved-jobs/check/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        setIsSaved(data.data.isSaved);
      }
    } catch (error) {
      console.error("Error checking saved status:", error);
    }
  };

  const handleSaveJob = async () => {
    if (!user) {
      showToast("Please login to save jobs", "error");
      return;
    }

    try {
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/saved-jobs/${jobId}`,
        {
          method: isSaved ? "DELETE" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setIsSaved(!isSaved);
        showToast(
          isSaved ? "Job removed from saved jobs" : "Job saved successfully",
          "success",
        );
      }
    } catch (error) {
      console.error("Error saving job:", error);
      showToast("Failed to save job. Please try again.", "error");
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();

    if (!user) {
      showToast("Please login to apply for jobs", "error");
      return;
    }

    if (!cvFile) {
      showToast("Please upload your CV", "error");
      return;
    }

    try {
      setIsApplying(true);
      const token = sessionStorage.getItem("jobbridge_token");

      const formData = new FormData();
      formData.append("cv", cvFile);
      formData.append("coverLetter", coverLetter);
      if (expectedSalary.amount) {
        formData.append("expectedSalary", expectedSalary.amount);
        formData.append("salaryPeriod", expectedSalary.period);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/applications/${jobId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (data.success) {
        showToast("Application submitted successfully!", "success");
        // Reset form
        setCvFile(null);
        setCoverLetter("");
        setExpectedSalary({ amount: "", period: "yearly" });
        // Refresh job details to update application status
        fetchJobDetails();
      } else {
        showToast(data.message || "Failed to submit application", "error");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      showToast("Failed to submit application. Please try again.", "error");
    } finally {
      setIsApplying(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-dark-950 text-slate-100">
        <Header user={user} onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              {error || "Job not found"}
            </h2>
            <button
              onClick={() => navigate("/job-listings")}
              className="btn-primary px-6 py-3"
            >
              Browse Jobs
            </button>
          </div>
        </div>
        <Footer user={user} />
      </div>
    );
  }

  const hasApplied = job.applications?.some(
    (app) => app.applicant === user?._id,
  );

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Header user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors mb-6"
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

        {/* Rest of the component remains the same... */}
        {/* Job details, application form, etc. */}
      </div>

      <Footer user={user} />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
}

export default JobDetailsPage;
