import { useEffect } from 'react';

function LegalModal({ isOpen, onClose, type }) {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getContent = () => {
    if (type === 'terms') {
      return {
        title: 'Terms of Service',
        content: (
          <div className="space-y-6">
            <div className="bg-primary-500/10 p-4 rounded-lg border border-primary-500/20">
              <p className="text-primary-400 font-medium">
                Welcome to JobBridge! By using our platform, you agree to these terms.
              </p>
            </div>

            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">1. What JobBridge Does</h3>
              <p className="text-slate-300 mb-2">JobBridge is a job platform that connects job seekers with employers. We provide:</p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>Job posting and browsing capabilities</li>
                <li>Application management system</li>
                <li>User profiles for job seekers and employers</li>
                <li>Secure user authentication</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">2. Your Account</h3>
              <p className="text-slate-300 mb-2">When you create an account, you agree to:</p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>Provide accurate information</li>
                <li>Keep your login credentials secure</li>
                <li>Not share your account with others</li>
                <li>Update your information when it changes</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">3. Acceptable Use</h3>
              <p className="text-slate-300 mb-2">You may use JobBridge for legitimate job-related activities. You may not:</p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>Post false or misleading information</li>
                <li>Spam or harass other users</li>
                <li>Use the platform for illegal activities</li>
                <li>Attempt to hack or disrupt our services</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">4. Job Postings & Applications</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-slate-200 font-medium">For Employers:</p>
                  <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                    <li>Job postings must be for real, available positions</li>
                    <li>You're responsible for your hiring decisions</li>
                    <li>Treat all candidates fairly and respectfully</li>
                  </ul>
                </div>
                <div>
                  <p className="text-slate-200 font-medium">For Job Seekers:</p>
                  <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                    <li>Applications should be genuine and relevant</li>
                    <li>Be honest about your qualifications</li>
                    <li>Respect employers' time and processes</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">5. Privacy & Data</h3>
              <p className="text-slate-300 mb-2">We protect your privacy by:</p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>Using secure session storage (auto-logout when browser closes)</li>
                <li>Not selling your personal data to third parties</li>
                <li>Allowing you to delete your account and data anytime</li>
                <li>See our Privacy Policy for full details</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">6. Account Security</h3>
              <p className="text-slate-300 mb-2">For your security:</p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>You'll be automatically logged out when you close your browser</li>
                <li>Use a strong password with uppercase, numbers, and symbols</li>
                <li>Verify your email address during signup</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">7. Contact Us</h3>
              <p className="text-slate-300">
                Questions about these terms? Email us at{' '}
                <span className="text-primary-400 font-medium">jobbridge123@gmail.com</span>
              </p>
            </section>

            <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
              <p className="text-green-400 font-medium">
                Bottom Line: Be honest, be respectful, use JobBridge for job-related activities, and we'll all have a great experience!
              </p>
            </div>
          </div>
        )
      };
    } else {
      return {
        title: 'Privacy Policy',
        content: (
          <div className="space-y-6">
            <div className="bg-primary-500/10 p-4 rounded-lg border border-primary-500/20">
              <p className="text-primary-400 font-medium">
                Your privacy matters! This policy explains how we handle your information on JobBridge.
              </p>
            </div>

            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">1. Information We Collect</h3>
              <div className="space-y-3">
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-slate-200 font-medium mb-2">Account Information:</p>
                  <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                    <li>Name and email address</li>
                    <li>Password (encrypted and secure)</li>
                    <li>User type (job seeker or employer)</li>
                  </ul>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-slate-200 font-medium mb-2">Profile Information (Optional):</p>
                  <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                    <li>Profile details and preferences</li>
                    <li>Job applications and postings</li>
                    <li>Company information (for employers)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">2. How We Use Your Information</h3>
              <p className="text-slate-300 mb-2">We use your information to:</p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>Provide our job matching service</li>
                <li>Show relevant jobs and candidates</li>
                <li>Keep your account secure</li>
                <li>Send important updates and notifications</li>
                <li>Provide customer support</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">3. Information Sharing</h3>
              <p className="text-slate-200 font-medium mb-2">We DO NOT sell your personal information.</p>
              <p className="text-slate-300 mb-2">We only share information when:</p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>You apply for a job (your application goes to that employer)</li>
                <li>You post a job (job seekers can see your job posting)</li>
                <li>Required by law (very rare)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">4. Your Privacy Controls</h3>
              <p className="text-slate-300 mb-2">You have full control:</p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>Update or delete your profile anytime</li>
                <li>Control what information to share</li>
                <li>Delete your account and data anytime</li>
                <li>Access all information we have about you</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">5. Data Security</h3>
              <p className="text-slate-300 mb-2">We protect your information with:</p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>Secure session storage (auto-logout when browser closes)</li>
                <li>Encrypted passwords and secure authentication</li>
                <li>Email verification for account security</li>
                <li>Regular security updates and monitoring</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">6. Session Management</h3>
              <p className="text-slate-300 mb-2">For your security:</p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>You're automatically logged out when you close your browser</li>
                <li>No persistent login tokens stored on your device</li>
                <li>Each session starts fresh and secure</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">7. Data Retention</h3>
              <p className="text-slate-300 mb-2">How long we keep your information:</p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>Active accounts: As long as your account exists</li>
                <li>Deleted accounts: 30 days for recovery, then permanently deleted</li>
                <li>Job applications: Until you or the employer deletes them</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">8. Your Rights</h3>
              <p className="text-slate-300 mb-2">You have the right to:</p>
              <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
                <li>Access your information</li>
                <li>Correct any incorrect information</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-3">9. Contact Us About Privacy</h3>
              <p className="text-slate-300">
                Questions about your privacy? Email us at{' '}
                <span className="text-primary-400 font-medium">jobbridge123@gmail.com</span>
              </p>
            </section>

            <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
              <p className="text-green-400 font-medium">
                Our Promise: We're committed to protecting your privacy and being transparent about how we handle your information.
              </p>
            </div>
          </div>
        )
      };
    }
  };

  const { title, content } = getContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-dark-900 rounded-2xl shadow-2xl border border-dark-700/50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700/50">
          <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-invert max-w-none">
            {content}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-dark-700/50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400">
              Last updated: December 13, 2025
            </p>
            <button
              onClick={onClose}
              className="btn-primary px-6 py-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LegalModal;