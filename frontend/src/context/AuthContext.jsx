import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

const getAuthErrorMessage = (error, fallback) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  // Axios has no response when the API process is stopped or its address cannot
  // be reached.  Surface the actual recovery action instead of "fetch failed".
  if (error.request || error.message === 'Network Error' || error.message === 'fetch failed') {
    return 'Cannot reach the API server. Start the backend on http://localhost:5000 and try again.';
  }

  return fallback;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await authService.getCurrentUser();
          if (data && data.success) {
            setUser(data.user);
          } else {
            // Invalid token, clean up
            localStorage.removeItem('token');
            setUser(null);
          }
        } catch (error) {
          console.error('Failed to load current user:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      if (data && data.success) {
        localStorage.setItem('token', data.session.access_token);
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: 'Authentication failed' };
    } catch (error) {
      console.error('Login error:', error);
      const errMsg = getAuthErrorMessage(error, 'Failed to authenticate. Please check your credentials.');
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.register(email, password);
      if (data && data.success) {
        // If registration auto logs in or provides session
        if (data.session?.access_token) {
          localStorage.setItem('token', data.session.access_token);
          setUser(data.user);
        }
        return { success: true, message: 'Account registered successfully!' };
      }
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      const errMsg = getAuthErrorMessage(error, 'Registration failed. Email might already exist.');
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Failed to log out cleanly on backend:', error);
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
