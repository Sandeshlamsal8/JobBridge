import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"

function SignUpPage({ onNavigate }) {
    const { signup, isLoading, error, clearError } = useAuth()
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        userType: "jobseeker", // jobseeker or employer
        agreeToTerms: false,
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [validationErrors, setValidationErrors] = useState({})

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target

        if (error) clearError()
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: null }))
        }

        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        })
    }

    const validateForm = () => {
        const errors = {}

        if (!formData.firstName.trim()) {
            errors.firstName = "First name is required"
        } else if (formData.firstName.length < 2) {
            errors.firstName = "First name must be at least 2 characters"
        }

        if (!formData.lastName.trim()) {
            errors.lastName = "Last name is required"
        } else if (formData.lastName.length < 2) {
            errors.lastName = "Last name must be at least 2 characters"
        }

        if (!formData.email.trim()) {
            errors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = "Please enter a valid email address"
        }

        if (!formData.password) {
            errors.password = "Password is required"
        } else if (formData.password.length < 6) {
            errors.password = "Password must be at least 6 characters"
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            errors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number"
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = "Please confirm your password"
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match"
        }

        if (!formData.agreeToTerms) {
            errors.agreeToTerms = "You must agree to the terms and conditions"
        }

        return errors
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const errors = validateForm()
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors)
            return
        }

        const result = await signup(formData)

        if (result.success) {
            // Redirect to home page on successful signup
            onNavigate("home")
        } else if (result.errors) {
            // Handle server validation errors
            const serverErrors = {}
            result.errors.forEach(error => {
                const field = error.path || error.param
                if (field) {
                    serverErrors[field] = error.msg || error.message
                }
            })
            setValidationErrors(serverErrors)
        }
    }

    const getFieldError = (fieldName) => {
        return validationErrors[fieldName]
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-900/20 via-transparent to-transparent"></div>
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

            <div className="max-w-lg w-full space-y-8 relative animate-fade-in">
                {/* Header */}
                <div className="text-center">
                    <button
                        onClick={() => onNavigate && onNavigate("home")}
                        className="text-3xl lg:text-4xl font-bold gradient-text mb-4 hover:scale-105 transition-transform duration-300"
                    >
                        JobBridge
                    </button>
                    <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-2">Create your account</h2>
                    <p className="text-slate-300 text-lg">Join thousands of professionals finding their dream jobs</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="glass-card p-4 rounded-xl border-red-500/50 bg-red-500/10 animate-scale-in">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-300 text-sm font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* User Type Selection */}
                <div className="glass-card p-6 lg:p-8 rounded-3xl shadow-glow-lg animate-scale-in">
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, userType: "jobseeker" })}
                            className={`p-6 rounded-2xl border-2 transition-all duration-300 ${formData.userType === "jobseeker"
                                    ? "border-primary-500 bg-primary-500/10 text-primary-400 shadow-glow"
                                    : "border-dark-600/50 bg-dark-800/30 text-slate-300 hover:border-primary-500/50 hover:bg-primary-500/5"
                                }`}
                            disabled={isLoading}
                        >
                            <div className="text-center">
                                <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                                <span className="font-bold text-lg">Job Seeker</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, userType: "employer" })}
                            className={`p-6 rounded-2xl border-2 transition-all duration-300 ${formData.userType === "employer"
                                    ? "border-primary-500 bg-primary-500/10 text-primary-400 shadow-glow"
                                    : "border-dark-600/50 bg-dark-800/30 text-slate-300 hover:border-primary-500/50 hover:bg-primary-500/5"
                                }`}
                            disabled={isLoading}
                        >
                            <div className="text-center">
                                <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    />
                                </svg>
                                <span className="font-bold text-lg">Employer</span>
                            </div>
                        </button>
                    </div>

                    {/* Signup Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-semibold text-slate-300 mb-3">
                                    First Name
                                </label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    required
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className={`input-field h-12 text-lg ${getFieldError('firstName') ? 'border-red-500/50 focus:ring-red-500/50' : ''}`}
                                    placeholder="John"
                                    disabled={isLoading}
                                />
                                {getFieldError('firstName') && (
                                    <p className="mt-2 text-sm text-red-400">{getFieldError('firstName')}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-semibold text-slate-300 mb-3">
                                    Last Name
                                </label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    required
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className={`input-field h-12 text-lg ${getFieldError('lastName') ? 'border-red-500/50 focus:ring-red-500/50' : ''}`}
                                    placeholder="Doe"
                                    disabled={isLoading}
                                />
                                {getFieldError('lastName') && (
                                    <p className="mt-2 text-sm text-red-400">{getFieldError('lastName')}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-3">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className={`input-field h-12 text-lg ${getFieldError('email') ? 'border-red-500/50 focus:ring-red-500/50' : ''}`}
                                placeholder="john@example.com"
                                disabled={isLoading}
                            />
                            {getFieldError('email') && (
                                <p className="mt-2 text-sm text-red-400">{getFieldError('email')}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-3">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`input-field h-12 text-lg pr-12 ${getFieldError('password') ? 'border-red-500/50 focus:ring-red-500/50' : ''}`}
                                    placeholder="Create a strong password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-primary-400 transition-colors"
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {getFieldError('password') && (
                                <p className="mt-2 text-sm text-red-400">{getFieldError('password')}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-300 mb-3">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`input-field h-12 text-lg pr-12 ${getFieldError('confirmPassword') ? 'border-red-500/50 focus:ring-red-500/50' : ''}`}
                                    placeholder="Confirm your password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-primary-400 transition-colors"
                                    disabled={isLoading}
                                >
                                    {showConfirmPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {getFieldError('confirmPassword') && (
                                <p className="mt-2 text-sm text-red-400">{getFieldError('confirmPassword')}</p>
                            )}
                        </div>

                        <div className="flex items-start">
                            <input
                                id="agreeToTerms"
                                name="agreeToTerms"
                                type="checkbox"
                                required
                                checked={formData.agreeToTerms}
                                onChange={handleChange}
                                className={`h-5 w-5 text-primary-500 focus:ring-primary-500/50 border-dark-600 rounded bg-dark-800 transition-colors mt-0.5 ${getFieldError('agreeToTerms') ? 'border-red-500/50' : ''}`}
                                disabled={isLoading}
                            />
                            <label htmlFor="agreeToTerms" className="ml-3 block text-sm text-slate-300 font-medium leading-relaxed">
                                I agree to the{" "}
                                <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors font-semibold">
                                    Terms of Service
                                </a>{" "}
                                and{" "}
                                <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors font-semibold">
                                    Privacy Policy
                                </a>
                            </label>
                        </div>
                        {getFieldError('agreeToTerms') && (
                            <p className="text-sm text-red-400">{getFieldError('agreeToTerms')}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary h-12 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Account...
                                </div>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-dark-600/50" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 glass-card text-slate-400 font-medium">Or sign up with</span>
                            </div>
                        </div>
                    </div>

                    {/* Social Signup */}
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <button
                            className="glass-card-hover p-4 rounded-xl text-sm font-semibold text-slate-300 transition-all duration-300 hover:text-primary-400 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            <div className="flex items-center justify-center gap-3">
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Google
                            </div>
                        </button>

                        <button
                            className="glass-card-hover p-4 rounded-xl text-sm font-semibold text-slate-300 transition-all duration-300 hover:text-primary-400 disabled:opacity-50"
                            disabled={isLoading}
                        >
                            <div className="flex items-center justify-center gap-3">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                </svg>
                                Twitter
                            </div>
                        </button>
                    </div>
                </div>

                {/* Sign in link */}
                <div className="text-center animate-fade-in">
                    <p className="text-slate-300 text-lg">
                        Already have an account?{" "}
                        <button
                            onClick={() => onNavigate && onNavigate("login")}
                            className="text-primary-400 hover:text-primary-300 transition-colors font-semibold hover:underline"
                            disabled={isLoading}
                        >
                            Sign in here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default SignUpPage