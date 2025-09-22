// Core User Types
export interface User {
  _id: string;
  role: 'customer' | 'stylist' | 'admin';
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
  };
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Stylist-specific data
export interface Stylist {
  _id: string;
  userId: string;
  user?: User;
  portfolio: PortfolioItem[];
  schedule: ScheduleItem[];
  basePrices: ServicePrice[];
  rating: number;
  reviewCount: number;
  specialties: string[];
  bio: string;
  experience: number; // years
  isAvailable: boolean;
  workingRadius: number; // km
  completedBookings: number;
}

export interface PortfolioItem {
  _id: string;
  imageUrl: string;
  caption: string;
  serviceType: string;
  tags: string[];
  createdAt: string;
}

export interface ServicePrice {
  serviceName: string;
  basePrice: number;
  duration: number; // minutes
  description: string;
}

export interface ScheduleItem {
  dayOfWeek: number; // 0-6 (Sunday to Saturday)
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  isAvailable: boolean;
}

// Booking Types
export interface Booking {
  _id: string;
  customerId: string;
  stylistId: string;
  customer?: User;
  stylist?: Stylist;
  service: BookingService;
  negotiatedPrice: number;
  depositAmount: number;
  status: BookingStatus;
  appointmentTime: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
  paymentId?: string;
  payment?: Payment;
  chatId?: string;
  notes?: string;
  cancellationReason?: string;
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingService {
  name: string;
  description: string;
  estimatedDuration: number;
  originalPrice: number;
}

export type BookingStatus = 
  | 'pending' 
  | 'accepted' 
  | 'rejected' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

// Payment Types
export interface Payment {
  _id: string;
  bookingId: string;
  amount: number;
  depositAmount: number;
  status: PaymentStatus;
  ecocashTxnId?: string;
  paymentMethod: 'ecocash' | 'cash';
  transactionFee: number;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 
  | 'pending' 
  | 'held' 
  | 'released' 
  | 'refunded' 
  | 'failed' 
  | 'cancelled';

// Chat Types
export interface Chat {
  _id: string;
  bookingId?: string;
  participants: string[]; // user IDs
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  senderId: string;
  text: string;
  messageType: 'text' | 'image' | 'price_offer' | 'booking_request' | 'system';
  metadata?: {
    priceOffer?: number;
    serviceName?: string;
    imageUrl?: string;
  };
  isRead: boolean;
  timestamp: string;
}

// Location & Search Types
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface SearchFilters {
  radius: number; // km
  serviceType?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  availability?: 'now' | 'today' | 'week';
  sortBy?: 'distance' | 'rating' | 'price' | 'reviews';
}

export interface StylistSearchResult extends Stylist {
  distance: number; // km from user
  isOnline: boolean;
  nextAvailableSlot?: string;
}

// Notification Types
export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  userId: string;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType = 
  | 'booking_request' 
  | 'booking_accepted' 
  | 'booking_rejected' 
  | 'payment_received' 
  | 'chat_message' 
  | 'reminder' 
  | 'rating_request'
  | 'promotion';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Navigation Types
export interface RootStackParamList {
  Login: undefined;
  Register: { role: 'customer' | 'stylist' };
  Home: undefined;
  Search: { 
    filters?: SearchFilters; 
    location?: LocationCoordinates; 
  };
  StylistProfile: { stylistId: string };
  Chat: { chatId: string; bookingId?: string };
  Booking: { bookingId: string };
  Payment: { bookingId: string; amount: number };
  Profile: undefined;
  Portfolio: { stylistId?: string; editable?: boolean };
  Schedule: undefined;
  Notifications: undefined;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'customer' | 'stylist';
  location?: LocationCoordinates;
}

export interface ProfileUpdateForm {
  name?: string;
  phone?: string;
  bio?: string;
  specialties?: string[];
  workingRadius?: number;
  basePrices?: ServicePrice[];
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Redux State Types
export interface AuthState {
  user: User | null;
  stylist: Stylist | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface LocationState {
  userLocation: LocationCoordinates | null;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  isLoading: boolean;
  error: string | null;
}

export interface BookingsState {
  bookings: Booking[];
  currentBooking: Booking | null;
  isLoading: boolean;
  error: string | null;
}

export interface ChatsState {
  chats: Chat[];
  currentChat: Chat | null;
  isLoading: boolean;
  error: string | null;
}

export interface NotificationsState {
  notifications: NotificationData[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}