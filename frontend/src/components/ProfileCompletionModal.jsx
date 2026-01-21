import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

function ProfileCompletionModal({ isOpen, onClose, onNavigate }) {
  const { user } = useAuth();
  const [completionData, setCompletionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      fetchProfileCompletion();
    }
  }, [isOpen, user]);

  const fetchProfileCompletion = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("jobbridge_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/profile-completion`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setCompletionData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch profile completion:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      const token = sessionStorage.getItem("jobbridge_token");
      await fetch(
        `${import.meta.env.VITE_API_URL}/users/profile-completion/dismiss`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Failed to dismiss prompt:", error);
    }
    onClose();
  };

  const handleCompleteProfile = () => {
    onNavigate("profile-settings");
    onClose();
  };

  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getCompletionBgColor = (percentage) => {
    if (percentage >= 80) return "bg-green-400";
    if (percentage >= 50) return "bg-yellow-400";
    return "bg-red-400";
  };

  const getPriorityIcon = (type) => {
    const icons = {
      urgent: "🚨",
      important: "⚠️",
      suggested: "💡",
      specific: "📝",
    };
    return icons[type] || "📋";
  };

  if (!isOpen || !completionData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">👋</div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">
              Welcome to JobBridge!
            </h2>
            <p className="text-slate-300">
              Let's complete your profile to help you find the perfect job
              opportunities
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Loading profile data...</p>
            </div>
          ) : (
            <>
              {/* Profile Completion Progress */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-100">
                    Profile Completion
                  </h3>
                  <span
                    className={`text-2xl font-bold ${getCompletionColor(
                      completionData.overallPercentage
                    )}`}
                  >
                    {completionData.overallPercentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${getCompletionBgColor(
                      completionData.overallPercentage
                    )}`}
                    style={{ width: `${completionData.overallPercentage}%` }}
                  ></div>
                </div>

                {/* Section Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {Object.entries(completionData.sectionScores).map(
                    ([sectionName, score]) => (
                      <div
                        key={sectionName}
                        className="glass-card p-4 rounded-xl"
                      >
                        <h4 className="font-medium text-slate-200 mb-2 capitalize">
                          {sectionName.replace(/([A-Z])/g, " $1").trim()}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">
                            {score.completed}/{score.total} fields
                          </span>
                          <span
                            className={`font-bold ${getCompletionColor(
                              score.percentage
                            )}`}
                          >
                            {score.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full ${getCompletionBgColor(
                              score.percentage
                            )}`}
                            style={{ width: `${score.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Recommendations */}
              {completionData.recommendations &&
                completionData.recommendations.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4">
                      Recommended Next Steps
                    </h3>
                    <div className="space-y-3">
                      {completionData.recommendations
                        .slice(0, 3)
                        .map((rec, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-4 bg-slate-700/30 rounded-xl"
                          >
                            <div className="text-2xl">
                              {getPriorityIcon(rec.type)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-200 mb-1">
                                {rec.title}
                              </h4>
                              <p className="text-sm text-slate-400 mb-2">
                                {rec.description}
                              </p>
                              <span className="text-xs text-primary-400 font-medium">
                                {rec.action}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Benefits of Completing Profile */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">
                  Why Complete Your Profile?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      icon: "🎯",
                      title: "Better Job Matches",
                      description:
                        "Get personalized job recommendations based on your skills and preferences",
                    },
                    {
                      icon: "👀",
                      title: "Increased Visibility",
                      description:
                        "Employers can find and contact you directly for relevant opportunities",
                    },
                    {
                      icon: "⚡",
                      title: "Faster Applications",
                      description:
                        "Pre-filled application forms save time when applying to jobs",
                    },
                    {
                      icon: "📈",
                      title: "Career Insights",
                      description:
                        "Track your application progress and get career development tips",
                    },
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="text-2xl">{benefit.icon}</div>
                      <div>
                        <h4 className="font-medium text-slate-200 mb-1">
                          {benefit.title}
                        </h4>
                        <p className="text-sm text-slate-400">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleCompleteProfile}
                  className="flex-1 btn-primary py-3 text-lg font-semibold"
                >
                  Complete My Profile
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-6 py-3 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700/50 transition-colors text-lg"
                >
                  Maybe Later
                </button>
              </div>

              {/* Skip Option */}
              <div className="text-center mt-4">
                <button
                  onClick={handleDismiss}
                  className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
                >
                  Don't show this again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileCompletionModal;
