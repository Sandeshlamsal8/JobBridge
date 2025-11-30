import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
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

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState("home");

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
        return <LoginPage onNavigate={setCurrentPage} />;
      case "signup":
        return <SignUpPage onNavigate={setCurrentPage} />;
      case "job-listings":
        return <JobListingsPage onNavigate={setCurrentPage} />;
      // Employer Routes
      case "post-job":
        return isAuthenticated && user?.userType === "employer" ? (
          <PostJobPage onNavigate={setCurrentPage} />
        ) : (
          <HomePage onNavigate={setCurrentPage} />
        );
      case "employer-dashboard":
        return isAuthenticated && user?.userType === "employer" ? (
          <EmployerDashboard onNavigate={setCurrentPage} />
        ) : (
          <HomePage onNavigate={setCurrentPage} />
        );
      case "my-jobs":
        return isAuthenticated && user?.userType === "employer" ? (
          <MyJobsPage onNavigate={setCurrentPage} />
        ) : (
          <HomePage onNavigate={setCurrentPage} />
        );
      case "applications":
        return isAuthenticated && user?.userType === "employer" ? (
          <ApplicationsPage onNavigate={setCurrentPage} />
        ) : (
          <HomePage onNavigate={setCurrentPage} />
        );
      case "company-verification":
        return isAuthenticated && user?.userType === "employer" ? (
          <CompanyVerificationPage onNavigate={setCurrentPage} />
        ) : (
          <HomePage onNavigate={setCurrentPage} />
        );

      // Job Seeker Routes
      case "jobseeker-dashboard":
        return isAuthenticated && user?.userType === "jobseeker" ? (
          <JobSeekerDashboard onNavigate={setCurrentPage} />
        ) : (
          <HomePage onNavigate={setCurrentPage} />
        );
      case "my-applications":
        return isAuthenticated && user?.userType === "jobseeker" ? (
          <MyApplicationsPage onNavigate={setCurrentPage} />
        ) : (
          <HomePage onNavigate={setCurrentPage} />
        );

      // Common Routes
      case "profile-settings":
        return isAuthenticated ? (
          <ProfileSettingsPage onNavigate={setCurrentPage} />
        ) : (
          <HomePage onNavigate={setCurrentPage} />
        );
      case "account-settings":
        return isAuthenticated ? (
          <AccountSettings onNavigate={setCurrentPage} />
        ) : (
          <HomePage onNavigate={setCurrentPage} />
        );

      // Dynamic Routes - Candidate Profile
      default:
        if (currentPage.startsWith("candidate-profile/")) {
          const candidateId = currentPage.split("/")[1];
          return isAuthenticated && user?.userType === "employer" ? (
            <CandidateProfilePage
              onNavigate={setCurrentPage}
              candidateId={candidateId}
            />
          ) : (
            <HomePage onNavigate={setCurrentPage} />
          );
        }

        // Dynamic Routes - Application Review
        if (currentPage.startsWith("application-review/")) {
          const applicationId = currentPage.split("/")[1];
          return isAuthenticated && user?.userType === "employer" ? (
            <ApplicationReviewPage
              onNavigate={setCurrentPage}
              applicationId={applicationId}
            />
          ) : (
            <HomePage onNavigate={setCurrentPage} />
          );
        }
        // If user is authenticated, redirect to their dashboard
        if (isAuthenticated && user) {
          if (user.userType === "jobseeker") {
            setCurrentPage("jobseeker-dashboard");
            return <JobSeekerDashboard onNavigate={setCurrentPage} />;
          } else if (user.userType === "employer") {
            setCurrentPage("employer-dashboard");
            return <EmployerDashboard onNavigate={setCurrentPage} />;
          }
        }
        return <HomePage onNavigate={setCurrentPage} />;
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
