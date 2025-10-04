import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import Header from "../components/layout/Header"
import Footer from "../components/layout/Footer"

function PostJobPage({ onNavigate }) {
    const { user, logout } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        location: "",
        jobType: "full-time",
        workMode: "onsite",
        experienceLevel: "mid",
        category: "technology",
        skills: [],
        requirements: [],
        responsibilities: [],
        benefits: [],
        salary: {
            min: "",
            max: "",
            currency: "USD",
            period: "yearly"
        },
        applicationDeadline: "",
        applicationEmail: "",
        status: "active"
    })

    const [currentSkill, setCurrentSkill] = useState("")
    const [currentRequirement, setCurrentRequirement] = useState("")
    const [currentResponsibility, setCurrentResponsibility] = useState("")
    const [currentBenefit, setCurrentBenefit] = useState("")

    const jobTypes = [
        { value: "full-time", label: "Full-time" },
        { value: "part-time", label: "Part-time" },
        { value: "contract", label: "Contract" },
        { value: "internship", label: "Internship" },
        { value: "freelance", label: "Freelance" }
    ]

    const workModes = [
        { value: "remote", label: "Remote" },
        { value: "onsite", label: "On-site" },
        { value: "hybrid", label: "Hybrid" }
    ]

    const experienceLevels = [
        { value: "entry", label: "Entry Level" },
        { value: "mid", label: "Mid Level" },
        { value: "senior", label: "Senior Level" },
        { value: "executive", label: "Executive" }
    ]

    const categories = [
        { value: "technology", label: "Technology" },
        { value: "marketing", label: "Marketing" },
        { value: "sales", label: "Sales" },
        { value: "design", label: "Design" },
        { value: "finance", label: "Finance" },
        { value: "hr", label: "Human Resources" },
        { value: "operations", label: "Operations" },
        { value: "customer-service", label: "Customer Service" },
        { value: "healthcare", label: "Healthcare" },
        { value: "education", label: "Education" },
        { value: "legal", label: "Legal" },
        { value: "other", label: "Other" }
    ]

    const handleChange = (e) => {
        const { name, value } = e.target

        if (name.includes('.')) {
            const [parent, child] = name.split('.')
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }))
        }

        if (error) setError(null)
    }

    const addToArray = (arrayName, value, setValue) => {
        if (value.trim()) {
            setFormData(prev => ({
                ...prev,
                [arrayName]: [...prev[arrayName], value.trim()]
            }))
            setValue("")
        }
    }

    const removeFromArray = (arrayName, index) => {
        setFormData(prev => ({
            ...prev,
            [arrayName]: prev[arrayName].filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jobbridge_token')}`
                },
                body: JSON.stringify({
                    ...formData,
                    salary: {
                        ...formData.salary,
                        min: formData.salary.min ? parseInt(formData.salary.min) : null,
                        max: formData.salary.max ? parseInt(formData.salary.max) : null
                    }
                })
            })

            const data = await response.json()

            if (data.success) {
                setSuccess(true)
                setTimeout(() => {
                    onNavigate("employer-dashboard")
                }, 2000)
            } else {
                setError(data.message || 'Failed to post job')
            }
        } catch (error) {
            setError('Network error. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        await logout()
        onNavigate("home")
    }

    if (success) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-100 mb-2">Job Posted Successfully!</h2>
                    <p className="text-slate-300">Redirecting to your dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-dark-950 text-slate-100">
            <Header onNavigate={onNavigate} user={user} onLogout={handleLogout} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                <div className="mb-8 animate-fade-in">
                    <button
                        onClick={() => onNavigate("employer-dashboard")}
                        className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors mb-4"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-2">
                        Post a New <span className="gradient-text">Job</span>
                    </h1>
                    <p className="text-slate-300 text-lg">Find the perfect candidate for your team</p>
                </div>

                {error && (
                    <div className="glass-card p-4 rounded-xl border-red-500/50 bg-red-500/10 mb-6 animate-scale-in">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-300 text-sm font-medium">{error}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <div className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up">
                        <h2 className="text-2xl font-bold text-slate-100 mb-6">Basic Information</h2>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-semibold text-slate-300 mb-3">Job Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="input-field h-12 text-lg"
                                    placeholder="e.g. Senior Frontend Developer"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-3">Location *</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="input-field h-12"
                                    placeholder="e.g. San Francisco, CA"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-3">Category *</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="input-field h-12"
                                    required
                                    disabled={isLoading}
                                >
                                    {categories.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-3">Job Type *</label>
                                <select
                                    name="jobType"
                                    value={formData.jobType}
                                    onChange={handleChange}
                                    className="input-field h-12"
                                    required
                                    disabled={isLoading}
                                >
                                    {jobTypes.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-3">Work Mode *</label>
                                <select
                                    name="workMode"
                                    value={formData.workMode}
                                    onChange={handleChange}
                                    className="input-field h-12"
                                    required
                                    disabled={isLoading}
                                >
                                    {workModes.map(mode => (
                                        <option key={mode.value} value={mode.value}>{mode.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-3">Experience Level *</label>
                                <select
                                    name="experienceLevel"
                                    value={formData.experienceLevel}
                                    onChange={handleChange}
                                    className="input-field h-12"
                                    required
                                    disabled={isLoading}
                                >
                                    {experienceLevels.map(level => (
                                        <option key={level.value} value={level.value}>{level.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-3">Application Email</label>
                                <input
                                    type="email"
                                    name="applicationEmail"
                                    value={formData.applicationEmail}
                                    onChange={handleChange}
                                    className="input-field h-12"
                                    placeholder="applications@company.com"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-semibold text-slate-300 mb-3">Job Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={8}
                                className="input-field text-lg resize-none"
                                placeholder="Describe the role, what the candidate will be doing, and what makes this opportunity exciting..."
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Salary Information */}
                    <div className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up">
                        <h2 className="text-2xl font-bold text-slate-100 mb-6">Salary Information</h2>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-3">Minimum Salary</label>
                                <input
                                    type="number"
                                    name="salary.min"
                                    value={formData.salary.min}
                                    onChange={handleChange}
                                    className="input-field h-12"
                                    placeholder="80000"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-3">Maximum Salary</label>
                                <input
                                    type="number"
                                    name="salary.max"
                                    value={formData.salary.max}
                                    onChange={handleChange}
                                    className="input-field h-12"
                                    placeholder="120000"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-3">Period</label>
                                <select
                                    name="salary.period"
                                    value={formData.salary.period}
                                    onChange={handleChange}
                                    className="input-field h-12"
                                    disabled={isLoading}
                                >
                                    <option value="yearly">Yearly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="hourly">Hourly</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up">
                        <h2 className="text-2xl font-bold text-slate-100 mb-6">Required Skills</h2>

                        <div className="flex gap-3 mb-4">
                            <input
                                type="text"
                                value={currentSkill}
                                onChange={(e) => setCurrentSkill(e.target.value)}
                                className="input-field h-12 flex-1"
                                placeholder="e.g. React, Node.js, Python"
                                disabled={isLoading}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        addToArray('skills', currentSkill, setCurrentSkill)
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => addToArray('skills', currentSkill, setCurrentSkill)}
                                className="btn-primary px-6"
                                disabled={isLoading}
                            >
                                Add
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {formData.skills.map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-2 bg-primary-500/20 text-primary-400 rounded-full text-sm border border-primary-500/30 flex items-center gap-2"
                                >
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => removeFromArray('skills', index)}
                                        className="text-primary-400 hover:text-red-400 transition-colors"
                                        disabled={isLoading}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Requirements */}
                    <div className="glass-card p-6 lg:p-8 rounded-3xl animate-slide-up">
                        <h2 className="text-2xl font-bold text-slate-100 mb-6">Requirements</h2>

                        <div className="flex gap-3 mb-4">
                            <input
                                type="text"
                                value={currentRequirement}
                                onChange={(e) => setCurrentRequirement(e.target.value)}
                                className="input-field h-12 flex-1"
                                placeholder="e.g. 3+ years of experience with React"
                                disabled={isLoading}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        addToArray('requirements', currentRequirement, setCurrentRequirement)
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => addToArray('requirements', currentRequirement, setCurrentRequirement)}
                                className="btn-primary px-6"
                                disabled={isLoading}
                            >
                                Add
                            </button>
                        </div>

                        <div className="space-y-2">
                            {formData.requirements.map((req, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 glass-card rounded-xl">
                                    <span className="flex-1 text-slate-300">{req}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeFromArray('requirements', index)}
                                        className="text-red-400 hover:text-red-300 transition-colors"
                                        disabled={isLoading}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => onNavigate("employer-dashboard")}
                            className="btn-secondary px-8 py-3"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-3">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Posting Job...
                                </div>
                            ) : (
                                "Post Job"
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <Footer />
        </div>
    )
}

export default PostJobPage