// API Configuration
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://192.168.1.100:5000/api' // Replace with your local IP
    : 'https://curlmap-api.herokuapp.com/api',
  SOCKET_URL: __DEV__ 
    ? 'http://192.168.1.100:5000' 
    : 'https://curlmap-api.herokuapp.com',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 15,
  SEARCH_RADIUS: 5000, // 5km in meters
  MARKER_COLORS: {
    USER: '#7209B7',
    STYLIST: '#FF6B6B',
    SELECTED: '#4ECDC4',
  },
  ANIMATION_DURATION: 300,
};

// App Colors
export const COLORS = {
  // Primary Colors
  PRIMARY: '#7209B7',
  PRIMARY_LIGHT: '#A855F7',
  PRIMARY_DARK: '#2E073F',
  
  // Secondary Colors
  SECONDARY: '#FF6B6B',
  SECONDARY_LIGHT: '#FF8A8A',
  SECONDARY_DARK: '#E74C3C',
  
  // Accent Colors
  ACCENT: '#4ECDC4',
  ACCENT_LIGHT: '#6FDBDB',
  ACCENT_DARK: '#3BB3AB',
  
  // Neutral Colors
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY_100: '#F5F5F5',
  GRAY_200: '#E5E5E5',
  GRAY_300: '#D4D4D4',
  GRAY_400: '#A3A3A3',
  GRAY_500: '#737373',
  GRAY_600: '#525252',
  GRAY_700: '#404040',
  GRAY_800: '#262626',
  GRAY_900: '#171717',
  
  // Status Colors
  SUCCESS: '#22C55E',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  
  // Background Colors
  BACKGROUND: '#FAFAFA',
  CARD_BACKGROUND: '#FFFFFF',
  MODAL_BACKGROUND: 'rgba(0, 0, 0, 0.5)',
  
  // Text Colors
  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#6B7280',
  TEXT_MUTED: '#9CA3AF',
};

// Font Sizes
export const FONT_SIZES = {
  XS: 12,
  SM: 14,
  MD: 16,
  LG: 18,
  XL: 20,
  XXL: 24,
  XXXL: 32,
  TITLE: 40,
};

// Spacing
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
  XXXL: 64,
};

// Border Radius
export const BORDER_RADIUS = {
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  XXL: 24,
  FULL: 9999,
};

// Animation Durations
export const ANIMATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
};

// Booking Configuration
export const BOOKING_CONFIG = {
  DEPOSIT_PERCENTAGE: 0.1, // 10% deposit
  CANCELLATION_WINDOW: 24, // hours before appointment
  SEARCH_RADIUS_KM: 5,
  MAX_NEGOTIATION_ROUNDS: 5,
  REMINDER_TIMES: [24, 2, 0.5], // hours before appointment
};

// Chat Configuration
export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 500,
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  TYPING_TIMEOUT: 3000, // ms
  MESSAGE_BATCH_SIZE: 20,
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  SOUND: true,
  VIBRATION: true,
  BADGE: true,
  ALERT: true,
};

// Service Types
export const SERVICE_TYPES = [
  'Braids',
  'Weaves',
  'Natural Hair Care',
  'Protective Styles',
  'Hair Color',
  'Hair Cut',
  'Hair Treatment',
  'Styling',
  'Wash & Blow Dry',
  'Extensions',
  'Locs',
  'Perms',
  'Relaxer',
];

// Specialties
export const SPECIALTIES = [
  '4C Hair',
  'Natural Hair',
  'Damaged Hair',
  'Color Specialist',
  'Bridal Hair',
  'Kids Hair',
  'Men\'s Hair',
  'Chemical Processing',
  'Hair Growth',
  'Scalp Treatment',
];

// Payment Methods
export const PAYMENT_METHODS = [
  {
    id: 'ecocash',
    name: 'EcoCash',
    icon: 'smartphone',
    description: 'Pay securely with EcoCash',
  },
  {
    id: 'cash',
    name: 'Cash',
    icon: 'money',
    description: 'Pay cash after service',
  },
];

// Rating Configuration
export const RATING_CONFIG = {
  MAX_STARS: 5,
  MIN_REVIEWS_FOR_DISPLAY: 1,
  EXCELLENT_THRESHOLD: 4.5,
  GOOD_THRESHOLD: 4.0,
  AVERAGE_THRESHOLD: 3.0,
};

// Image Configuration
export const IMAGE_CONFIG = {
  QUALITY: 0.8,
  MAX_WIDTH: 1080,
  MAX_HEIGHT: 1080,
  ASPECT_RATIO: 1,
  FORMATS: ['jpg', 'jpeg', 'png'],
  MAX_SIZE_MB: 5,
};

// Location Configuration
export const LOCATION_CONFIG = {
  ACCURACY: 'high',
  TIMEOUT: 15000,
  MAX_AGE: 60000,
  DISTANCE_FILTER: 10, // meters
};

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PHONE_PATTERN: /^(\+263|0)[0-9]{9}$/, // Zimbabwe phone format
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  BIO_MAX_LENGTH: 500,
  CAPTION_MAX_LENGTH: 200,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  LOCATION_PERMISSION_DENIED: 'Location permission is required to find nearby stylists.',
  CAMERA_PERMISSION_DENIED: 'Camera permission is required to take photos.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  USER_NOT_FOUND: 'User not found.',
  BOOKING_NOT_FOUND: 'Booking not found.',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  BOOKING_CREATED: 'Booking request sent successfully!',
  PAYMENT_SUCCESSFUL: 'Payment completed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PORTFOLIO_UPDATED: 'Portfolio updated successfully!',
  REVIEW_SUBMITTED: 'Review submitted successfully!',
};

// App Configuration
export const APP_CONFIG = {
  VERSION: '1.0.0',
  MIN_SUPPORTED_VERSION: '1.0.0',
  FORCE_UPDATE_VERSION: '1.0.0',
  TERMS_VERSION: '1.0',
  PRIVACY_VERSION: '1.0',
};

// Feature Flags
export const FEATURE_FLAGS = {
  VOICE_MESSAGES: true,
  VIDEO_CALLS: false,
  LIVE_TRACKING: true,
  MULTI_LANGUAGE: false,
  DARK_MODE: true,
  ANALYTICS: true,
};

// Default Values
export const DEFAULTS = {
  AVATAR: 'https://via.placeholder.com/150x150/7209B7/FFFFFF?text=User',
  PORTFOLIO_IMAGE: 'https://via.placeholder.com/300x300/E5E5E5/CCCCCC?text=Portfolio',
  WORK_RADIUS: 10, // km
  RATING: 0,
  EXPERIENCE: 0,
};