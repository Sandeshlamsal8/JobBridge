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
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      
      const response = await fetch(
        `${apiUrl}/users/profile-completion`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setCompletionData(data.data);

        // Show modal for job seekers based on backend shouldShowPrompt
        if (
          user.userType === "jobseeker" &&
          data.data.shouldShowPrompt
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
    if (isAuthenticated && user && user._id) {
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
