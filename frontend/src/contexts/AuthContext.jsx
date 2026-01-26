import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { showToast } from "../components/ToastContainer";
import { authAPI, authUtils } from "../utils/api";

// Session configuration
const SESSION_CONFIG = {
  TOKEN_REFRESH_INTERVAL: 14 * 60 * 1000, // Refresh token every 14 minutes (before 15min expiry)
  ACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes of inactivity
  SESSION_CHECK_INTERVAL: 60 * 1000, // Check session every minute
};

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  lastActivity: Date.now(),
  sessionExpiry: null,
  avatarUpdateCounter: 0, // Force re-renders when avatar changes
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: "SET_LOADING",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGOUT: "LOGOUT",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  UPDATE_USER: "UPDATE_USER",
  UPDATE_ACTIVITY: "UPDATE_ACTIVITY",
  REFRESH_TOKEN: "REFRESH_TOKEN",
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    case AUTH_ACTIONS.UPDATE_USER:
      const hasAvatarChanged = action.payload.profile?.avatar !== state.user?.profile?.avatar;
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
          // Deep merge profile object if it exists in the payload
          profile: action.payload.profile 
            ? { ...state.user?.profile, ...action.payload.profile }
            : state.user?.profile,
        },
        // Increment counter when avatar changes to force re-renders
        avatarUpdateCounter: hasAvatarChanged 
          ? state.avatarUpdateCounter + 1 
          : state.avatarUpdateCounter,
      };
    case AUTH_ACTIONS.UPDATE_ACTIVITY:
      return {
        ...state,
        lastActivity: Date.now(),
      };
    case AUTH_ACTIONS.REFRESH_TOKEN:
      return {
        ...state,
        token: action.payload.token,
        sessionExpiry: Date.now() + 15 * 60 * 1000,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const refreshTimerRef = useRef(null);
  const activityTimerRef = useRef(null);
  const sessionCheckTimerRef = useRef(null);

  // Track user activity
  const updateActivity = useCallback(() => {
    if (state.isAuthenticated) {
      dispatch({ type: AUTH_ACTIONS.UPDATE_ACTIVITY });
    }
  }, [state.isAuthenticated]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const response = await authAPI.refreshToken();
      if (response.success && response.data.token) {
        dispatch({
          type: AUTH_ACTIONS.REFRESH_TOKEN,
          payload: { token: response.data.token },
        });
        console.log("Token refreshed successfully");
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      // If refresh fails, logout user
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  // Check session validity
  const checkSession = useCallback(() => {
    if (!state.isAuthenticated) return;

    const now = Date.now();
    const timeSinceActivity = now - state.lastActivity;

    // Auto-logout after inactivity
    if (timeSinceActivity > SESSION_CONFIG.ACTIVITY_TIMEOUT) {
      console.log("Session expired due to inactivity");
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      authUtils.removeToken();
    }
  }, [state.isAuthenticated, state.lastActivity]);

  // Setup activity listeners
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [state.isAuthenticated, updateActivity]);

  // Setup token refresh timer
  useEffect(() => {
    if (!state.isAuthenticated) {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      return;
    }

    // Refresh token periodically
    refreshTimerRef.current = setInterval(() => {
      refreshToken();
    }, SESSION_CONFIG.TOKEN_REFRESH_INTERVAL);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [state.isAuthenticated, refreshToken]);

  // Setup session check timer
  useEffect(() => {
    if (!state.isAuthenticated) {
      if (sessionCheckTimerRef.current) {
        clearInterval(sessionCheckTimerRef.current);
      }
      return;
    }

    // Check session validity periodically
    sessionCheckTimerRef.current = setInterval(() => {
      checkSession();
    }, SESSION_CONFIG.SESSION_CHECK_INTERVAL);

    return () => {
      if (sessionCheckTimerRef.current) {
        clearInterval(sessionCheckTimerRef.current);
      }
    };
  }, [state.isAuthenticated, checkSession]);

  // Note: sessionStorage doesn't trigger storage events across tabs
  // This is intentional for better security - each tab has independent session

  // Listen for beforeunload to ensure cleanup on browser close
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear any sensitive data before browser closes
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }
      if (sessionCheckTimerRef.current) {
        clearInterval(sessionCheckTimerRef.current);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Check if user is authenticated on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = authUtils.getToken();

      if (token) {
        try {
          const response = await authAPI.getProfile();
          if (response.success) {
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: {
                user: response.data.user,
                token,
              },
            });
          } else {
            // Invalid token, remove it
            authUtils.removeToken();
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          }
        } catch (error) {
          console.error("Auth initialization error:", error);
          authUtils.removeToken();
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await authAPI.login(credentials);

      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
        return { success: true, data: response.data };
      } else {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: response.message || "Login failed",
        });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.message || "Login failed";
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, message: errorMessage };
    }
  };

  // Signup function (sends PIN, doesn't log in yet)
  const signup = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await authAPI.signup(userData);

      if (response.success) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return {
          success: true,
          data: response.data,
          requiresVerification: true,
        };
      } else {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: response.message || "Signup failed",
        });
        return {
          success: false,
          message: response.message,
          errors: response.errors,
        };
      }
    } catch (error) {
      const errorMessage = error.message || "Signup failed";
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, message: errorMessage };
    }
  };

  // Verify email function (completes registration)
  const verifyEmail = async (verificationData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await authAPI.verifyEmail(verificationData);

      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
        return { success: true, data: response.data };
      } else {
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: response.message || "Verification failed",
        });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.message || "Verification failed";
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, message: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
      showToast("Logged out successfully", "info");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update user profile
  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData,
    });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    signup,
    verifyEmail,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
