import { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI, authUtils } from '../utils/api'

// Initial state
const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
}

// Action types
const AUTH_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGOUT: 'LOGOUT',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR',
    UPDATE_USER: 'UPDATE_USER',
}

// Reducer
const authReducer = (state, action) => {
    switch (action.type) {
        case AUTH_ACTIONS.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload,
            }
        case AUTH_ACTIONS.LOGIN_SUCCESS:
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            }
        case AUTH_ACTIONS.LOGOUT:
            return {
                ...initialState,
                isLoading: false,
            }
        case AUTH_ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                isLoading: false,
            }
        case AUTH_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null,
            }
        case AUTH_ACTIONS.UPDATE_USER:
            return {
                ...state,
                user: { ...state.user, ...action.payload },
            }
        default:
            return state
    }
}

// Create context
const AuthContext = createContext()

// Auth provider component
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState)

    // Check if user is authenticated on app load
    useEffect(() => {
        const initializeAuth = async () => {
            const token = authUtils.getToken()

            if (token) {
                try {
                    const response = await authAPI.getProfile()
                    if (response.success) {
                        dispatch({
                            type: AUTH_ACTIONS.LOGIN_SUCCESS,
                            payload: {
                                user: response.data.user,
                                token,
                            },
                        })
                    } else {
                        // Invalid token, remove it
                        authUtils.removeToken()
                        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
                    }
                } catch (error) {
                    console.error('Auth initialization error:', error)
                    authUtils.removeToken()
                    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
                }
            } else {
                dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
            }
        }

        initializeAuth()
    }, [])

    // Login function
    const login = async (credentials) => {
        try {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
            dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

            const response = await authAPI.login(credentials)

            if (response.success) {
                dispatch({
                    type: AUTH_ACTIONS.LOGIN_SUCCESS,
                    payload: {
                        user: response.data.user,
                        token: response.data.token,
                    },
                })
                return { success: true, data: response.data }
            } else {
                dispatch({
                    type: AUTH_ACTIONS.SET_ERROR,
                    payload: response.message || 'Login failed',
                })
                return { success: false, message: response.message }
            }
        } catch (error) {
            const errorMessage = error.message || 'Login failed'
            dispatch({
                type: AUTH_ACTIONS.SET_ERROR,
                payload: errorMessage,
            })
            return { success: false, message: errorMessage }
        }
    }

    // Signup function
    const signup = async (userData) => {
        try {
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
            dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

            const response = await authAPI.signup(userData)

            if (response.success) {
                dispatch({
                    type: AUTH_ACTIONS.LOGIN_SUCCESS,
                    payload: {
                        user: response.data.user,
                        token: response.data.token,
                    },
                })
                return { success: true, data: response.data }
            } else {
                dispatch({
                    type: AUTH_ACTIONS.SET_ERROR,
                    payload: response.message || 'Signup failed',
                })
                return { success: false, message: response.message, errors: response.errors }
            }
        } catch (error) {
            const errorMessage = error.message || 'Signup failed'
            dispatch({
                type: AUTH_ACTIONS.SET_ERROR,
                payload: errorMessage,
            })
            return { success: false, message: errorMessage }
        }
    }

    // Logout function
    const logout = async () => {
        try {
            await authAPI.logout()
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            dispatch({ type: AUTH_ACTIONS.LOGOUT })
        }
    }

    // Update user profile
    const updateUser = (userData) => {
        dispatch({
            type: AUTH_ACTIONS.UPDATE_USER,
            payload: userData,
        })
    }

    // Clear error
    const clearError = () => {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
    }

    const value = {
        ...state,
        login,
        signup,
        logout,
        updateUser,
        clearError,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext