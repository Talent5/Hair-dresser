const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token - user not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Account is deactivated'
      });
    }

    // Update last seen
    user.updateLastSeen();

    // Add user to request object
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Authentication failed'
    });
  }
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Admin only middleware
const requireAdmin = requireRole('admin');

// Stylist or admin middleware
const requireStylistOrAdmin = requireRole(['stylist', 'admin']);

// Customer or admin middleware  
const requireCustomerOrAdmin = requireRole(['customer', 'admin']);

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;
        user.updateLastSeen();
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Middleware to check if user owns resource or is admin
const requireOwnershipOrAdmin = (resourceUserField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserField] || req.body[resourceUserField];
    
    if (!resourceUserId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Resource user ID not provided'
      });
    }

    if (req.user._id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
    }

    next();
  };
};

// Middleware to validate booking access
const requireBookingAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    const bookingId = req.params.bookingId || req.params.id;
    
    if (!bookingId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Booking ID required'
      });
    }

    const Booking = require('../models/Booking');
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Booking not found'
      });
    }

    // Admin can access all bookings
    if (req.user.role === 'admin') {
      req.booking = booking;
      return next();
    }

    // Check if user is customer or stylist in this booking
    const isCustomer = booking.customerId.toString() === req.user._id.toString();
    const isStylist = booking.stylistId.toString() === req.user._id.toString();

    if (!isCustomer && !isStylist) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own bookings'
      });
    }

    req.booking = booking;
    req.isCustomer = isCustomer;
    req.isStylist = isStylist;
    
    next();
  } catch (error) {
    console.error('Booking access middleware error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to validate booking access'
    });
  }
};

// Rate limiting middleware for sensitive operations
const rateLimitSensitive = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for sensitive operations
  message: {
    error: 'Too many requests',
    message: 'Too many sensitive operations, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for authentication endpoints
const rateLimitAuth = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 10, // limit each IP to 10 login attempts per windowMs
  message: {
    error: 'Too many login attempts',
    message: 'Too many login attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authMiddleware,
  requireRole,
  requireAdmin,
  requireStylistOrAdmin,
  requireCustomerOrAdmin,
  optionalAuth,
  requireOwnershipOrAdmin,
  requireBookingAccess,
  rateLimitSensitive,
  rateLimitAuth
};