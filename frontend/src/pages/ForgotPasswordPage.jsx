import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authAPI } from '../utils/api';

const ForgotPasswordPage = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authAPI.forgotPassword({ email });

      if (response.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(
        err.message || 
        'Failed to send reset email. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-dark-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-dark-700/50 p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                Check Your Email
              </h2>
              
              <p className="text-slate-300 mb-6">
                If an account exists with <span className="font-semibold text-white">{email}</span>, 
                you will receive a password reset link shortly.
              </p>

              <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-300">
                  <strong className="text-primary-400">Note:</strong> The reset link will expire in 1 hour. 
                  If you don't see the email, check your spam folder.
                </p>
              </div>

              <button
                onClick={() => onNavigate('login')}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-dark-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-dark-700/50 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-primary-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Forgot Password?
            </h2>
            <p className="text-slate-400">
              No worries! Enter your email and we'll send you reset instructions.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => onNavigate('login')}
              className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </button>
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Remember your password?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
