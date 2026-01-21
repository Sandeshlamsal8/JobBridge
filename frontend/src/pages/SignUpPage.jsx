import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "../components/ToastContainer";
import LegalModal from "../components/LegalModal";

function SignUpPage({ onNavigate }) {
  const { signup, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "jobseeker", // jobseeker or employer
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSymbol: false,
    score: 0,
  });
  const [legalModal, setLegalModal] = useState({ isOpen: false, type: null });

  const checkPasswordStrength = (password) => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const score = [
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSymbol,
    ].filter(Boolean).length;

    return {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSymbol,
      score,
    };
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (error) clearError();
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: null }));
    }

    const newFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };

    setFormData(newFormData);

    // Check password strength when password field changes
    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (formData.firstName.length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (formData.lastName.length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else {
      const strength = checkPasswordStrength(formData.password);
      if (!strength.hasMinLength) {
        errors.password = "Password must be at least 8 characters";
      } else if (
        !strength.hasUppercase ||
        !strength.hasNumber ||
        !strength.hasSymbol
      ) {
        errors.password =
          "Password must contain at least one uppercase letter, one number, and one symbol";
      }
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = "You must agree to the terms and conditions";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const result = await signup(formData);

    if (result.success && result.requiresVerification) {
      showToast(
        "Account created successfully! Please check your email to verify your account.",
        "success",
        6000
      );
      // Redirect to verification page
      onNavigate("verify-email", { email: formData.email });
    } else if (result.errors) {
      // Handle server validation errors
      const serverErrors = {};
      result.errors.forEach((error) => {
        const field = error.path || error.param;
        if (field) {
          serverErrors[field] = error.msg || error.message;
        }
      });
      setValidationErrors(serverErrors);
    }
  };

  const getFieldError = (fieldName) => {
    return validationErrors[fieldName];
  };

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
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-100 mb-2">
            Create your account
          </h2>
          <p className="text-slate-300 text-lg">
            Join thousands of professionals finding their dream jobs
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass-card p-4 rounded-xl border-red-500/50 bg-red-500/10 animate-scale-in">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-red-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
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
              onClick={() =>
                setFormData({ ...formData, userType: "jobseeker" })
              }
              className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                formData.userType === "jobseeker"
                  ? "border-primary-500 bg-primary-500/10 text-primary-400 shadow-glow"
                  : "border-dark-600/50 bg-dark-800/30 text-slate-300 hover:border-primary-500/50 hover:bg-primary-500/5"
              }`}
              disabled={isLoading}
            >
              <div className="text-center">
                <svg
                  className="w-10 h-10 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
              className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                formData.userType === "employer"
                  ? "border-primary-500 bg-primary-500/10 text-primary-400 shadow-glow"
                  : "border-dark-600/50 bg-dark-800/30 text-slate-300 hover:border-primary-500/50 hover:bg-primary-500/5"
              }`}
              disabled={isLoading}
            >
              <div className="text-center">
                <svg
                  className="w-10 h-10 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                <label
                  htmlFor="firstName"
                  className="block text-sm font-semibold text-slate-300 mb-3"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`input-field h-12 text-lg ${
                    getFieldError("firstName")
                      ? "border-red-500/50 focus:ring-red-500/50"
                      : ""
                  }`}
                  placeholder="First Name"
                  disabled={isLoading}
                />
                {getFieldError("firstName") && (
                  <p className="mt-2 text-sm text-red-400">
                    {getFieldError("firstName")}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-semibold text-slate-300 mb-3"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`input-field h-12 text-lg ${
                    getFieldError("lastName")
                      ? "border-red-500/50 focus:ring-red-500/50"
                      : ""
                  }`}
                  placeholder="Last Name"
                  disabled={isLoading}
                />
                {getFieldError("lastName") && (
                  <p className="mt-2 text-sm text-red-400">
                    {getFieldError("lastName")}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-300 mb-3"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`input-field h-12 text-lg ${
                  getFieldError("email")
                    ? "border-red-500/50 focus:ring-red-500/50"
                    : ""
                }`}
                placeholder="youremail@example.com"
                disabled={isLoading}
              />
              {getFieldError("email") && (
                <p className="mt-2 text-sm text-red-400">
                  {getFieldError("email")}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-300 mb-3"
              >
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
                  className={`input-field h-12 text-lg pr-12 ${
                    getFieldError("password")
                      ? "border-red-500/50 focus:ring-red-500/50"
                      : ""
                  }`}
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
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3 space-y-2">
                  {/* Strength Bar */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          level <= passwordStrength.score
                            ? passwordStrength.score <= 2
                              ? "bg-red-400"
                              : passwordStrength.score <= 3
                              ? "bg-yellow-400"
                              : passwordStrength.score <= 4
                              ? "bg-blue-400"
                              : "bg-green-400"
                            : "bg-dark-600"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Strength Text */}
                  <p
                    className={`text-xs font-medium ${
                      passwordStrength.score <= 2
                        ? "text-red-400"
                        : passwordStrength.score <= 3
                        ? "text-yellow-400"
                        : passwordStrength.score <= 4
                        ? "text-blue-400"
                        : "text-green-400"
                    }`}
                  >
                    {passwordStrength.score <= 2
                      ? "Weak password"
                      : passwordStrength.score <= 3
                      ? "Fair password"
                      : passwordStrength.score <= 4
                      ? "Good password"
                      : "Strong password"}
                  </p>

                  {/* Requirements Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                    <div
                      className={`flex items-center gap-2 ${
                        passwordStrength.hasMinLength
                          ? "text-green-400"
                          : "text-slate-400"
                      }`}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {passwordStrength.hasMinLength ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        ) : (
                          <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        )}
                      </svg>
                      <span>8+ characters</span>
                    </div>

                    <div
                      className={`flex items-center gap-2 ${
                        passwordStrength.hasUppercase
                          ? "text-green-400"
                          : "text-slate-400"
                      }`}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {passwordStrength.hasUppercase ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        ) : (
                          <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        )}
                      </svg>
                      <span>Uppercase letter</span>
                    </div>

                    <div
                      className={`flex items-center gap-2 ${
                        passwordStrength.hasNumber
                          ? "text-green-400"
                          : "text-slate-400"
                      }`}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {passwordStrength.hasNumber ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        ) : (
                          <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        )}
                      </svg>
                      <span>Number</span>
                    </div>

                    <div
                      className={`flex items-center gap-2 ${
                        passwordStrength.hasSymbol
                          ? "text-green-400"
                          : "text-slate-400"
                      }`}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {passwordStrength.hasSymbol ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        ) : (
                          <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        )}
                      </svg>
                      <span>Symbol (!@#$%...)</span>
                    </div>
                  </div>
                </div>
              )}

              {getFieldError("password") && (
                <p className="mt-2 text-sm text-red-400">
                  {getFieldError("password")}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-slate-300 mb-3"
              >
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
                  className={`input-field h-12 text-lg pr-12 ${
                    getFieldError("confirmPassword")
                      ? "border-red-500/50 focus:ring-red-500/50"
                      : ""
                  }`}
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
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {getFieldError("confirmPassword") && (
                <p className="mt-2 text-sm text-red-400">
                  {getFieldError("confirmPassword")}
                </p>
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
                className={`h-5 w-5 text-primary-500 focus:ring-primary-500/50 border-dark-600 rounded bg-dark-800 transition-colors mt-0.5 ${
                  getFieldError("agreeToTerms") ? "border-red-500/50" : ""
                }`}
                disabled={isLoading}
              />
              <label
                htmlFor="agreeToTerms"
                className="ml-3 block text-sm text-slate-300 font-medium leading-relaxed"
              >
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setLegalModal({ isOpen: true, type: "terms" })}
                  className="text-primary-400 hover:text-primary-300 transition-colors font-semibold underline"
                  disabled={isLoading}
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() =>
                    setLegalModal({ isOpen: true, type: "privacy" })
                  }
                  className="text-primary-400 hover:text-primary-300 transition-colors font-semibold underline"
                  disabled={isLoading}
                >
                  Privacy Policy
                </button>
              </label>
            </div>
            {getFieldError("agreeToTerms") && (
              <p className="text-sm text-red-400">
                {getFieldError("agreeToTerms")}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary h-12 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
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

      {/* Legal Modal */}
      <LegalModal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal({ isOpen: false, type: null })}
        type={legalModal.type}
      />
    </div>
  );
}

export default SignUpPage;
