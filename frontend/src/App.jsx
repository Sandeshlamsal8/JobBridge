import { useState, useEffect } from "react"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import JobSeekerDashboard from "./pages/JobSeekerDashboard"
import EmployerDashboard from "./pages/EmployerDashboard"
import PostJobPage from "./pages/PostJobPage"
import JobListingsPage from "./pages/JobListingsPage"

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [currentPage, setCurrentPage] = useState("home")

  // Redirect to appropriate dashboard after login
  useEffect(() => {
    if (isAuthenticated && user && (currentPage === "login" || currentPage === "signup")) {
      if (user.userType === "jobseeker") {
        setCurrentPage("jobseeker-dashboard")
      } else if (user.userType === "employer") {
        setCurrentPage("employer-dashboard")
      }
    }
  }, [isAuthenticated, user, currentPage])

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Loading JobBridge...</p>
        </div>
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <LoginPage onNavigate={setCurrentPage} />
      case "signup":
        return <SignUpPage onNavigate={setCurrentPage} />
      case "job-listings":
        return <JobListingsPage onNavigate={setCurrentPage} />
      case "post-job":
        return isAuthenticated && user?.userType === "employer" ?
          <PostJobPage onNavigate={setCurrentPage} /> :
          <HomePage onNavigate={setCurrentPage} />
      case "jobseeker-dashboard":
        return isAuthenticated && user?.userType === "jobseeker" ?
          <JobSeekerDashboard onNavigate={setCurrentPage} /> :
          <HomePage onNavigate={setCurrentPage} />
      case "employer-dashboard":
        return isAuthenticated && user?.userType === "employer" ?
          <EmployerDashboard onNavigate={setCurrentPage} /> :
          <HomePage onNavigate={setCurrentPage} />
      default:
        // If user is authenticated, redirect to their dashboard
        if (isAuthenticated && user) {
          if (user.userType === "jobseeker") {
            setCurrentPage("jobseeker-dashboard")
            return <JobSeekerDashboard onNavigate={setCurrentPage} />
          } else if (user.userType === "employer") {
            setCurrentPage("employer-dashboard")
            return <EmployerDashboard onNavigate={setCurrentPage} />
          }
        }
        return <HomePage onNavigate={setCurrentPage} />
    }
  }

  return renderPage()
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
