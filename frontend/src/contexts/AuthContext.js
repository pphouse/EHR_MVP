import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, handleAPIError } from '../services/api';

// Auth state
const initialState = {
  user: null,
  loading: true,
  error: null,
};

// Auth actions
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case AUTH_ACTIONS.SET_USER:
      return { ...state, user: action.payload, loading: false, error: null };
    case AUTH_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case AUTH_ACTIONS.LOGOUT:
      return { ...state, user: null, loading: false, error: null };
    default:
      return state;
  }
};

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify token is still valid
          const response = await authAPI.getCurrentUser();
          dispatch({
            type: AUTH_ACTIONS.SET_USER,
            payload: response.data,
          });
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
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
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: null });

      const response = await authAPI.login(credentials);
      const { access_token } = response.data;

      // Store token
      localStorage.setItem('access_token', access_token);

      // Get user info
      const userResponse = await authAPI.getCurrentUser();
      const user = userResponse.data;

      // Store user
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: AUTH_ACTIONS.SET_USER,
        payload: user,
      });

      return { success: true };
    } catch (error) {
      const errorInfo = handleAPIError(error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorInfo.message,
      });
      return { success: false, error: errorInfo.message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: null });

      await authAPI.register(userData);

      // Auto-login after registration
      const loginResult = await login({
        username: userData.username,
        password: userData.password,
      });

      return loginResult;
    } catch (error) {
      const errorInfo = handleAPIError(error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorInfo.message,
      });
      return { success: false, error: errorInfo.message };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Context value
  const value = {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};