import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import Header from "../components/layout/Header"
import Footer from "../components/layout/Footer"

function JobSeekerDashboard({ onNavigate }) {
    const { user, logout } = useAuth()
    const [stats] = useState({
        appliedJobs: 12,
        savedJobs: 8,
        profileViews: 45,
        interviewsScheduled: 3
    })

    const [recentApplications] = useState([
        {
            id: 1,
            jobTitle: "Senior Frontend Developer",
            company: "TechCorp Inc.",
            appliedDate: "2 days ago",
            status: "Under Review",
            salary: "$120k - $150k",
            location: "San Francisco, CA"
        },
        {
            id: 2,
            jobTitle: "Product Manager",
            company: "StartupXYZ",
            appliedDate: "1 week ago",
            status: "Interview Scheduled",
            salary: "$100k - $130k",
            location: "Remote"
        },
        {
            id: 3,
            jobTitle: "UX Designer",
            company: "Design Studio",
            appliedDate: "2 weeks ago",
            status: "Rejected",
            salary: "$80k - $100k",
            location: "New York, NY"
        }
    ])

    const [recommendedJobs] = useState([
        {
            id: 1,
            title: "Full Stack Developer",
            company: "InnovateTech",
            location: "Remote",
            salary: "$110k - $140k",
            match: "95%",
            posted: "1 day ago"
        },
        {
            id: 2,
            title: "React Developer",
            company: "WebSolutions",
            location: "Austin, TX",
            salary: "$90k - $120k",
            match: "88%",
            posted: "3 days ago"
        }
    ])

    const getStatusColor = (status) => {
        switch (status) {
            case "Under Review":
                return "text-yellow-400 bg-yellow-400/20 border-yellow-400/30"
            case "Interview Scheduled":
                return "text-green-400 bg-green-400/20 border-green-400/30"
            case "Rejected":
                return "text-red-400 bg-red-400/20 border-red-400/30"
            case "Accepted":
                return "text-blue-400 bg-blue-400/20 border-blue-400/30"
            default:
                return "text-slate-400 bg-slate-400/20 border-slate-400/30"
        }
    }

    const handleLogout = async () => {
        await logout()
        onNavigate("home")
    }

    return (
        <div className="min-h-screen bg-dark-950 text-slate-100">
            <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Welcome Header */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-2">
                        Welcome back, <span className="gradient-text">{user?.firstName}</span>! 👋
                    </h1>
                    <p className="text-slate-300 text-lg">Here's what's happening with your job search</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="glass-card p-6 rounded-2xl animate-scale-in">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm font-medium">Applied Jobs</p>
                                <p className="text-3xl font-bold text-slate-100 mt-1">{stats.appliedJobs}</p>
                            </div>
                            <div className="p-3 bg-primary-500/20 rounded-xl">
                                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl animate-scale-in" style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm font-medium">Saved Jobs</p>
                                <p className="text-3xl font-bold text-slate-100 mt-1">{stats.savedJobs}</p>
                            </div>
                            <div className="p-3 bg-green-500/20 rounded-xl">
                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl animate-scale-in" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm font-medium">Profile Views</p>
                                <p className="text-3xl font-bold text-slate-100 mt-1">{stats.profileViews}</p>
                                <p className="text-green-400 text-sm font-medium">+12 this week</p>
                            </div>
                            <div className="p-3 bg-blue-500/20 rounded-xl">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl animate-scale-in" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm font-medium">Interviews</p>
                                <p className="text-3xl font-bold text-slate-100 mt-1">{stats.interviewsScheduled}</p>
                                <p className="text-blue-400 text-sm font-medium">2 this week</p>
                            </div>
                            <div className="p-3 bg-purple-500/20 rounded-xl">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Applications */}
                    <div className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-100">Recent Applications</h2>
                            <button className="text-primary-400 hover:text-primary-300 transition-colors text-sm font-semibold">
                                View All
                            </button>
                        </div>
                        <div className="space-y-4">
                            {recentApplications.map((application) => (
                                <div key={application.id} className="glass-card-hover p-4 rounded-xl transition-all duration-300">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-slate-100 mb-1">{application.jobTitle}</h3>
                                            <p className="text-primary-400 text-sm font-medium">{application.company}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                                            {application.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-slate-400">
                                        <div className="flex gap-4">
                                            <span>{application.salary}</span>
                                            <span>{application.location}</span>
                                        </div>
                                        <span>{application.appliedDate}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recommended Jobs */}
                    <div className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-100">Recommended for You</h2>
                            <button className="text-primary-400 hover:text-primary-300 transition-colors text-sm font-semibold">
                                View All
                            </button>
                        </div>
                        <div className="space-y-4">
                            {recommendedJobs.map((job) => (
                                <div key={job.id} className="glass-card-hover p-4 rounded-xl transition-all duration-300">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-slate-100 mb-1">{job.title}</h3>
                                            <p className="text-primary-400 text-sm font-medium">{job.company}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium border border-green-500/30">
                                            {job.match} match
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-slate-400 mb-3">
                                        <div className="flex gap-4">
                                            <span>{job.salary}</span>
                                            <span>{job.location}</span>
                                        </div>
                                        <span>{job.posted}</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="btn-secondary text-sm px-4 py-2 flex-1">
                                            Save Job
                                        </button>
                                        <button className="btn-primary text-sm px-4 py-2 flex-1">
                                            Apply Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 glass-card p-6 lg:p-8 rounded-3xl animate-fade-in">
                    <h2 className="text-2xl font-bold text-slate-100 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button className="glass-card-hover p-6 rounded-xl text-left transition-all duration-300 hover:scale-105">
                            <div className="p-3 bg-primary-500/20 rounded-xl mb-4 w-fit">
                                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-slate-100 mb-2">Browse Jobs</h3>
                            <p className="text-slate-400 text-sm">Find new opportunities</p>
                        </button>

                        <button className="glass-card-hover p-6 rounded-xl text-left transition-all duration-300 hover:scale-105">
                            <div className="p-3 bg-green-500/20 rounded-xl mb-4 w-fit">
                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-slate-100 mb-2">Update Profile</h3>
                            <p className="text-slate-400 text-sm">Keep your profile current</p>
                        </button>

                        <button className="glass-card-hover p-6 rounded-xl text-left transition-all duration-300 hover:scale-105">
                            <div className="p-3 bg-blue-500/20 rounded-xl mb-4 w-fit">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-slate-100 mb-2">Upload Resume</h3>
                            <p className="text-slate-400 text-sm">Update your resume</p>
                        </button>

                        <button className="glass-card-hover p-6 rounded-xl text-left transition-all duration-300 hover:scale-105">
                            <div className="p-3 bg-purple-500/20 rounded-xl mb-4 w-fit">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-slate-100 mb-2">View Analytics</h3>
                            <p className="text-slate-400 text-sm">Track your progress</p>
                        </button>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}

export default JobSeekerDashboard