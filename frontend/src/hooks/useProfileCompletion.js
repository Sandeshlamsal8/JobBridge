import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export const useProfileCompletion = () => {
  const { user, isAuthenticated } = useAuth();
  const [completionData, setCompletionData] = useState(null);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchProfileCompletion = async () => {
    if (!isAuthenticated || !user) return;

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

        // Show modal for job seekers with incomplete profiles
        if (
          user.userType === "jobseeker" &&
          data.data.shouldShowPrompt &&
          data.data.overallPercentage < 50
        ) {
          // Delay showing modal to avoid overwhelming new users
          setTimeout(() => {
            setShouldShowModal(true);
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile completion:", error);
    } finally {
      setLoading(false);
    }
  };

  const dismissModal = () => {
    setShouldShowModal(false);
  };

  const refreshCompletion = () => {
    fetchProfileCompletion();
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfileCompletion();
    }
  }, [isAuthenticated, user]);

  return {
    completionData,
    shouldShowModal,
    loading,
    dismissModal,
    refreshCompletion,
  };
};
