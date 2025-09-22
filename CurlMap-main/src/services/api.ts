import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG, ERROR_MESSAGES } from '../constants';
import { TokenService } from '../utils/storage';
import { 
  ApiResponse, 
  PaginatedResponse, 
  User, 
  Stylist, 
  Booking, 
  Payment, 
  Chat, 
  ChatMessage,
  StylistSearchResult,
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
              const { token } = response.data;
              
              await TokenService.setToken(token);
              
              this.processQueue(null, token);
              
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
    if (error.response) {
      // Server responded with error status
      const message = (error.response.data as any)?.message || ERROR_MESSAGES.GENERIC_ERROR;
      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error(ERROR_MESSAGES.NETWORK_ERROR);
    } else {
      // Something else happened
      return new Error(error.message || ERROR_MESSAGES.GENERIC_ERROR);
    }
  }

  // Auth endpoints
  async login(credentials: LoginForm): Promise<ApiResponse<{ user: User; stylist?: Stylist; token: string; refreshToken: string }>> {
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

  async updateSchedule(schedule: any[]): Promise<ApiResponse<any>> {
    const response = await this.client.put('/stylists/schedule', { schedule });
    return response.data;
  }

  // Search endpoints
  async searchStylists(
    location: LocationCoordinates,
    filters: SearchFilters
  ): Promise<ApiResponse<StylistSearchResult[]>> {
    const response = await this.client.post('/search/stylists', {
      location,
      filters,
    });
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

  async getBookings(status?: string): Promise<ApiResponse<Booking[]>> {
    const params = status ? { status } : {};
    const response = await this.client.get('/bookings', { params });
    return response.data;
  }

  async getBookingDetails(bookingId: string): Promise<ApiResponse<Booking>> {
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
    const response = await this.client.get('/chats');
    return response.data;
  }

  async getChatMessages(chatId: string, page = 1, limit = 20): Promise<PaginatedResponse<ChatMessage>> {
    const response = await this.client.get(`/chats/${chatId}/messages`, {
      params: { page, limit },
    });
    return response.data;
  }

  async sendMessage(chatId: string, message: any): Promise<ApiResponse<ChatMessage>> {
    const response = await this.client.post(`/chats/${chatId}/messages`, message);
    return response.data;
  }

  async markMessagesAsRead(chatId: string): Promise<ApiResponse> {
    const response = await this.client.patch(`/chats/${chatId}/read`);
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
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;