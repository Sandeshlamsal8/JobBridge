import { useAuth } from "../contexts/AuthContext"
import Header from "../components/layout/Header"
import Footer from "../components/layout/Footer"

// Hero Section Component
function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 pt-20 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/20 via-transparent to-transparent"></div>
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

            <div className="relative max-w-7xl mx-auto text-center animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-100 mb-6 leading-tight">
                        Find Your Dream Job
                        <span className="gradient-text block mt-2">Today</span>
                    </h1>
                    <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                        Connect with top employers and discover opportunities that match your skills and aspirations through
                        <span className="text-primary-400 font-semibold"> JobBridge</span>.
                    </p>
                </div>

                {/* Enhanced Search Bar */}
                <div className="max-w-5xl mx-auto mb-12 animate-slide-up">
                    <div className="glass-card p-6 lg:p-8 rounded-3xl shadow-glow-lg">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                            <div className="lg:col-span-5">
                                <label className="block text-sm font-semibold text-slate-300 mb-3">Job Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Frontend Developer, Product Manager"
                                    className="input-field h-14 text-lg"
                                />
                            </div>
                            <div className="lg:col-span-4">
                                <label className="block text-sm font-semibold text-slate-300 mb-3">Location</label>
                                <input
                                    type="text"
                                    placeholder="e.g. New York, Remote, San Francisco"
                                    className="input-field h-14 text-lg"
                                />
                            </div>
                            <div className="lg:col-span-3 flex items-end">
                                <button className="w-full btn-primary h-14 text-lg font-bold rounded-xl">
                                    <div className="flex items-center justify-center gap-3">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                        Search Jobs
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Popular Searches */}
                <div className="flex flex-wrap justify-center items-center gap-3 lg:gap-4 animate-fade-in">
                    <span className="text-slate-400 font-semibold text-sm lg:text-base">Popular:</span>
                    {["Remote", "Full-time", "Part-time", "Frontend", "Backend", "Design"].map((tag) => (
                        <button
                            key={tag}
                            className="px-4 py-2 lg:px-6 lg:py-3 glass-card hover:glass-card-hover text-slate-300 rounded-full text-sm lg:text-base font-medium transition-all duration-300 hover:text-primary-400 hover:scale-105"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    )
}

// Features Section Component
function Features() {
    const features = [
        {
            icon: (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            ),
            title: "Smart Job Matching",
            description: "Our AI-powered algorithm matches you with jobs that fit your skills and preferences perfectly.",
        },
        {
            icon: (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                </svg>
            ),
            title: "Top Companies",
            description: "Access exclusive opportunities from leading companies across various industries.",
        },
        {
            icon: (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            title: "Quick Applications",
            description: "Apply to multiple jobs with one click using your saved profile and resume.",
        },
        {
            icon: (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            title: "Verified Listings",
            description: "All job postings are verified to ensure authenticity and quality opportunities.",
        },
    ]

    return (
        <section className="py-20 lg:py-32 bg-dark-900 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="text-center mb-16 lg:mb-20 animate-fade-in">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-100 mb-6">
                        Why Choose <span className="gradient-text">JobBridge</span>?
                    </h2>
                    <p className="text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                        We make job searching simple, efficient, and successful for both job seekers and employers.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group glass-card-hover p-6 lg:p-8 rounded-2xl text-center animate-scale-in"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-primary-500/20 to-primary-600/20 text-primary-400 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl lg:text-2xl font-bold text-slate-100 mb-4">{feature.title}</h3>
                            <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// CTA Section Component
function CTA() {
    return (
        <section className="py-20 lg:py-32 bg-gradient-to-br from-dark-800 to-dark-900 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-900/10 via-transparent to-transparent"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl"></div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative animate-fade-in">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-100 mb-6">
                    Ready to Find Your Next <span className="gradient-text">Opportunity</span>?
                </h2>
                <p className="text-lg lg:text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Join thousands of professionals who have found their dream jobs through our platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center">
                    <button className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto">
                        Browse Jobs
                    </button>
                    <button className="btn-primary text-lg px-8 py-4 w-full sm:w-auto">
                        Post a Job
                    </button>
                </div>
            </div>
        </section>
    )
}

function HomePage({ onNavigate }) {
    const { user, logout } = useAuth()

    const handleLogout = async () => {
        await logout()
        onNavigate("home")
    }

    return (
        <div className="min-h-screen bg-dark-950 text-slate-100">
            <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />
            <Hero />
            <Features />
            <CTA />
            <Footer />
        </div>
    )
}

export default HomePage