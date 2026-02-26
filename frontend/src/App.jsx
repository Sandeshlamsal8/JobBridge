import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ToastContainer from "./components/ToastContainer";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import JobSeekerDashboard from "./pages/JobSeekerDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import PostJobPage from "./pages/PostJobPage";
import EditJobPage from "./pages/EditJobPage";
import JobListingsPage from "./pages/JobListingsPage";
import MyJobsPage from "./pages/MyJobsPage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import SavedJobsPage from "./pages/SavedJobsPage";
import ProfileSettings from "./pages/ProfileSettings";
import AccountSettings from "./pages/AccountSettings";
import ContactPage from "./pages/ContactPage";
import CandidateProfilePage from "./pages/CandidateProfilePage";
import CompanyProfilePage from "./pages/CompanyProfilePage";
import ApplicationReviewPage from "./pages/ApplicationReviewPage";
import CandidateRankingPage from "./pages/CandidateRankingPage";
import JobDetailsPage from "./pages/JobDetailsPage";
import MessageCenterPage from "./pages/MessageCenterPage";

// Protected Route Component for Employers
function EmployerRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.userType !== "employer") {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Protected Route Component for Job Seekers
function JobSeekerRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.userType !== "jobseeker") {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Protected Route Component for Any Authenticated User
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Redirect authenticated users away from auth pages
function GuestRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    // Redirect to appropriate dashboard
    if (user.userType === "employer") {
      return <Navigate to="/employer/dashboard" replace />;
    } else if (user.userType === "jobseeker") {
      return <Navigate to="/jobseeker/dashboard" replace />;
    }
  }

  return children;
}

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

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

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestRoute>
            <SignUpPage />
          </GuestRoute>
        }
      />
      <Route path="/verify-email" element={<EmailVerificationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/job-listings" element={<JobListingsPage />} />
      <Route path="/job-details/:jobId" element={<JobDetailsPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Employer Routes */}
      <Route
        path="/employer/dashboard"
        element={
          <EmployerRoute>
            <EmployerDashboard />
          </EmployerRoute>
        }
      />
      <Route
        path="/employer/post-job"
        element={
          <EmployerRoute>
            <PostJobPage />
          </EmployerRoute>
        }
      />
      <Route
        path="/employer/my-jobs"
        element={
          <EmployerRoute>
            <MyJobsPage />
          </EmployerRoute>
        }
      />
      <Route
        path="/employer/applications"
        element={
          <EmployerRoute>
            <ApplicationsPage />
          </EmployerRoute>
        }
      />
      <Route
        path="/employer/edit-job/:jobId"
        element={
          <EmployerRoute>
            <EditJobPage />
          </EmployerRoute>
        }
      />
      <Route
        path="/employer/candidate-profile/:candidateId"
        element={
          <EmployerRoute>
            <CandidateProfilePage />
          </EmployerRoute>
        }
      />
      <Route
        path="/employer/application-review/:applicationId"
        element={
          <EmployerRoute>
            <ApplicationReviewPage />
          </EmployerRoute>
        }
      />
      <Route
        path="/employer/candidate-ranking/:jobId"
        element={
          <EmployerRoute>
            <CandidateRankingPage />
          </EmployerRoute>
        }
      />

      {/* Job Seeker Routes */}
      <Route
        path="/jobseeker/dashboard"
        element={
          <JobSeekerRoute>
            <JobSeekerDashboard />
          </JobSeekerRoute>
        }
      />
      <Route
        path="/jobseeker/my-applications"
        element={
          <JobSeekerRoute>
            <MyApplicationsPage />
          </JobSeekerRoute>
        }
      />
      <Route
        path="/jobseeker/saved-jobs"
        element={
          <JobSeekerRoute>
            <SavedJobsPage />
          </JobSeekerRoute>
        }
      />
      <Route
        path="/jobseeker/company-profile/:companyId"
        element={
          <JobSeekerRoute>
            <CompanyProfilePage />
          </JobSeekerRoute>
        }
      />

      {/* Common Protected Routes */}
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <MessageCenterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages/:conversationId"
        element={
          <ProtectedRoute>
            <MessageCenterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile-settings"
        element={
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account-settings"
        element={
          <ProtectedRoute>
            <AccountSettings />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <ToastContainer />
    </AuthProvider>
  );
}

export default App;
