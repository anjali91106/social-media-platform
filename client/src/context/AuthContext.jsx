import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_TOKENS: 'SET_TOKENS',
  REFRESH_TOKEN_SUCCESS: 'REFRESH_TOKEN_SUCCESS',
  REFRESH_TOKEN_FAILURE: 'REFRESH_TOKEN_FAILURE',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.LOAD_USER_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
        accessToken: action.payload.accessToken || state.accessToken,
        refreshToken: action.payload.refreshToken || state.refreshToken,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
        accessToken: null,
        refreshToken: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        accessToken: null,
        refreshToken: null,
      };

    case AUTH_ACTIONS.SET_TOKENS:
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
      };

    case AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS:
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        loading: false,
      };

    case AUTH_ACTIONS.REFRESH_TOKEN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
        accessToken: null,
        refreshToken: null,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: 'No token found' });
        return;
      }

      try {
        // Fetch current user data from backend
        const response = await authAPI.getCurrentUser();
        const user = response.data.data;
        
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_SUCCESS, payload: { user } });
      } catch (error) {
        console.error('Failed to load user:', error);
        // Clear tokens on any authentication error
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: 'Session expired' });
      }
    };

    loadUser();
  }, []);

  // Login action
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await authAPI.login(credentials);
      const { user, accessToken, refreshToken } = response.data.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { user, accessToken, refreshToken } });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Register action
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const response = await authAPI.register(userData);
      const { user, accessToken, refreshToken } = response.data.data;

      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      dispatch({ type: AUTH_ACTIONS.REGISTER_SUCCESS, payload: { user, accessToken, refreshToken } });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Logout action
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Refresh token action
  const refreshToken = async () => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (!refreshTokenValue) {
      dispatch({ type: AUTH_ACTIONS.REFRESH_TOKEN_FAILURE, payload: 'No refresh token' });
      return false;
    }

    try {
      const response = await authAPI.refreshToken(refreshTokenValue);
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      dispatch({ type: AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS, payload: { accessToken, refreshToken: newRefreshToken } });
      return true;
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: AUTH_ACTIONS.REFRESH_TOKEN_FAILURE, payload: error.message });
      return false;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    dispatch,
    login,
    register,
    logout,
    refreshToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
