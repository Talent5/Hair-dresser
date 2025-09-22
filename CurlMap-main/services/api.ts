import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_CONFIG, ERROR_MESSAGES } from '../constants';
import { TokenService } from '../utils/storage';
import { 
  ApiResponse, 
  PaginatedResponse, 
  BookingsResponse,
  User, 
  Stylist, 
  Booking, 
  Payment, 
  Chat, 
  ChatMessage,
  StylistSearchResult,
  StylistSearchResponse,
  SearchFilters,
  LocationCoordinates,
  LoginForm,
  RegisterForm,
  NotificationData
} from '../types';

class ApiService {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'x-platform': Platform.OS,
        'x-app-version': Constants.expoConfig?.version || '1.0.0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await TokenService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await TokenService.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              const token = response.data?.token;
              
              if (token) {
                await TokenService.setToken(token);
                this.processQueue(null, token);
              } else {
                throw new Error('No token in refresh response');
              }
              
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            await this.logout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private handleError(error: AxiosError): Error {
    console.log('API Error Details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      }
    });

    if (error.response) {
      // Server responded with error status
      const message = (error.response.data as any)?.message || ERROR_MESSAGES.GENERIC_ERROR;
      return new Error(message);
    } else if (error.request) {
      // Network error
      console.log('Network error - no response received:', error.request);
      return new Error(ERROR_MESSAGES.NETWORK_ERROR);
    } else {
      // Something else happened
      console.log('Other error:', error.message);
      return new Error(error.message || ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  // Auth endpoints
  async login(credentials: LoginForm): Promise<ApiResponse<{ user: User; stylistProfile?: Stylist; tokens: { accessToken: string; refreshToken: string } }>> {
    const response = await this.client.post('/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterForm): Promise<ApiResponse<{ user: User; stylist?: Stylist; token: string; refreshToken: string }>> {
    const response = await this.client.post('/auth/register', userData);
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string }>> {
    const response = await this.client.post('/auth/refresh', { refreshToken });
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      await TokenService.clearAll();
    }
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/reset-password', { token, password });
    return response.data;
  }

  // User endpoints
  async getProfile(): Promise<ApiResponse<{ user: User; stylist?: Stylist }>> {
    const response = await this.client.get('/users/profile');
    return response.data;
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.client.put('/users/profile', userData);
    return response.data;
  }

  async uploadAvatar(imageUri: string): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);

    const response = await this.client.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Stylist endpoints
  async updateStylistProfile(stylistData: Partial<Stylist>): Promise<ApiResponse<Stylist>> {
    const response = await this.client.put('/stylists/profile', stylistData);
    return response.data;
  }

  async addPortfolioItem(imageUri: string, caption: string, serviceType: string, tags: string[]): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'portfolio.jpg',
    } as any);
    formData.append('caption', caption);
    formData.append('serviceType', serviceType);
    formData.append('tags', JSON.stringify(tags));

    const response = await this.client.post('/stylists/portfolio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async removePortfolioItem(itemId: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/stylists/portfolio/${itemId}`);
    return response.data;
  }

  // Get stylist's own profile
  async getStylistProfile(): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/stylists/my-profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching stylist profile:', error);
      throw error;
    }
  }

  // Get stylist profile by ID
  async getStylistProfileById(stylistId: string): Promise<any> {
    try {
      const response = await this.client.get(`/stylists/${stylistId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stylist profile by ID:', error);
      throw error;
    }
  }

  // Get stylist's own portfolio
  async getStylistPortfolio(): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/stylists/my-profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching stylist portfolio:', error);
      throw error;
    }
  }

  async updateSchedule(schedule: any[]): Promise<ApiResponse<any>> {
    const response = await this.client.put('/stylists/schedule', { schedule });
    return response.data;
  }

  async updateStylistLocation(location: { latitude: number; longitude: number }): Promise<ApiResponse<{ location: { latitude: number; longitude: number }; updatedAt: string }>> {
    const locationData = {
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude]
      }
    };
    const response = await this.client.put('/stylists/update-location', locationData);
    return response.data;
  }

  // Search endpoints
  async searchStylists(
    location: LocationCoordinates,
    filters: SearchFilters
  ): Promise<ApiResponse<StylistSearchResponse>> {
    const params = new URLSearchParams({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      radius: (filters.radius || 5).toString(),
      ...(filters.serviceType && { service: filters.serviceType }),
      ...(filters.rating && { minRating: filters.rating.toString() }),
      ...(filters.priceRange?.max && { maxPrice: filters.priceRange.max.toString() }),
      sortBy: filters.sortBy || 'distance',
      page: '1',
      limit: '20'
    });

    const response = await this.client.get(`/stylists/search?${params}`);
    return response.data;
  }

  async getStylistDetails(stylistId: string): Promise<ApiResponse<Stylist & { user: User }>> {
    const response = await this.client.get(`/stylists/${stylistId}`);
    return response.data;
  }

  // Booking endpoints
  async createBooking(bookingData: any): Promise<ApiResponse<Booking>> {
    const response = await this.client.post('/bookings', bookingData);
    return response.data;
  }

  async getBookings(status?: string): Promise<ApiResponse<BookingsResponse>> {
    console.log('Fetching bookings with status:', status);
    console.log('API Base URL:', this.client.defaults.baseURL);
    const params = status ? { status } : {};
    const response = await this.client.get('/bookings', { params });
    console.log('Get bookings response:', response.data);
    return response.data;
  }

  async getBookingDetails(bookingId: string): Promise<ApiResponse<Booking>> {
    const response = await this.client.get(`/bookings/${bookingId}`);
    return response.data;
  }

  async getBookingById(bookingId: string): Promise<ApiResponse<Booking>> {
    const response = await this.client.get(`/bookings/${bookingId}`);
    return response.data;
  }

  async updateBookingStatus(bookingId: string, status: string, reason?: string): Promise<ApiResponse<Booking>> {
    const response = await this.client.patch(`/bookings/${bookingId}/status`, { status, reason });
    return response.data;
  }

  async cancelBooking(bookingId: string, reason: string): Promise<ApiResponse> {
    const response = await this.client.patch(`/bookings/${bookingId}/cancel`, { reason });
    return response.data;
  }

  async rateBooking(bookingId: string, rating: number, review?: string): Promise<ApiResponse> {
    const response = await this.client.post(`/bookings/${bookingId}/rate`, { rating, review });
    return response.data;
  }

  // Chat endpoints
  async getChats(): Promise<ApiResponse<Chat[]>> {
    const response = await this.client.get('/chat');
    return response.data;
  }

  async createChat(stylistId: string, message?: string): Promise<ApiResponse<Chat>> {
    const response = await this.client.post('/chat/create', { 
      stylistId, 
      message 
    });
    return response.data;
  }

  async getChat(chatId: string): Promise<ApiResponse<Chat>> {
    console.log('API: Getting chat with ID:', chatId);
    const response = await this.client.get(`/chat/${chatId}`);
    console.log('API: Chat response:', response.data);
    return response.data;
  }

  async sendMessage(chatId: string, message: string, messageType = 'text'): Promise<ApiResponse> {
    console.log('API: Sending message:', { chatId, message, messageType });
    const response = await this.client.post(`/chat/${chatId}/message`, { 
      message, 
      messageType 
    });
    console.log('API: Send message response:', response.data);
    return response.data;
  }

  async sendPriceOffer(chatId: string, serviceName: string, price: number, description?: string): Promise<ApiResponse> {
    const response = await this.client.post(`/chat/${chatId}/price-offer`, { 
      serviceName, 
      price, 
      description 
    });
    return response.data;
  }

  async markChatAsRead(chatId: string): Promise<ApiResponse> {
    const response = await this.client.put(`/chat/${chatId}/read`);
    return response.data;
  }

  // Payment endpoints
  async initiatePayment(bookingId: string, amount: number, paymentMethod: string): Promise<ApiResponse<Payment>> {
    const response = await this.client.post('/payments/initiate', {
      bookingId,
      amount,
      paymentMethod,
    });
    return response.data;
  }

  async confirmPayment(paymentId: string, transactionId: string): Promise<ApiResponse<Payment>> {
    const response = await this.client.post(`/payments/${paymentId}/confirm`, {
      transactionId,
    });
    return response.data;
  }

  async getPaymentHistory(): Promise<ApiResponse<Payment[]>> {
    const response = await this.client.get('/payments/history');
    return response.data;
  }

  async requestRefund(paymentId: string, reason: string): Promise<ApiResponse> {
    const response = await this.client.post(`/payments/${paymentId}/refund`, { reason });
    return response.data;
  }

  // Notification endpoints
  async getNotifications(page = 1, limit = 20): Promise<PaginatedResponse<NotificationData>> {
    const response = await this.client.get('/notifications', {
      params: { page, limit },
    });
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse> {
    const response = await this.client.patch(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    const response = await this.client.patch('/notifications/read-all');
    return response.data;
  }

  async updateNotificationSettings(settings: any): Promise<ApiResponse> {
    const response = await this.client.put('/notifications/settings', settings);
    return response.data;
  }

  // Admin endpoints (for admin users)
  async getAdminStats(): Promise<ApiResponse<any>> {
    const response = await this.client.get('/admin/stats');
    return response.data;
  }

  async moderateContent(contentId: string, action: 'approve' | 'reject', reason?: string): Promise<ApiResponse> {
    const response = await this.client.post(`/admin/moderate/${contentId}`, { action, reason });
    return response.data;
  }

  // Request endpoints (live booking system)
  async createRequest(requestData: any): Promise<ApiResponse<any>> {
    console.log('Creating request with data:', requestData);
    console.log('API Base URL:', this.client.defaults.baseURL);
    const response = await this.client.post('/requests', requestData);
    console.log('Create request response:', response.data);
    return response.data;
  }

  async getMyRequests(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/requests/my-requests');
    return response.data;
  }

  async getNearbyRequests(location: { lat: number; lng: number }): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/requests/nearby', {
      params: { lat: location.lat, lng: location.lng },
    });
    return response.data;
  }

  async makeOffer(requestId: string, offerData: any): Promise<ApiResponse<any>> {
    const response = await this.client.post(`/requests/${requestId}/offers`, offerData);
    return response.data;
  }

  async getRequestOffers(requestId: string): Promise<ApiResponse<any[]>> {
    const response = await this.client.get(`/requests/${requestId}/offers`);
    return response.data;
  }

  async acceptOffer(requestId: string, offerId: string): Promise<ApiResponse<any>> {
    const response = await this.client.post(`/requests/${requestId}/offers/${offerId}/accept`);
    return response.data;
  }

  async updateRequestStatus(requestId: string, status: string): Promise<ApiResponse<any>> {
    const response = await this.client.patch(`/requests/${requestId}/status`, { status });
    return response.data;
  }

  // Favorites endpoints
  async getFavorites(): Promise<ApiResponse<any[]>> {
    const response = await this.client.get('/favorites');
    return response.data;
  }

  async addFavorite(stylistId: string, notes?: string): Promise<ApiResponse<any>> {
    const response = await this.client.post('/favorites', { stylistId, notes });
    return response.data;
  }

  async removeFavorite(stylistId: string): Promise<ApiResponse<any>> {
    const response = await this.client.delete(`/favorites/${stylistId}`);
    return response.data;
  }

  async updateFavoriteNote(stylistId: string, notes: string): Promise<ApiResponse<any>> {
    const response = await this.client.patch(`/favorites/${stylistId}/notes`, { notes });
    return response.data;
  }

  async checkIsFavorite(stylistId: string): Promise<ApiResponse<{ isFavorite: boolean }>> {
    const response = await this.client.get(`/favorites/${stylistId}/check`);
    return response.data;
  }

  // Stylist-specific endpoints
  async getStylistStats(): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/stylists/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stylist stats:', error);
      throw error;
    }
  }

  async getStylistEarnings(period: string = 'month'): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get(`/stylists/earnings?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stylist earnings:', error);
      throw error;
    }
  }

  async getStylistTransactions(params: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/stylists/transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching stylist transactions:', error);
      throw error;
    }
  }

  async getStylistBookings(params: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/stylists/bookings', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching stylist bookings:', error);
      throw error;
    }
  }

  // Services Management
  async getStylistServices(): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/stylists/services');
      return response.data;
    } catch (error) {
      console.error('Error fetching stylist services:', error);
      throw error;
    }
  }

  async createStylistService(serviceData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/stylists/services', serviceData);
      return response.data;
    } catch (error) {
      console.error('Error creating stylist service:', error);
      throw error;
    }
  }

  async updateStylistService(serviceId: string, serviceData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.put(`/stylists/services/${serviceId}`, serviceData);
      return response.data;
    } catch (error) {
      console.error('Error updating stylist service:', error);
      throw error;
    }
  }

  async deleteStylistService(serviceId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.delete(`/stylists/services/${serviceId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting stylist service:', error);
      throw error;
    }
  }

  // Availability Settings
  async getStylistAvailability(): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/stylists/availability');
      return response.data;
    } catch (error) {
      console.error('Error fetching stylist availability:', error);
      throw error;
    }
  }

  async updateStylistAvailability(availabilityData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.put('/stylists/availability', availabilityData);
      return response.data;
    } catch (error) {
      console.error('Error updating stylist availability:', error);
      throw error;
    }
  }

  // Payment Settings
  async getStylistPaymentSettings(): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/stylists/payment-settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching stylist payment settings:', error);
      throw error;
    }
  }

  async updateStylistPaymentSettings(paymentData: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.put('/stylists/payment-settings', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error updating stylist payment settings:', error);
      throw error;
    }
  }

  // Ratings
  async submitRating(ratingData: {
    bookingId: string;
    overallRating: number;
    ratingBreakdown?: any;
    review?: any;
    wouldRecommend?: boolean;
    wouldBookAgain?: boolean;
    photos?: any[];
  }): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post('/ratings', ratingData);
      return response.data;
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw error;
    }
  }

  async getStylistRatings(
    stylistId: string,
    params?: {
      page?: number;
      limit?: number;
      sort?: string;
      minRating?: number;
      service?: string;
      verified?: boolean;
    }
  ): Promise<PaginatedResponse<any>> {
    try {
      const response = await this.client.get(`/ratings/stylist/${stylistId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching stylist ratings:', error);
      throw error;
    }
  }

  async getStylistRatingStats(stylistId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get(`/ratings/stylist/${stylistId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stylist rating stats:', error);
      throw error;
    }
  }

  async getCustomerRatings(
    customerId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResponse<any>> {
    try {
      const response = await this.client.get(`/ratings/customer/${customerId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching customer ratings:', error);
      throw error;
    }
  }

  async voteRatingHelpful(ratingId: string, isHelpful: boolean): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post(`/ratings/${ratingId}/helpful`, { isHelpful });
      return response.data;
    } catch (error) {
      console.error('Error voting on rating helpfulness:', error);
      throw error;
    }
  }

  async respondToRating(
    ratingId: string,
    responseData: {
      message: string;
      isPublic?: boolean;
    }
  ): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.post(`/ratings/${ratingId}/respond`, responseData);
      return response.data;
    } catch (error) {
      console.error('Error responding to rating:', error);
      throw error;
    }
  }

  async updateRating(
    ratingId: string,
    updateData: {
      overallRating?: number;
      ratingBreakdown?: any;
      review?: any;
      wouldRecommend?: boolean;
      wouldBookAgain?: boolean;
      photos?: any[];
    }
  ): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.put(`/ratings/${ratingId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating rating:', error);
      throw error;
    }
  }

  async deleteRating(ratingId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.delete(`/ratings/${ratingId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting rating:', error);
      throw error;
    }
  }

  async getRecentRatings(params?: {
    limit?: number;
    service?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get('/ratings/recent', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent ratings:', error);
      throw error;
    }
  }

  async checkBookingRatingStatus(bookingId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get(`/bookings/${bookingId}/rating-status`);
      return response.data;
    } catch (error) {
      console.error('Error checking booking rating status:', error);
      throw error;
    }
  }

  async getRatingById(ratingId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.client.get(`/ratings/${ratingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching rating by ID:', error);
      throw error;
    }
  }

  // Admin: Get all ratings for moderation
  async getAllRatingsForAdmin(): Promise<any[]> {
    try {
      const response = await this.client.get('/admin/ratings');
      return response.data;
    } catch (error) {
      console.error('Error fetching all ratings for admin:', error);
      throw error;
    }
  }

  // Admin: Moderate a rating
  async moderateRating(ratingId: string, moderation: {
    action: 'approve' | 'reject' | 'flag';
    reason: string;
    moderatorId: string;
  }): Promise<any> {
    try {
      const response = await this.client.post(`/admin/ratings/${ratingId}/moderate`, moderation);
      return response.data;
    } catch (error) {
      console.error('Error moderating rating:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;