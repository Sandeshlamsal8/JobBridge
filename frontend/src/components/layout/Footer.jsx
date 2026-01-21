import { useState } from "react";
import LegalModal from "../LegalModal";

function Footer({ user, onNavigate }) {
  const [legalModal, setLegalModal] = useState({ isOpen: false, type: null });

  const handleContactClick = () => {
    if (onNavigate) {
      onNavigate("contact");
    }
  };

  // Minimized footer for authenticated users
  if (user) {
    return (
      <footer className="bg-dark-950 text-slate-100 py-6 relative overflow-hidden border-t border-dark-700/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold gradient-text">JobBridge</span>
              <span className="text-slate-500 hidden sm:inline">|</span>
              <p className="text-slate-400 text-sm">
                &copy; 2025 All rights reserved.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-slate-400">
              <button
                onClick={() => setLegalModal({ isOpen: true, type: "privacy" })}
                className="hover:text-primary-400 transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setLegalModal({ isOpen: true, type: "terms" })}
                className="hover:text-primary-400 transition-colors"
              >
                Terms of Service
              </button>
              <button
                onClick={handleContactClick}
                className="hover:text-primary-400 transition-colors"
              >
                Contact
              </button>
              <a href="#" className="hover:text-primary-400 transition-colors">
                Help Center
              </a>
            </div>
          </div>
        </div>

        {/* Legal Modal */}
        <LegalModal
          isOpen={legalModal.isOpen}
          onClose={() => setLegalModal({ isOpen: false, type: null })}
          type={legalModal.type}
        />
      </footer>
    );
  }

  // Full footer for unauthenticated users
  return (
    <footer className="bg-dark-950 text-slate-100 py-12 lg:py-16 relative overflow-hidden border-t border-dark-700/30">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Company Info */}
        <div className="text-center mb-10">
          <h3 className="text-2xl lg:text-3xl font-bold mb-4 gradient-text">
            JobBridge
          </h3>
          <p className="text-slate-300 max-w-2xl mx-auto text-base lg:text-lg leading-relaxed">
            Bridging the gap between talented professionals and amazing
            opportunities. Your career journey starts here.
          </p>
        </div>

        {/* Bottom section */}
        <div className="border-t border-dark-700/50 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm lg:text-base">
              &copy; 2025 JobBridge. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm lg:text-base text-slate-400">
              <button
                onClick={() => setLegalModal({ isOpen: true, type: "privacy" })}
                className="hover:text-primary-400 transition-colors font-medium"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setLegalModal({ isOpen: true, type: "terms" })}
                className="hover:text-primary-400 transition-colors font-medium"
              >
                Terms of Service
              </button>
              <button
                onClick={handleContactClick}
                className="hover:text-primary-400 transition-colors font-medium"
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Modal */}
      <LegalModal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal({ isOpen: false, type: null })}
        type={legalModal.type}
      />
    </footer>
  );
}

export default Footer;
