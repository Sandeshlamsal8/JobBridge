import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import JobSeekerDashboard from "./pages/JobSeekerDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import PostJobPage from "./pages/PostJobPage";
import JobListingsPage from "./pages/JobListingsPage";
import MyJobsPage from "./pages/MyJobsPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import AccountSettings from "./pages/AccountSettings";
import CompanyVerificationPage from "./pages/CompanyVerificationPage";
import CandidateProfilePage from "./pages/CandidateProfilePage";
import ApplicationReviewPage from "./pages/ApplicationReviewPage";
import JobDetailsPage from "./pages/JobDetailsPage";

function AppContent() {
  const { user, isAuthenticated, isLoading, verifyEmail } = useAuth();
  const [currentPage, setCurrentPage] = useState("home");
  const [pageData, setPageData] = useState(null);

  // Check for reset password token in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setCurrentPage('reset-password');
      setPageData({ token });
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Navigation handler with data
  const handleNavigate = (page, data = null) => {
    setCurrentPage(page);
    setPageData(data);
  };

  // Handle verification success - redirect to login page
  const handleVerificationSuccess = async (data) => {
    // Account created successfully, redirect to login page
    setCurrentPage("login");
  };

  // Redirect to appropriate dashboard after login
  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      (currentPage === "login" || currentPage === "signup")
    ) {
      if (user.userType === "jobseeker") {
        setCurrentPage("jobseeker-dashboard");
      } else if (user.userType === "employer") {
        setCurrentPage("employer-dashboard");
      }
    }
  }, [isAuthenticated, user, currentPage]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading JobBridge...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <LoginPage onNavigate={handleNavigate} />;
      case "signup":
        return <SignUpPage onNavigate={handleNavigate} />;
      case "verify-email":
        return (
          <EmailVerificationPage
            email={pageData?.email}
            onNavigate={handleNavigate}
            onVerificationSuccess={handleVerificationSuccess}
          />
        );
      case "forgot-password":
        return <ForgotPasswordPage onNavigate={handleNavigate} />;
      case "reset-password":
        return (
          <ResetPasswordPage 
            onNavigate={handleNavigate} 
            token={pageData?.token}
          />
        );
      case "job-listings":
        return <JobListingsPage onNavigate={handleNavigate} />;
      // Employer Routes
      case "post-job":
        return isAuthenticated && user?.userType === "employer" ? (
          <PostJobPage onNavigate={handleNavigate} />
        ) : (
          <HomePage onNavigate={handleNavigate} />
        );
      case "employer-dashboard":
        return isAuthenticated && user?.userType === "employer" ? (
          <EmployerDashboard onNavigate={handleNavigate} />
        ) : (
          <HomePage onNavigate={handleNavigate} />
        );
      case "my-jobs":
        return isAuthenticated && user?.userType === "employer" ? (
          <MyJobsPage onNavigate={handleNavigate} />
        ) : (
          <HomePage onNavigate={handleNavigate} />
        );
      case "applications":
        return isAuthenticated && user?.userType === "employer" ? (
          <ApplicationsPage onNavigate={handleNavigate} />
        ) : (
          <HomePage onNavigate={handleNavigate} />
        );
      case "company-verification":
        return isAuthenticated && user?.userType === "employer" ? (
          <CompanyVerificationPage onNavigate={handleNavigate} />
        ) : (
          <HomePage onNavigate={handleNavigate} />
        );

      // Job Seeker Routes
      case "jobseeker-dashboard":
        return isAuthenticated && user?.userType === "jobseeker" ? (
          <JobSeekerDashboard onNavigate={handleNavigate} />
        ) : (
          <HomePage onNavigate={handleNavigate} />
        );
      case "my-applications":
        return isAuthenticated && user?.userType === "jobseeker" ? (
          <MyApplicationsPage onNavigate={handleNavigate} />
        ) : (
          <HomePage onNavigate={handleNavigate} />
        );

      // Common Routes
      case "profile-settings":
        return isAuthenticated ? (
          <ProfileSettingsPage onNavigate={handleNavigate} />
        ) : (
          <HomePage onNavigate={handleNavigate} />
        );
      case "account-settings":
        return isAuthenticated ? (
          <AccountSettings onNavigate={handleNavigate} />
        ) : (
          <HomePage onNavigate={handleNavigate} />
        );

      // Dynamic Routes - Candidate Profile
      default:
        if (currentPage.startsWith("candidate-profile/")) {
          const candidateId = currentPage.split("/")[1];
          return isAuthenticated && user?.userType === "employer" ? (
            <CandidateProfilePage
              onNavigate={handleNavigate}
              candidateId={candidateId}
            />
          ) : (
            <HomePage onNavigate={handleNavigate} />
          );
        }

        // Dynamic Routes - Application Review
        if (currentPage.startsWith("application-review/")) {
          const applicationId = currentPage.split("/")[1];
          return isAuthenticated && user?.userType === "employer" ? (
            <ApplicationReviewPage
              onNavigate={handleNavigate}
              applicationId={applicationId}
            />
          ) : (
            <HomePage onNavigate={handleNavigate} />
          );
        }

        // Dynamic Routes - Job Details
        if (currentPage.startsWith("job-details/")) {
          const jobId = currentPage.split("/")[1];
          return (
            <JobDetailsPage
              onNavigate={handleNavigate}
              jobId={jobId}
            />
          );
        }
        // If user is authenticated, redirect to their dashboard
        if (isAuthenticated && user) {
          if (user.userType === "jobseeker") {
            setCurrentPage("jobseeker-dashboard");
            return <JobSeekerDashboard onNavigate={handleNavigate} />;
          } else if (user.userType === "employer") {
            setCurrentPage("employer-dashboard");
            return <EmployerDashboard onNavigate={handleNavigate} />;
          }
        }
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return renderPage();
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
