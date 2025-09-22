const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const Stylist = require('../models/Stylist');
const { asyncHandler, ValidationError, UnauthorizedError, ConflictError } = require('../middleware/errorHandler');
const { rateLimitAuth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^(\+263|0)[7-9][0-9]{8}$/).required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Password confirmation does not match password'
  }),
  role: Joi.string().valid('customer', 'stylist').default('customer'),
  location: Joi.object({
    type: Joi.string().valid('Point').required(),
    coordinates: Joi.array().items(Joi.number()).length(2).required()
  }).when('role', {
    is: Joi.valid('customer', 'stylist'),
    then: Joi.required()
  }),
  address: Joi.object({
    street: Joi.string().allow(''),
    suburb: Joi.string().allow(''),
    city: Joi.string().default('Harare'),
    country: Joi.string().default('Zimbabwe')
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^(\+263|0)[7-9][0-9]{8}$/),
  password: Joi.string().required()
}).xor('email', 'phone'); // Either email or phone required, not both

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^(\+263|0)[7-9][0-9]{8}$/)
}).xor('email', 'phone');

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

// Helper function to generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', rateLimitAuth, asyncHandler(async (req, res) => {
  console.log('Registration request body:', JSON.stringify(req.body, null, 2));
  
  // Validate request body
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    console.log('Validation error details:', error.details);
    console.log('Validation error messages:', error.details.map(d => d.message));
    throw new ValidationError('Invalid registration data', error.details.map(d => d.message));
  }

  console.log('Validation passed, proceeding with registration...');
  const { name, email, phone, password, role, location, address } = value;
  console.log('Extracted values:', { name, email, phone, role, location, address });

  // Check if user already exists
  console.log('Checking for existing user...');
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });
  
  if (existingUser) {
    console.log('User already exists:', existingUser.email);
    throw new ValidationError('User already exists with this email or phone number');
  }
  
  console.log('No existing user found, creating new user...');

  // Create user
  console.log('Creating user with data:', { name, email, phone, role, location, address });
  const userData = {
    name,
    email,
    phone,
    password,
    role,
    location,
    address: address || {}
  };

  console.log('User data prepared:', userData);
  const user = new User(userData);
  console.log('User model created, saving to database...');
  await user.save();
  console.log('User saved successfully:', user._id);

  // Create stylist profile if user is a stylist
  if (role === 'stylist') {
    const stylistProfile = new Stylist({
      userId: user._id,
      services: [], // Will be populated later
      availability: {
        schedule: [
          // Default Monday to Friday, 9 AM to 5 PM
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true },
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true },
          { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true },
          { dayOfWeek: 6, startTime: '10:00', endTime: '15:00', isAvailable: true },
          { dayOfWeek: 0, startTime: '10:00', endTime: '15:00', isAvailable: false }
        ],
        exceptions: []
      },
      location: {
        isMobile: true,
        mobileRadius: 10
      }
    });

    await stylistProfile.save();
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Remove password from response
  const userResponse = user.toJSON();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    }
  });
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', rateLimitAuth, asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid login data', error.details.map(d => d.message));
  }

  const { email, phone, password } = value;

  // Find user by email or phone
  const query = email ? { email } : { phone };
  const user = await User.findOne(query).select('+password');

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new UnauthorizedError('Account is deactivated. Please contact support.');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Update last seen
  await user.updateLastSeen();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Get stylist profile if user is a stylist
  let stylistProfile = null;
  if (user.role === 'stylist') {
    stylistProfile = await Stylist.findOne({ userId: user._id });
  }

  // Remove password from response
  const userResponse = user.toJSON();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      stylistProfile,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    }
  });
}));

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = refreshTokenSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid refresh token data', error.details.map(d => d.message));
  }

  const { refreshToken } = value;

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    throw error;
  }
}));

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate tokens - would need redis for production)
// @access  Private
router.post('/logout', asyncHandler(async (req, res) => {
  // In a production app, you would add the token to a blacklist in Redis
  // For now, we'll just return success
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email/SMS
// @access  Public
router.post('/forgot-password', rateLimitAuth, asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = forgotPasswordSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid forgot password data', error.details.map(d => d.message));
  }

  const { email, phone } = value;

  // Find user
  const query = email ? { email } : { phone };
  const user = await User.findOne(query);

  if (!user) {
    // Don't reveal if user exists or not
    return res.json({
      success: true,
      message: 'If an account with that email/phone exists, we have sent a password reset link.'
    });
  }

  // Generate reset token
  const resetToken = jwt.sign(
    { userId: user._id, type: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // In production, send email/SMS with reset link
  // For now, we'll just return the token (development only)
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  console.log(`Password reset link for ${email || phone}: ${resetLink}`);

  res.json({
    success: true,
    message: 'If an account with that email/phone exists, we have sent a password reset link.',
    ...(process.env.NODE_ENV === 'development' && {
      resetToken,
      resetLink
    })
  });
}));

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', rateLimitAuth, asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = resetPasswordSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid reset password data', error.details.map(d => d.message));
  }

  const { token, newPassword } = value;

  try {
    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password_reset') {
      throw new UnauthorizedError('Invalid reset token');
    }

    // Find user
    const user = await User.findById(decoded.userId).select('+password');
    if (!user) {
      throw new UnauthorizedError('Invalid reset token');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Invalid or expired reset token');
    }
    throw error;
  }
}));

// @route   GET /api/auth/verify-token
// @desc    Verify if token is valid
// @access  Private
router.get('/verify-token', async (req, res, next) => {
  // Manual auth check for this route since we can't import authMiddleware here
  try {
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: { user }
    });
  } catch (error) {
    res.status(401).json({
      error: 'Access denied',
      message: 'Invalid token'
    });
  }
});

module.exports = router;