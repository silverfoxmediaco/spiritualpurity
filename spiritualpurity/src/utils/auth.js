// src/utils/auth.js

import API_CONFIG from '../config/api';

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    return false;
  }
  
  try {
    // Parse user to check if it's valid JSON
    JSON.parse(user);
    
    // Decode token to check expiry (without verifying signature)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return false;
    }
    
    const payload = JSON.parse(atob(tokenParts[1]));
    const currentTime = Date.now() / 1000;
    
    // Check if token is expired
    if (payload.exp && payload.exp < currentTime) {
      clearAuth();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    clearAuth();
    return false;
  }
};

/**
 * Get current user
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Get authentication token
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Set authentication data
 * @param {string} token 
 * @param {Object} user 
 */
export const setAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Clear authentication data
 */
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Make authenticated API request
 * @param {string} url 
 * @param {Object} options 
 * @returns {Promise<Response>}
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // If token is invalid or expired, clear auth and redirect
  if (response.status === 401) {
    const data = await response.json();
    if (data.message === 'Invalid token' || data.message === 'Token expired') {
      clearAuth();
      window.location.href = '/login';
    }
  }
  
  return response;
};

/**
 * Refresh authentication token if needed
 * @returns {Promise<boolean>}
 */
export const refreshTokenIfNeeded = async () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    // Check if token will expire soon (within 5 minutes)
    const tokenParts = token.split('.');
    const payload = JSON.parse(atob(tokenParts[1]));
    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = payload.exp - currentTime;
    
    if (timeUntilExpiry < 300) { // 5 minutes
      // Call refresh endpoint
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.token) {
          setAuth(data.data.token, data.data.user);
          return true;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

export default {
  isAuthenticated,
  getCurrentUser,
  getToken,
  setAuth,
  clearAuth,
  authenticatedFetch,
  refreshTokenIfNeeded
};