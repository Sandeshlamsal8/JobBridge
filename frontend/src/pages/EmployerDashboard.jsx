import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import Header from "../components/layout/Header"
import Footer from "../components/layout/Footer"

function EmployerDashboard({ onNavigate }) {
    const { user, logout } = useAuth()
    const [stats] = useState({
        activeJobs: 8,
        totalApplications: 156,
        newApplications: 23,
        scheduledInterviews: 12
    })

    const [recentJobs] = useState([
        {
            id: 1,
            title: "Senior Frontend Developer",
            applications: 45,
            views: 234,
            posted: "2 days ago",
            status: "Active",
            location: "San Francisco, CA"
        },
        {
            id: 2,
            title: "Product Manager",
            applications: 32,
            views: 189,
            posted: "1 week ago",
            status: "Active",
            location: "Remote"
        },
        {
            id: 3,
            title: "UX Designer",
            applications: 28,
            views: 156,
            posted: "2 weeks ago",
            status: "Paused",
            location: "New York, NY"
        }
    ])

    const [recentApplications] = useState([
        {
            id: 1,
            candidateName: "John Smith",
            jobTitle: "Senior Frontend Developer",
            appliedDate: "2 hours ago",
            status: "New",
            experience: "5+ years",
            avatar: "https://via.placeholder.com/40x40?text=JS"
        },
        {
            id: 2,
            candidateName: "Sarah Johnson",
            jobTitle: "Product Manager",
            appliedDate: "5 hours ago",
            status: "Reviewed",
            experience: "4+ years",
            avatar: "https://via.placeholder.com/40x40?text=SJ"
        },
        {
            id: 3,
            candidateName: "Mike Chen",
            jobTitle: "UX Designer",
            appliedDate: "1 day ago",
            status: "Interview",
            experience: "3+ years",
            avatar: "https://via.placeholder.com/40x40?text=MC"
        }
    ])

    const getStatusColor = (status) => {
        switch (status) {
            case "Active":
                return "text-green-400 bg-green-400/20 border-green-400/30"
            case "Paused":
                return "text-yellow-400 bg-yellow-400/20 border-yellow-400/30"
            case "New":
                return "text-blue-400 bg-blue-400/20 border-blue-400/30"
            case "Reviewed":
                return "text-purple-400 bg-purple-400/20 border-purple-400/30"
            case "Interview":
                return "text-green-400 bg-green-400/20 border-green-400/30"
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
                        Welcome back, <span className="gradient-text">{user?.firstName}</span>! 🏢
                    </h1>
                    <p className="text-slate-300 text-lg">Manage your job postings and track applications</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="glass-card p-6 rounded-2xl animate-scale-in">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm font-medium">Active Jobs</p>
                                <p className="text-3xl font-bold text-slate-100 mt-1">{stats.activeJobs}</p>
                            </div>
                            <div className="p-3 bg-primary-500/20 rounded-xl">
                                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl animate-scale-in" style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm font-medium">Total Applications</p>
                                <p className="text-3xl font-bold text-slate-100 mt-1">{stats.totalApplications}</p>
                            </div>
                            <div className="p-3 bg-blue-500/20 rounded-xl">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl animate-scale-in" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm font-medium">New Applications</p>
                                <p className="text-3xl font-bold text-slate-100 mt-1">{stats.newApplications}</p>
                                <p className="text-green-400 text-sm font-medium">+8 today</p>
                            </div>
                            <div className="p-3 bg-green-500/20 rounded-xl">
                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl animate-scale-in" style={{ animationDelay: '0.3s' }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm font-medium">Interviews</p>
                                <p className="text-3xl font-bold text-slate-100 mt-1">{stats.scheduledInterviews}</p>
                                <p className="text-blue-400 text-sm font-medium">5 this week</p>
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
                    {/* Recent Job Postings */}
                    <div className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-100">Recent Job Postings</h2>
                            <button className="text-primary-400 hover:text-primary-300 transition-colors text-sm font-semibold">
                                View All
                            </button>
                        </div>
                        <div className="space-y-4">
                            {recentJobs.map((job) => (
                                <div key={job.id} className="glass-card-hover p-4 rounded-xl transition-all duration-300">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-slate-100 mb-1">{job.title}</h3>
                                            <p className="text-slate-400 text-sm">{job.location}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                                            {job.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-slate-400 mb-3">
                                        <div className="flex gap-4">
                                            <span>{job.applications} applications</span>
                                            <span>{job.views} views</span>
                                        </div>
                                        <span>{job.posted}</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="btn-secondary text-sm px-4 py-2 flex-1">
                                            Edit Job
                                        </button>
                                        <button className="btn-primary text-sm px-4 py-2 flex-1">
                                            View Applications
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Applications */}
                    <div className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-100">Recent Applications</h2>
                            <button className="text-primary-400 hover:text-primary-300 transition-colors text-sm font-semibold">
                                View All
                            </button>
                        </div>
                        <div className="space-y-4">
                            {recentApplications.map((application) => (
                                <div key={application.id} className="glass-card-hover p-4 rounded-xl transition-all duration-300">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={application.avatar}
                                                alt={application.candidateName}
                                                className="w-10 h-10 rounded-full bg-slate-700"
                                            />
                                            <div>
                                                <h3 className="font-semibold text-slate-100 text-sm">{application.candidateName}</h3>
                                                <p className="text-slate-400 text-xs">{application.jobTitle}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                                            {application.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-400 mb-3">
                                        <span>{application.experience} experience</span>
                                        <span>{application.appliedDate}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="btn-secondary text-xs px-3 py-1 flex-1">
                                            View Profile
                                        </button>
                                        <button className="btn-primary text-xs px-3 py-1 flex-1">
                                            Review
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-slate-100 mb-2">Post New Job</h3>
                            <p className="text-slate-400 text-sm">Create a new job posting</p>
                        </button>

                        <button className="glass-card-hover p-6 rounded-xl text-left transition-all duration-300 hover:scale-105">
                            <div className="p-3 bg-blue-500/20 rounded-xl mb-4 w-fit">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-slate-100 mb-2">Review Candidates</h3>
                            <p className="text-slate-400 text-sm">View and manage applications</p>
                        </button>

                        <button className="glass-card-hover p-6 rounded-xl text-left transition-all duration-300 hover:scale-105">
                            <div className="p-3 bg-green-500/20 rounded-xl mb-4 w-fit">
                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-slate-100 mb-2">Company Profile</h3>
                            <p className="text-slate-400 text-sm">Update company information</p>
                        </button>

                        <button className="glass-card-hover p-6 rounded-xl text-left transition-all duration-300 hover:scale-105">
                            <div className="p-3 bg-purple-500/20 rounded-xl mb-4 w-fit">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-slate-100 mb-2">View Analytics</h3>
                            <p className="text-slate-400 text-sm">Track job performance</p>
                        </button>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}

export default EmployerDashboard