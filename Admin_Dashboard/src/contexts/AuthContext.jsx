import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

/**
 * Admin Authentication Context for CurlMap Admin Dashboard
 * Handles admin login, logout, and authentication state management
 */

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Verify token with backend
      const response = await authAPI.verifyToken();
      if (response.success && response.data.user.role === 'admin') {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        // Invalid token or not admin
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        const { user, token, refreshToken } = response.data;
        
        // Ensure user has admin role
        if (user.role !== 'admin') {
          throw new Error('Access denied. Admin privileges required.');
        }

        // Store tokens
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminRefreshToken', refreshToken);
        
        // Update state
        setUser(user);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state regardless of API call result
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('adminRefreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refreshToken(refreshToken);
      if (response.success) {
        localStorage.setItem('adminToken', response.data.token);
        return response.data.token;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};