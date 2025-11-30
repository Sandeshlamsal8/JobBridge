const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("jobbridge_token");
};

// Helper function to set auth token in localStorage
const setAuthToken = (token) => {
  localStorage.setItem("jobbridge_token", token);
};

// Helper function to remove auth token from localStorage
const removeAuthToken = () => {
  localStorage.removeItem("jobbridge_token");
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401 && data.code === "TOKEN_EXPIRED") {
        removeAuthToken();
        window.location.href = "/login";
        throw new Error("Session expired. Please login again.");
      }

      throw new Error(data.message || "An error occurred");
    }

    return data;
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  // Register new user
  signup: async (userData) => {
    const response = await apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  // Login user
  login: async (credentials) => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  // Logout user
  logout: async () => {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      removeAuthToken();
    }
  },

  // Get current user profile
  getProfile: async () => {
    return await apiRequest("/auth/me");
  },

  // Refresh token
  refreshToken: async () => {
    const response = await apiRequest("/auth/refresh", {
      method: "POST",
    });

    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },
};

// User API functions
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    return await apiRequest("/users/profile");
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return await apiRequest("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },

  // Change password
  changePassword: async (passwordData) => {
    return await apiRequest("/users/change-password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });
  },

  // Deactivate account
  deactivateAccount: async () => {
    return await apiRequest("/users/account", {
      method: "DELETE",
    });
  },
};

// Job API functions
export const jobAPI = {
  // Get all jobs with filters
  getJobs: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    return await apiRequest(`/jobs?${queryParams}`);
  },

  // Get single job
  getJob: async (jobId) => {
    return await apiRequest(`/jobs/${jobId}`);
  },

  // Create job (employer only)
  createJob: async (jobData) => {
    return await apiRequest("/jobs", {
      method: "POST",
      body: JSON.stringify(jobData),
    });
  },

  // Update job (employer only)
  updateJob: async (jobId, jobData) => {
    return await apiRequest(`/jobs/${jobId}`, {
      method: "PUT",
      body: JSON.stringify(jobData),
    });
  },

  // Delete job (employer only)
  deleteJob: async (jobId) => {
    return await apiRequest(`/jobs/${jobId}`, {
      method: "DELETE",
    });
  },

  // Get employer's jobs
  getMyJobs: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    return await apiRequest(`/jobs/employer/my-jobs?${queryParams}`);
  },
};

// Application API functions
export const applicationAPI = {
  // Apply for a job
  apply: async (applicationData) => {
    return await apiRequest("/applications", {
      method: "POST",
      body: JSON.stringify(applicationData),
    });
  },

  // Get job seeker's applications
  getMyApplications: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    return await apiRequest(`/applications/my-applications?${queryParams}`);
  },

  // Get employer's received applications
  getReceivedApplications: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    return await apiRequest(`/applications/employer/received?${queryParams}`);
  },

  // Get single application
  getApplication: async (applicationId) => {
    return await apiRequest(`/applications/${applicationId}`);
  },

  // Update application status (employer only)
  updateStatus: async (applicationId, statusData) => {
    return await apiRequest(`/applications/${applicationId}/status`, {
      method: "PUT",
      body: JSON.stringify(statusData),
    });
  },

  // Withdraw application (job seeker only)
  withdraw: async (applicationId) => {
    return await apiRequest(`/applications/${applicationId}/withdraw`, {
      method: "PUT",
    });
  },

  // Get application stats (employer only)
  getStats: async () => {
    return await apiRequest("/applications/stats/employer");
  },
};

// Utility functions
export const authUtils = {
  isAuthenticated: () => {
    return !!getAuthToken();
  },

  getToken: getAuthToken,
  setToken: setAuthToken,
  removeToken: removeAuthToken,

  // Get user data from token (basic decode - not secure, just for UI)
  getUserFromToken: () => {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  },
};

export default {
  authAPI,
  userAPI,
  jobAPI,
  applicationAPI,
  authUtils,
};
