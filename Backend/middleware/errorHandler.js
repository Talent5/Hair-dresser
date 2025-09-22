const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      statusCode: 404,
      message,
      error: 'Not Found'
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    error = {
      statusCode: 400,
      message,
      error: 'Duplicate Field Value'
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = {
      statusCode: 400,
      message: messages.join(', '),
      error: 'Validation Error',
      details: messages
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: 'Invalid token',
      error: 'Unauthorized'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: 'Token expired',
      error: 'Unauthorized'
    };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      statusCode: 400,
      message: 'File size too large',
      error: 'File Upload Error'
    };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = {
      statusCode: 400,
      message: 'Too many files uploaded',
      error: 'File Upload Error'
    };
  }

  // Payment processing errors
  if (err.name === 'PaymentError') {
    error = {
      statusCode: 402,
      message: err.message || 'Payment processing failed',
      error: 'Payment Error'
    };
  }

  // External service errors
  if (err.name === 'ServiceUnavailableError') {
    error = {
      statusCode: 503,
      message: err.message || 'External service temporarily unavailable',
      error: 'Service Unavailable'
    };
  }

  // Rate limiting errors
  if (err.status === 429) {
    error = {
      statusCode: 429,
      message: 'Too many requests, please try again later',
      error: 'Rate Limit Exceeded'
    };
  }

  // Database connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    error = {
      statusCode: 503,
      message: 'Database temporarily unavailable',
      error: 'Database Error'
    };
  }

  // Set default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Response format
  const response = {
    success: false,
    error: error.error || 'Server Error',
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: error.details
    }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add request ID if available
  if (req.id) {
    response.requestId = req.id;
  }

  // Don't log expected client errors (4xx) as errors in production
  if (statusCode >= 500 || process.env.NODE_ENV === 'development') {
    console.error('Server Error:', {
      statusCode,
      message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      user: req.user ? { id: req.user._id, role: req.user.role } : null
    });
  }

  res.status(statusCode).json(response);
};

// Handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, error = 'Application Error') {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'Validation Error');
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'Not Found');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 401, 'Unauthorized');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'Forbidden');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'Conflict');
  }
}

class PaymentError extends AppError {
  constructor(message = 'Payment processing failed') {
    super(message, 402, 'Payment Error');
    this.name = 'PaymentError';
  }
}

class ServiceUnavailableError extends AppError {
  constructor(service = 'Service', message) {
    super(message || `${service} is temporarily unavailable`, 503, 'Service Unavailable');
    this.name = 'ServiceUnavailableError';
  }
}

// 404 handler for unmatched routes
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Graceful shutdown handler
const gracefulShutdown = (server) => {
  return (signal) => {
    console.log(`Received ${signal}. Graceful shutdown starting...`);
    
    server.close((err) => {
      if (err) {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('HTTP server closed.');
      
      // Close database connection
      const mongoose = require('mongoose');
      mongoose.connection.close(() => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      });
    });

    // Force close after timeout
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  gracefulShutdown,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  PaymentError,
  ServiceUnavailableError
};