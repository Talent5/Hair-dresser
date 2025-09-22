import axios from 'axios';

/**
 * Admin API Service for CurlMap Admin Dashboard
 * Handles all API communication with the backend
 */

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('adminRefreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refreshToken }
          );

          const { token } = response.data.data;
          localStorage.setItem('adminToken', token);
          originalRequest.headers.Authorization = `Bearer ${token}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false };
    }
  },

  verifyToken: async () => {
    try {
      const response = await api.get('/auth/me');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Token verification failed'
      };
    }
  },

  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Token refresh failed'
      };
    }
  }
};

// Users API endpoints
export const usersAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch users'
      };
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch user'
      };
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/admin/users/${id}`, data);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update user'
      };
    }
  },

  deactivate: async (id) => {
    try {
      const response = await api.patch(`/admin/users/${id}/deactivate`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to deactivate user'
      };
    }
  }
};

// Stylists API endpoints
export const stylistsAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/admin/stylists', { params });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch stylists'
      };
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/admin/stylists/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch stylist'
      };
    }
  },

  verify: async (id) => {
    try {
      const response = await api.patch(`/admin/stylists/${id}/verify`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify stylist'
      };
    }
  },

  suspend: async (id, reason) => {
    try {
      const response = await api.patch(`/admin/stylists/${id}/suspend`, { reason });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to suspend stylist'
      };
    }
  }
};

// Bookings API endpoints
export const bookingsAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/admin/bookings', { params });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch bookings'
      };
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/admin/bookings/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch booking'
      };
    }
  },

  updateStatus: async (id, status, reason = '') => {
    try {
      const response = await api.patch(`/admin/bookings/${id}/status`, { 
        status, 
        reason 
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update booking status'
      };
    }
  }
};

// Payments API endpoints
export const paymentsAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/admin/payments', { params });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch payments'
      };
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/admin/payments/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch payment'
      };
    }
  },

  processRefund: async (id, amount, reason) => {
    try {
      const response = await api.post(`/admin/payments/${id}/refund`, {
        amount,
        reason
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to process refund'
      };
    }
  }
};

// Analytics API endpoints
export const analyticsAPI = {
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/analytics/dashboard');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch dashboard stats'
      };
    }
  },

  getRevenueStats: async (period = '30d') => {
    try {
      const response = await api.get('/admin/analytics/revenue', {
        params: { period }
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch revenue stats'
      };
    }
  },

  getUserStats: async (period = '30d') => {
    try {
      const response = await api.get('/admin/analytics/users', {
        params: { period }
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch user stats'
      };
    }
  }
};

// Consolidated API service object
export const apiService = {
  // Authentication
  login: authAPI.login,
  logout: authAPI.logout,
  verifyToken: authAPI.verifyToken,
  refreshToken: authAPI.refreshToken,

  // Users
  getUsers: usersAPI.getAll,
  getUser: usersAPI.getById,
  updateUser: usersAPI.update,
  deactivateUser: usersAPI.deactivate,

  // Stylists
  getStylists: stylistsAPI.getAll,
  getStylist: stylistsAPI.getById,
  verifyStylist: stylistsAPI.verify,
  suspendStylist: stylistsAPI.suspend,

  // Bookings
  getBookings: bookingsAPI.getAll,
  getBooking: bookingsAPI.getById,
  updateBookingStatus: bookingsAPI.updateStatus,

  // Payments
  getPayments: paymentsAPI.getAll,
  getPayment: paymentsAPI.getById,
  processRefund: paymentsAPI.processRefund,

  // Analytics
  getAnalytics: analyticsAPI.getDashboardStats,
  getRevenueStats: analyticsAPI.getRevenueStats,
  getUserStats: analyticsAPI.getUserStats
};

export default api;