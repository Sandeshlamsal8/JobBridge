import { useState, useEffect, useRef } from "react";
import { authAPI } from "../utils/api";

function EmailVerificationPage({ email, onNavigate, onVerificationSuccess }) {
    const [pin, setPin] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
    const inputRefs = useRef([]);

    // Countdown timer
    useEffect(() => {
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;

        const timer = setInterval(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [resendCooldown]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handlePinChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits

        const newPin = [...pin];
        newPin[index] = value.slice(-1); // Only take last character
        setPin(newPin);
        setError("");

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newPin = pastedData.split("").concat(Array(6).fill("")).slice(0, 6);
        setPin(newPin);

        // Focus last filled input or first empty
        const nextIndex = Math.min(pastedData.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };

    const handleVerify = async () => {
        const pinCode = pin.join("");

        if (pinCode.length !== 6) {
            setError("Please enter all 6 digits");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // Call API directly without storing token (no auto-login)
            const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/verify-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, pin: pinCode }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                // Account created successfully, redirect to login after delay
                setTimeout(() => {
                    if (onVerificationSuccess) {
                        onVerificationSuccess(data.data);
                    }
                }, 2000); // 2 second delay to show success message
            } else {
                setError(data.message || "Invalid PIN. Please try again.");
                setPin(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            setError(err.message || "Verification failed. Please try again.");
            setPin(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;

        setIsLoading(true);
        setError("");

        try {
            const response = await authAPI.resendPin({ email });

            if (response.success) {
                setResendCooldown(60); // 60 seconds cooldown
                setTimeLeft(15 * 60); // Reset timer
                setPin(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            } else {
                setError(response.message || "Failed to resend PIN");
            }
        } catch (err) {
            setError(err.message || "Failed to resend PIN");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full text-center animate-scale-in">
                    <div className="glass-card p-8 rounded-3xl">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-100 mb-3">Account Created!</h2>
                        <p className="text-slate-300 mb-6">Your email has been verified successfully.</p>
                        <p className="text-slate-400 text-sm">Redirecting to login page...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-900/20 via-transparent to-transparent"></div>
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>

            <div className="max-w-md w-full space-y-8 relative animate-fade-in">
                {/* Header */}
                <div className="text-center">
                    <button
                        onClick={() => onNavigate && onNavigate("home")}
                        className="text-3xl font-bold gradient-text mb-4 hover:scale-105 transition-transform duration-300"
                    >
                        JobBridge
                    </button>
                    <h2 className="text-2xl font-bold text-slate-100 mb-2">Verify Your Email</h2>
                    <p className="text-slate-300">
                        We've sent a 6-digit PIN to
                        <br />
                        <span className="text-primary-400 font-semibold">{email}</span>
                    </p>
                </div>

                {/* Timer */}
                <div className="glass-card p-4 rounded-xl text-center">
                    <p className="text-slate-400 text-sm mb-1">PIN expires in</p>
                    <p className={`text-2xl font-bold ${timeLeft < 60 ? "text-red-400" : "text-primary-400"}`}>
                        {formatTime(timeLeft)}
                    </p>
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

                {/* PIN Input */}
                <div className="glass-card p-8 rounded-3xl shadow-glow-lg">
                    <label className="block text-sm font-semibold text-slate-300 mb-4 text-center">
                        Enter 6-Digit PIN
                    </label>

                    <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
                        {pin.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handlePinChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-14 text-center text-2xl font-bold bg-dark-800/50 border-2 border-dark-600/50 rounded-xl text-slate-100 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 transition-all"
                                disabled={isLoading}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleVerify}
                        disabled={isLoading || pin.join("").length !== 6}
                        className="w-full btn-primary h-12 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-3">
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Verifying...
                            </div>
                        ) : (
                            "Verify Email"
                        )}
                    </button>

                    {/* Resend PIN */}
                    <div className="text-center">
                        <p className="text-slate-400 text-sm mb-2">Didn't receive the PIN?</p>
                        <button
                            onClick={handleResend}
                            disabled={isLoading || resendCooldown > 0}
                            className="text-primary-400 hover:text-primary-300 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend PIN"}
                        </button>
                    </div>
                </div>

                {/* Help Text */}
                <div className="glass-card p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-slate-300">
                            <p className="font-semibold mb-1">Check your email</p>
                            <p className="text-slate-400">The PIN may take a few moments to arrive. Check your spam folder if you don't see it.</p>
                        </div>
                    </div>
                </div>

                {/* Back to signup */}
                <div className="text-center">
                    <button
                        onClick={() => onNavigate && onNavigate("signup")}
                        className="text-slate-400 hover:text-primary-400 transition-colors text-sm"
                        disabled={isLoading}
                    >
                        ← Back to Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EmailVerificationPage;
