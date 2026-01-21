// Profile view tracking utilities

/**
 * Record a profile view
 * @param {string} profileOwnerId - ID of the profile being viewed
 * @param {string} viewerType - Type of viewer (jobseeker, employer, anonymous)
 * @param {object} options - Additional options
 */
export const recordProfileView = async (
  profileOwnerId,
  viewerType,
  options = {}
) => {
  try {
    const {
      source = "other",
      jobId = null,
      searchQuery = null,
      referrer = null,
    } = options;

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/profile-views`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include auth header if available
          ...(sessionStorage.getItem("jobbridge_token") && {
            Authorization: `Bearer ${sessionStorage.getItem(
              "jobbridge_token"
            )}`,
          }),
        },
        body: JSON.stringify({
          profileOwnerId,
          viewerType,
          source,
          jobId,
          searchQuery,
          referrer: referrer || document.referrer,
        }),
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to record profile view:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get profile view statistics
 * @param {string} userId - User ID to get stats for
 * @param {object} options - Query options
 */
export const getProfileViewStats = async (userId, options = {}) => {
  try {
    const { period = "all", days = 30 } = options;
    const token = sessionStorage.getItem("jobbridge_token");

    if (!token) {
      throw new Error("Authentication required");
    }

    const params = new URLSearchParams();
    if (period !== "all") params.append("period", period);
    if (days !== 30) params.append("days", days.toString());

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/profile-views/stats/${userId}?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get profile view stats:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get recent profile views
 * @param {string} userId - User ID to get views for
 * @param {number} limit - Number of recent views to get
 */
export const getRecentProfileViews = async (userId, limit = 20) => {
  try {
    const token = sessionStorage.getItem("jobbridge_token");

    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }/profile-views/recent/${userId}?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get recent profile views:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get profile view trends
 * @param {string} userId - User ID to get trends for
 * @param {number} days - Number of days to get trends for
 */
export const getProfileViewTrends = async (userId, days = 30) => {
  try {
    const token = sessionStorage.getItem("jobbridge_token");

    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }/profile-views/trends/${userId}?days=${days}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get profile view trends:", error);
    return { success: false, error: error.message };
  }
};
