const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const User = require('../models/User');
const Stylist = require('../models/Stylist');
const Booking = require('../models/Booking');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { authMiddleware: auth } = require('../middleware/auth');

const router = express.Router();

// Helper function to convert MongoDB ObjectIds to strings recursively
const convertObjectIdsToStrings = (obj) => {
  if (!obj) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(convertObjectIdsToStrings);
  }
  
  if (typeof obj === 'object') {
    // Handle MongoDB export format with $oid
    if (obj.$oid) {
      return obj.$oid;
    }
    
    // Handle regular ObjectId
    if (obj.toString && typeof obj.toString === 'function' && obj.toString().match(/^[0-9a-fA-F]{24}$/)) {
      return obj.toString();
    }
    
    // Recursively process object properties
    const result = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = convertObjectIdsToStrings(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
};

// Helper function to get or create stylist profile
const getOrCreateStylistProfile = async (userId) => {
  let stylist = await Stylist.findOne({ userId });
  
  if (!stylist) {
    // Create a new stylist profile if it doesn't exist
    stylist = new Stylist({
      userId,
      businessName: '',
      bio: '',
      specialties: [],
      experience: { years: 0, description: '' },
      services: [],
      portfolio: [],
      location: {
        isHomeBased: false,
        isMobile: true,
        mobileRadius: 10,
        additionalFee: 0
      },
      availability: {
        schedule: [],
        exceptions: [],
        advanceBookingDays: 30
      },
      settings: {
        autoAcceptBookings: false,
        requireDeposit: true,
        cancellationPolicy: {
          hoursBeforeBooking: 24,
          refundPercentage: 50
        }
      },
      isActive: true
    });
    
    await stylist.save();
  }
  
  return stylist;
};

// Helper function to add avatar initials to user object
const addAvatarInitials = (userObj) => {
  if (!userObj) return userObj;
  
  const user = userObj.toObject ? userObj.toObject() : userObj;
  
  if (user.name) {
    const nameParts = user.name.split(' ');
    if (nameParts.length >= 2) {
      user.avatar = nameParts[0].charAt(0).toUpperCase() + nameParts[1].charAt(0).toUpperCase();
    } else {
      user.avatar = user.name.substring(0, 2).toUpperCase();
    }
  } else {
    user.avatar = 'U';
  }
  
  return user;
};

// Helper function to ensure avatar exists in any user object
const ensureAvatarExists = (obj) => {
  if (!obj) return obj;
  
  // Handle single user object
  if (obj.userId && typeof obj.userId === 'object') {
    if (!obj.userId.avatar) {
      obj.userId = addAvatarInitials(obj.userId);
    }
  }
  
  // Handle user field directly
  if (obj.user && typeof obj.user === 'object') {
    if (!obj.user.avatar) {
      obj.user = addAvatarInitials(obj.user);
    }
  }
  
  // Handle arrays of stylists
  if (Array.isArray(obj)) {
    obj.forEach(item => ensureAvatarExists(item));
  }
  
  // Handle data.stylists arrays
  if (obj.data && Array.isArray(obj.data.stylists)) {
    obj.data.stylists.forEach(stylist => ensureAvatarExists(stylist));
  }
  
  return obj;
};

// Optional auth middleware - adds user context if token exists, but doesn't fail if not
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (token) {
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      
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

// Apply optional auth to all routes
router.use(optionalAuth);

// Validation schemas
const searchStylistsSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
  radius: Joi.number().min(0).max(50).default(5), // Allow 0 for "All stylists"
  service: Joi.string().valid(
    'braids', 'weaves', 'natural_hair', 'relaxed_hair', 'cuts', 
    'color', 'locs', 'extensions', 'treatments', 'styling', 
    'children_hair', 'men_cuts', 'beard_grooming'
  ),
  minRating: Joi.number().min(0).max(5).default(0),
  maxPrice: Joi.number().min(0),
  isVerified: Joi.boolean(),
  sortBy: Joi.string().valid('distance', 'rating', 'price', 'experience').default('distance'),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(20)
}).or('latitude', 'lat').or('longitude', 'lng');

const updateStylistProfileSchema = Joi.object({
  businessName: Joi.string().max(100),
  bio: Joi.string().max(500),
  specialties: Joi.array().items(Joi.string().valid(
    'braids', 'weaves', 'natural_hair', 'relaxed_hair', 'cuts', 
    'color', 'locs', 'extensions', 'treatments', 'styling', 
    'children_hair', 'men_cuts', 'beard_grooming'
  )),
  experience: Joi.object({
    years: Joi.number().min(0).max(50),
    description: Joi.string().allow('')
  }),
  location: Joi.object({
    isHomeBased: Joi.boolean(),
    isMobile: Joi.boolean(),
    homeStudio: Joi.object({
      address: Joi.string(),
      description: Joi.string(),
      amenities: Joi.array().items(Joi.string())
    }),
    mobileRadius: Joi.number().min(1).max(50),
    additionalFee: Joi.number().min(0)
  }),
  availability: Joi.object({
    schedule: Joi.array().items(Joi.object({
      dayOfWeek: Joi.number().min(0).max(6).required(),
      startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      isAvailable: Joi.boolean().default(true)
    })),
    advanceBookingDays: Joi.number().min(1).max(90)
  }),
  settings: Joi.object({
    autoAcceptBookings: Joi.boolean(),
    requireDeposit: Joi.boolean(),
    cancellationPolicy: Joi.object({
      hoursBeforeBooking: Joi.number().min(1).max(168),
      refundPercentage: Joi.number().min(0).max(100)
    })
  })
});

const addServiceSchema = Joi.object({
  name: Joi.string().required(),
  category: Joi.string().valid(
    'braids', 'weaves', 'natural_hair', 'relaxed_hair', 'cuts', 
    'color', 'locs', 'extensions', 'treatments', 'styling', 
    'children_hair', 'men_cuts', 'beard_grooming',
    'Haircuts & Styling', 'Hair Extensions', 'Hair Treatments', 'Hair Coloring'
  ).required(),
  price: Joi.number().min(0).required(),
  duration: Joi.number().min(15).required(),
  description: Joi.string().allow(''),
  isActive: Joi.boolean().default(true),
  // Accept legacy basePrice format for backward compatibility
  basePrice: Joi.object({
    amount: Joi.number().min(0).required(),
    currency: Joi.string().default('USD')
  }).optional()
}).custom((value, helpers) => {
  // Transform price to basePrice format
  if (value.price !== undefined) {
    value.basePrice = {
      amount: value.price,
      currency: 'USD'
    };
    // Keep price field for now but basePrice will be used in the model
  }
  return value;
});

// @route   GET /api/stylists/search
// @desc    Search for stylists by location and filters
// @access  Public (with optional auth for personalized results)
router.get('/search', asyncHandler(async (req, res) => {
  // Validate query parameters
  const { error, value } = searchStylistsSchema.validate(req.query);
  if (error) {
    throw new ValidationError('Invalid search parameters', error.details.map(d => d.message));
  }

  const { 
    latitude, 
    longitude, 
    lat,
    lng,
    radius, 
    service, 
    minRating, 
    maxPrice, 
    isVerified, 
    sortBy, 
    page, 
    limit 
  } = value;
  
  // Handle both parameter formats
  const finalLatitude = latitude || lat;
  const finalLongitude = longitude || lng;

  // Convert radius from kilometers to meters
  const radiusInMeters = radius * 1000;

  // Build aggregation pipeline
  const pipeline = [
    // Join with user data
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true
      }
    }
  ];

  // Add avatar field to user for compatibility, using name initials
  pipeline.push(
    {
      $addFields: { 
        'user.avatar': {
          $cond: {
            if: { $and: [{ $ne: ['$user', null] }, { $ne: ['$user.name', null] }] },
            then: {
              $let: {
                vars: {
                  nameParts: { $split: ['$user.name', ' '] }
                },
                in: {
                  $cond: {
                    if: { $gte: [{ $size: '$$nameParts' }, 2] },
                    then: {
                      $concat: [
                        { $toUpper: { $substr: [{ $arrayElemAt: ['$$nameParts', 0] }, 0, 1] } },
                        { $toUpper: { $substr: [{ $arrayElemAt: ['$$nameParts', 1] }, 0, 1] } }
                      ]
                    },
                    else: {
                      $cond: {
                        if: { $ne: ['$user.name', null] },
                        then: { $toUpper: { $substr: ['$user.name', 0, 2] } },
                        else: 'U'
                      }
                    }
                  }
                }
              }
            },
            else: 'U'
          }
        }
      }
    }
  );

  // Filter out stylists without valid user data
  pipeline.push({
    $match: {
      'user': { $ne: null },
      'user.name': { $ne: null },
      'user.isActive': true,
      'isActive': true
    }
  });

  // Add location filter only if radius > 0 (radius = 0 means "All stylists")
  if (radius > 0) {
    pipeline.push(
      // Filter by location using $geoWithin
      {
        $match: {
          'user.location': {
            $geoWithin: {
              $centerSphere: [
                [finalLongitude, finalLatitude],
                radius / 6378.1 // Convert km to radians (Earth's radius in km)
              ]
            }
          }
        }
      }
    );
  }

  // Distance calculation follows here
  // Add distance calculation
  pipeline.push({
    $addFields: {
      distance: {
        $divide: [
          {
            $sqrt: {
              $add: [
                {
                  $pow: [
                    {
                      $multiply: [
                        { $subtract: [{ $arrayElemAt: ['$user.location.coordinates', 0] }, finalLongitude] },
                        111.32 // Approximate km per degree longitude
                      ]
                    },
                    2
                  ]
                },
                {
                  $pow: [
                    {
                      $multiply: [
                        { $subtract: [{ $arrayElemAt: ['$user.location.coordinates', 1] }, finalLatitude] },
                        110.54 // Approximate km per degree latitude
                      ]
                    },
                    2
                  ]
                }
              ]
            }
          },
          1
        ]
      }
    }
  });

  // Add service filter
  if (service) {
    pipeline.push({
      $match: {
        'services.category': service
      }
    });
  }

  // Add rating filter
  if (minRating > 0) {
    pipeline.push({
      $match: {
        'rating.average': { $gte: minRating }
      }
    });
  }

  // Add verification filter
  if (isVerified !== undefined) {
    pipeline.push({
      $match: {
        'verification.isVerified': isVerified
      }
    });
  }

  // Add price filter if service is specified
  if (maxPrice && service) {
    pipeline.push({
      $match: {
        'services': {
          $elemMatch: {
            category: service,
            'basePrice.amount': { $lte: maxPrice }
          }
        }
      }
    });
  }

  // Add sorting
  let sortStage = {};
  switch (sortBy) {
    case 'rating':
      sortStage = { 'rating.average': -1, distance: 1 };
      break;
    case 'price':
      if (service) {
        // This is complex - would need additional processing
        sortStage = { distance: 1 };
      } else {
        sortStage = { distance: 1 };
      }
      break;
    case 'experience':
      sortStage = { 'experience.years': -1, distance: 1 };
      break;
    case 'distance':
    default:
      sortStage = { distance: 1, 'rating.average': -1 };
      break;
  }

  pipeline.push({ $sort: sortStage });

  // Add pagination
  const skip = (page - 1) * limit;
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  // Project final fields
  pipeline.push({
    $project: {
      businessName: 1,
      bio: 1,
      specialties: 1,
      experience: 1,
      portfolio: { $slice: ['$portfolio', 3] }, // First 3 portfolio items
      services: {
        $filter: {
          input: '$services',
          cond: service ? { $eq: ['$$this.category', service] } : { $eq: ['$$this.isActive', true] }
        }
      },
      basePrices: {
        $map: {
          input: {
            $filter: {
              input: '$services',
              cond: service ? { $eq: ['$$this.category', service] } : { $eq: ['$$this.isActive', true] }
            }
          },
          as: 'service',
          in: {
            basePrice: '$$service.basePrice.amount',
            currency: '$$service.basePrice.currency'
          }
        }
      },
      rating: '$rating.average', // Flatten rating for frontend compatibility
      reviewCount: '$rating.count', // Add review count
      verification: { isVerified: '$verification.isVerified' },
      location: {
        isMobile: 1,
        isHomeBased: 1,
        mobileRadius: 1,
        additionalFee: 1
      },
      distance: { $round: ['$distance', 2] },
      'user.name': 1,
      'user.email': 1,
      'user.avatar': 1,
      'user.profileImage': 1, // Keep both avatar and profileImage for compatibility
      'user.location': 1,
      'user.address': 1,
      'user.isVerified': 1,
      'user._id': 1,
      isPremium: 1,
      completionRate: 1,
      // Add other fields that the frontend might expect
      isOnline: { $literal: true }, // Mock online status
      isAvailable: { $literal: true }, // Mock availability
      nextAvailableSlot: { $literal: null }, // Mock next slot
      completedBookings: '$statistics.completedBookings',
      experience: '$experience.years'
    }
  });

  // Execute aggregation
  const stylists = await Stylist.aggregate(pipeline);

  // Get total count for pagination
  const countPipeline = pipeline.slice(0, -3); // Remove sort, skip, limit, and project
  countPipeline.push({ $count: 'total' });
  const countResult = await Stylist.aggregate(countPipeline);
  const total = countResult.length > 0 ? countResult[0].total : 0;

  // Ensure all stylists have avatar fields
  ensureAvatarExists(stylists);

  res.json({
    success: true,
    message: 'Stylists retrieved successfully',
    data: {
      stylists,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      searchParams: {
        location: { latitude: finalLatitude, longitude: finalLongitude },
        radius,
        service,
        filters: { minRating, maxPrice, isVerified },
        sortBy
      }
    }
  });
}));

// @route   GET /api/stylists/stats
// @desc    Get stylist statistics
// @access  Private
router.get('/stats', auth, asyncHandler(async (req, res) => {
  // Get or create stylist profile
  const stylist = await getOrCreateStylistProfile(req.user._id);
  
  // Populate user information
  await stylist.populate('userId');
  
  // Add avatar initials to user
  if (stylist.userId) {
    const userObj = stylist.userId.toObject();
    stylist.userId = addAvatarInitials(userObj);
  }

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get today's bookings count
    const todayBookings = await Booking.countDocuments({
      stylistId: req.user._id,
      scheduledDate: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: ['pending', 'confirmed', 'completed'] }
    });

    // Get weekly earnings (completed bookings only)
    const weeklyEarningsData = await Booking.aggregate([
      {
        $match: {
          stylistId: new mongoose.Types.ObjectId(req.user._id),
          scheduledDate: { $gte: startOfWeek },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$totalPrice' }
        }
      }
    ]);

    // Get pending bookings count
    const pendingBookings = await Booking.countDocuments({
      stylistId: req.user._id,
      status: 'pending'
    });

    // Get completed bookings count (all time)
    const completedBookings = await Booking.countDocuments({
      stylistId: req.user._id,
      status: 'completed'
    });

    // Get unique clients count
    const totalClientsData = await Booking.aggregate([
      {
        $match: {
          stylistId: new mongoose.Types.ObjectId(req.user._id),
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$customerId'
        }
      },
      {
        $count: 'uniqueClients'
      }
    ]);

    // Get average rating from stylist profile
    const averageRating = stylist.rating?.average || 0;

    const stats = {
      todayBookings,
      weeklyEarnings: weeklyEarningsData[0]?.totalEarnings || 0,
      pendingBookings,
      completedBookings,
      totalClients: totalClientsData[0]?.uniqueClients || 0,
      averageRating: Number(averageRating.toFixed(1)),
    };

    res.json({
      success: true,
      data: { stats }
    });
}));

// @route   GET /api/stylists/earnings
// @desc    Get stylist earnings
// @access  Private
router.get('/earnings', auth, asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;

  // Get or create stylist profile
  const stylist = await getOrCreateStylistProfile(req.user._id);

  const now = new Date();
  let startDate;
    
    // Calculate date ranges based on period
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    // Get completed bookings for the period
    const completedBookings = await Booking.find({
      stylistId: req.user._id,
      status: 'completed',
      scheduledDate: { $gte: startDate }
    });

    // Calculate earnings metrics
    const totalEarnings = completedBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    const completedCount = completedBookings.length;
    const averageBookingValue = completedCount > 0 ? totalEarnings / completedCount : 0;

    // Get weekly earnings (last 7 days)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const weeklyBookings = await Booking.find({
      stylistId: req.user._id,
      status: 'completed',
      scheduledDate: { $gte: weekStart }
    });
    const weeklyEarnings = weeklyBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

    // Get monthly earnings (current month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyBookings = await Booking.find({
      stylistId: req.user._id,
      status: 'completed',
      scheduledDate: { $gte: monthStart }
    });
    const monthlyEarnings = monthlyBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

    // Calculate pending payouts (completed but not yet paid out)
    // For now, assume 15% of recent earnings are pending
    const pendingPayouts = monthlyEarnings * 0.15;

    const earnings = {
      totalEarnings: Number(totalEarnings.toFixed(2)),
      weeklyEarnings: Number(weeklyEarnings.toFixed(2)),
      monthlyEarnings: Number(monthlyEarnings.toFixed(2)),
      pendingPayouts: Number(pendingPayouts.toFixed(2)),
      completedBookings: completedCount,
      averageBookingValue: Number(averageBookingValue.toFixed(2)),
    };

    res.json({
      success: true,
      data: { earnings }
    });
}));

// @route   GET /api/stylists/transactions
// @desc    Get stylist transactions
// @access  Private
router.get('/transactions', auth, asyncHandler(async (req, res) => {
  const { limit = 20, period = 'month' } = req.query;
  const limitNumber = parseInt(limit);

  // Calculate date range based on period
  const now = new Date();
  let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
      default:
        startDate = new Date(0);
        break;
    }

    // Get completed bookings as earnings transactions
    const bookings = await Booking.find({
      stylistId: req.user._id,
      status: 'completed',
      scheduledDate: { $gte: startDate }
    })
    .populate('customerId', 'name')
    .sort({ scheduledDate: -1 })
    .limit(limitNumber)
    .lean();

    // Transform bookings into transaction format
    const transactions = bookings.map(booking => ({
      _id: booking._id,
      type: 'earning',
      amount: booking.totalPrice || 0,
      description: `${booking.service?.name || 'Hair Service'} - ${booking.customerId?.name || 'Customer'}`,
      date: booking.scheduledDate,
      status: 'completed',
      bookingId: booking._id
    }));

    // Add some sample payout transactions for demonstration
    // In a real app, these would come from a separate payments/payouts collection
    if (transactions.length > 0) {
      const weeklyPayout = {
        _id: 'payout_' + Date.now(),
        type: 'payout',
        amount: 300.00,
        description: 'Weekly payout to bank account',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed'
      };
      transactions.splice(2, 0, weeklyPayout); // Insert payout in the list
    }

    res.json({
      success: true,
      data: { transactions }
    });
}));

// @route   GET /api/stylists/bookings
// @desc    Get stylist bookings
// @access  Private
router.get('/bookings', auth, asyncHandler(async (req, res) => {
  const { limit = 10, status = 'all' } = req.query;
  const limitNumber = parseInt(limit);

  // Build query filter
  const query = { stylistId: req.user._id };
  if (status !== 'all') {
    query.status = status;
  }

  // Fetch bookings with customer details
    const bookings = await Booking.find(query)
      .populate('customerId', 'name email avatar profileImage')
      .sort({ appointmentDateTime: -1 }) // Most recent first
      .limit(limitNumber)
      .lean();

    // Format the response to match frontend expectations
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      customer: {
        name: booking.customerId?.name || 'Unknown Customer',
        profileImage: booking.customerId?.avatar || booking.customerId?.profileImage || null
      },
      service: booking.service?.name || 'Hair Service',
      scheduledDate: booking.appointmentDateTime, // Map appointmentDateTime to scheduledDate for frontend
      status: booking.status,
      totalPrice: booking.pricing?.totalAmount || booking.service?.basePrice || 0
    }));

    res.json({
      success: true,
      data: { bookings: formattedBookings }
    });
}));

// @route   GET /api/stylists/services
// @desc    Get stylist's services
// @access  Private (Stylist only)
router.get('/services', auth, asyncHandler(async (req, res) => {
  // Get or create stylist profile
  const stylist = await getOrCreateStylistProfile(req.user._id);

  res.json({
    success: true,
    data: {
      services: stylist.services || []
    }
  });
}));

// @route   POST /api/stylists/services
// @desc    Add a new service
// @access  Private (Stylist only)
router.post('/services', asyncHandler(async (req, res) => {
  // Check if user is stylist or admin
  if (!req.user || (req.user.role !== 'stylist' && req.user.role !== 'admin')) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Only stylists can add services'
    });
  }
  // Validate request body
  const { error, value } = addServiceSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid service data', error.details.map(d => d.message));
  }

  // Find or create stylist profile
  const stylist = await getOrCreateStylistProfile(req.user._id);

  // Add service
  stylist.services.push(value);
  await stylist.save();

  const addedService = stylist.services[stylist.services.length - 1];

  res.status(201).json({
    success: true,
    message: 'Service added successfully',
    data: {
      service: addedService
    }
  });
}));

// @route   PUT /api/stylists/services/:serviceId
// @desc    Update a service
// @access  Private (Stylist only)
router.put('/services/:serviceId', asyncHandler(async (req, res) => {
  // Check if user is stylist or admin
  if (!req.user || (req.user.role !== 'stylist' && req.user.role !== 'admin')) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Only stylists can update services'
    });
  }
  const serviceId = req.params.serviceId;

  // Validate request body
  const { error, value } = addServiceSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid service data', error.details.map(d => d.message));
  }

  // Find or create stylist profile
  const stylist = await getOrCreateStylistProfile(req.user._id);

  // Find and update service
  const service = stylist.services.id(serviceId);
  if (!service) {
    throw new NotFoundError('Service');
  }

  Object.keys(value).forEach(key => {
    if (value[key] !== undefined) {
      service[key] = value[key];
    }
  });

  await stylist.save();

  res.json({
    success: true,
    message: 'Service updated successfully',
    data: {
      service: service.toJSON()
    }
  });
}));

// @route   DELETE /api/stylists/services/:serviceId
// @desc    Delete a service
// @access  Private (Stylist only)
router.delete('/services/:serviceId', asyncHandler(async (req, res) => {
  // Check if user is stylist or admin
  if (!req.user || (req.user.role !== 'stylist' && req.user.role !== 'admin')) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Only stylists can delete services'
    });
  }
  const serviceId = req.params.serviceId;

  // Find or create stylist profile
  const stylist = await getOrCreateStylistProfile(req.user._id);

  // Find and remove service
  const service = stylist.services.id(serviceId);
  if (!service) {
    throw new NotFoundError('Service');
  }

  stylist.services.pull(serviceId);
  await stylist.save();

  res.json({
    success: true,
    message: 'Service deleted successfully'
  });
}));

// @route   GET /api/stylists/my-profile
// @desc    Get current stylist's own profile
// @access  Private (Stylist only)
router.get('/my-profile', auth, asyncHandler(async (req, res) => {
  // Get or create stylist profile
  const stylist = await getOrCreateStylistProfile(req.user._id);
  
  // Populate user information
  await stylist.populate('userId', 'name email phone profileImage location address createdAt');
  
  // Add avatar initials to user
  if (stylist.userId) {
    const userObj = stylist.userId.toObject();
    stylist.userId = addAvatarInitials(userObj);
  }

  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      stylist: stylist.toJSON()
    }
  });
}));

// @route   PUT /api/stylists/update-location
// @desc    Update stylist's business location
// @access  Private (Stylist only)
router.put('/update-location', asyncHandler(async (req, res) => {
  // Check if user is stylist
  if (!req.user || req.user.role !== 'stylist') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Only stylists can update their location'
    });
  }

  // Validation schema for location update
  const locationUpdateSchema = Joi.object({
    location: Joi.object({
      type: Joi.string().valid('Point').default('Point'),
      coordinates: Joi.array().items(
        Joi.number().min(-180).max(180).required(), // longitude
        Joi.number().min(-90).max(90).required()    // latitude
      ).length(2).required()
    }).required()
  });

  const { error, value } = locationUpdateSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { location } = value;

  // Update user's location
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { 
      location: location,
      lastLocationUpdate: new Date()
    },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new NotFoundError('User');
  }

  // Also ensure stylist profile exists
  let stylist = await getOrCreateStylistProfile(req.user._id);

  res.json({
    success: true,
    message: 'Location updated successfully',
    data: {
      location: {
        latitude: location.coordinates[1],
        longitude: location.coordinates[0]
      },
      updatedAt: user.lastLocationUpdate
    }
  });
}));

// @route   PUT /api/stylists/schedule
// @desc    Update stylist schedule (legacy - use /availability instead)
// @access  Private (Stylist only)
router.put('/schedule', auth, asyncHandler(async (req, res) => {
  // Validate request body
  const scheduleSchema = Joi.object({
    schedule: Joi.array().items(Joi.object({
      dayOfWeek: Joi.number().min(0).max(6).required(),
      startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      isAvailable: Joi.boolean().default(true)
    })).required()
  });

  const { error, value } = scheduleSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid schedule data', error.details.map(d => d.message));
  }

  // Find or create stylist profile
  const stylist = await getOrCreateStylistProfile(req.user._id);

  // Update schedule
  if (!stylist.availability) {
    stylist.availability = {};
  }
  stylist.availability.schedule = value.schedule;

  await stylist.save();

  res.json({
    success: true,
    message: 'Schedule updated successfully',
    data: {
      schedule: stylist.availability.schedule
    }
  });
}));

// GET /api/stylists/availability - Get stylist availability settings
router.get('/availability', auth, asyncHandler(async (req, res) => {
  // Get or create stylist profile
  const stylist = await getOrCreateStylistProfile(req.user._id);

  res.json({
    success: true,
    data: {
      availability: stylist.availability || {
        schedule: [],
        exceptions: [],
        advanceBookingDays: 30
      }
    }
  });
}));

// PUT /api/stylists/availability - Update stylist availability settings
router.put('/availability', auth, asyncHandler(async (req, res) => {
  // Validate request body
  const availabilitySchema = Joi.object({
    schedule: Joi.array().items(Joi.object({
      dayOfWeek: Joi.number().min(0).max(6).required(),
      startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      isAvailable: Joi.boolean().default(true)
    })),
    exceptions: Joi.array().items(Joi.object({
      date: Joi.date().required(),
      isAvailable: Joi.boolean().default(false),
      reason: Joi.string(),
      startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    })),
    advanceBookingDays: Joi.number().min(1).max(90)
  });

  const { error, value } = availabilitySchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid availability data', error.details.map(d => d.message));
  }

  // Get or create stylist profile
  const stylist = await getOrCreateStylistProfile(req.user._id);

  // Update availability
  if (value.schedule !== undefined) {
    stylist.availability.schedule = value.schedule;
  }
  if (value.exceptions !== undefined) {
    stylist.availability.exceptions = value.exceptions;
  }
  if (value.advanceBookingDays !== undefined) {
    stylist.availability.advanceBookingDays = value.advanceBookingDays;
  }

  await stylist.save();

  res.json({
    success: true,
    message: 'Availability updated successfully',
    data: {
      availability: stylist.availability
    }
  });
}));

// @route   GET /api/stylists/payment-settings
// @desc    Get stylist payment settings
// @access  Private (Stylist only)
router.get('/payment-settings', auth, asyncHandler(async (req, res) => {
  // Get or create stylist profile
  const stylist = await getOrCreateStylistProfile(req.user._id);

  res.json({
    success: true,
    data: {
      paymentSettings: stylist.settings?.payment || {
        bankDetails: {},
        paymentMethods: [],
        taxSettings: {},
        preferences: {
          autoWithdraw: false,
          minimumWithdrawAmount: 100,
          withdrawDay: 1
        }
      }
    }
  });
}));

// @route   PUT /api/stylists/payment-settings
// @desc    Update stylist payment settings
// @access  Private (Stylist only)
router.put('/payment-settings', auth, asyncHandler(async (req, res) => {
  // Validate request body
  const paymentSettingsSchema = Joi.object({
    bankDetails: Joi.object({
      accountName: Joi.string().allow(''),
      accountNumber: Joi.string().allow(''),
      bankName: Joi.string().allow(''),
      branchCode: Joi.string().allow(''),
      swiftCode: Joi.string().allow('')
    }),
    paymentMethods: Joi.array().items(Joi.object({
      type: Joi.string().valid('bank_transfer', 'mobile_money', 'paypal', 'stripe'),
      isEnabled: Joi.boolean().default(false)
    })),
    taxSettings: Joi.object({
      taxNumber: Joi.string().allow(''),
      isVatRegistered: Joi.boolean(),
      vatNumber: Joi.string().allow('')
    }),
    preferences: Joi.object({
      autoWithdraw: Joi.boolean(),
      minimumWithdrawAmount: Joi.number().min(0),
      withdrawDay: Joi.number().min(1).max(31)
    })
  });

  const { error, value } = paymentSettingsSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid payment settings data', error.details.map(d => d.message));
  }

  // Find or create stylist profile
  const stylist = await getOrCreateStylistProfile(req.user._id);

  // Initialize settings if not exists
  if (!stylist.settings) {
    stylist.settings = {};
  }
  if (!stylist.settings.payment) {
    stylist.settings.payment = {};
  }

  // Update payment settings
  if (value.bankDetails !== undefined) {
    stylist.settings.payment.bankDetails = value.bankDetails;
  }
  if (value.paymentMethods !== undefined) {
    stylist.settings.payment.paymentMethods = value.paymentMethods;
  }
  if (value.taxSettings !== undefined) {
    stylist.settings.payment.taxSettings = value.taxSettings;
  }
  if (value.preferences !== undefined) {
    stylist.settings.payment.preferences = value.preferences;
  }

  await stylist.save();

  res.json({
    success: true,
    message: 'Payment settings updated successfully',
    data: {
      paymentSettings: stylist.settings.payment
    }
  });
}));

// @route   GET /api/stylists/:id
// @desc    Get stylist profile by ID
// @access  Public
router.get('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  console.log(`🔍 Looking for stylist with ID: ${id}`);
  console.log(`📊 Database: ${req.app.get('db') || 'unknown'}`);

  // First try to find stylist profile by ID
  let stylist = await Stylist.findById(id)
    .populate('userId', 'name email phone profileImage location address createdAt isActive')
    .populate('reviews.customerId', 'name profileImage');
    
  // Add avatar initials to user if found
  if (stylist && stylist.userId) {
    const userObj = stylist.userId.toObject();
    stylist.userId = addAvatarInitials(userObj);
  }

  console.log(`🔍 Stylist found by ID: ${stylist ? 'YES' : 'NO'}`);

  if (!stylist) {
    // If not found by stylist ID, try to find by user ID
    console.log(`🔍 Trying to find stylist by userId: ${id}`);
    stylist = await Stylist.findOne({ userId: id })
      .populate('userId', 'name email phone profileImage location address createdAt isActive')
      .populate('reviews.customerId', 'name profileImage');
      
    // Add avatar initials to user if found
    if (stylist && stylist.userId) {
      const userObj = stylist.userId.toObject();
      stylist.userId = addAvatarInitials(userObj);
    }
    
    console.log(`🔍 Stylist found by userId: ${stylist ? 'YES' : 'NO'}`);
  }

  if (!stylist) {
    // If still not found, check if it's a valid user with stylist role
    console.log(`🔍 Checking if user exists with ID: ${id}`);
    const user = await User.findById(id);
    console.log(`🔍 User found: ${user ? 'YES' : 'NO'}, Role: ${user?.role || 'N/A'}`);
    
    if (user) {
      // If user exists but isn't marked as stylist, update their role first
      if (user.role !== 'stylist') {
        user.role = 'stylist';
        await user.save();
        console.log(`Updated user ${user._id} role from ${user.role} to stylist`);
      }
      
      // Create stylist profile for this user
      console.log(`🔧 Creating stylist profile for user: ${id}`);
      const newStylist = await getOrCreateStylistProfile(id);
      // Re-fetch with population
      stylist = await Stylist.findById(newStylist._id)
        .populate('userId', 'name email phone profileImage location address createdAt isActive')
        .populate('reviews.customerId', 'name profileImage');
        
      // Add avatar initials to user
      if (stylist && stylist.userId) {
        const userObj = stylist.userId.toObject();
        stylist.userId = addAvatarInitials(userObj);
      }
      
      console.log(`🔧 Created stylist profile: ${stylist ? 'YES' : 'NO'}`);
    }
  }

  if (!stylist) {
    console.log(`❌ Stylist not found after all attempts`);
    throw new NotFoundError('Stylist');
  }

  console.log(`✅ Stylist found: ${stylist.businessName || 'No business name'}`);

  // Check if stylist is active and user exists and is active
  if (!stylist.isActive) {
    console.log(`❌ Stylist is not active`);
    throw new NotFoundError('Stylist');
  }
  
  if (!stylist.userId || !stylist.userId.isActive) {
    console.log(`❌ Stylist user not found or not active`);
    // If user is missing or inactive, throw an error instead of proceeding with null user data
    throw new NotFoundError('Stylist user not found or inactive');
  }

  // Remove sensitive information if not the owner
  let responseData = stylist.toJSON();
  
  // Convert all ObjectIds to strings to prevent [object Object] issues
  responseData = convertObjectIdsToStrings(responseData);
  
  // Fix corrupted userId field if necessary
  if (responseData.userId === '[object Object]' || !responseData.userId) {
    if (responseData.user && responseData.user._id) {
      responseData.userId = responseData.user._id;
      console.log(`Fixed corrupted userId for stylist ${responseData._id}: ${responseData.userId}`);
    }
  }
  
  // Ensure compatibility by adding avatar field and handling null cases
  if (responseData.userId) {
    // Generate avatar initials from name
    if (responseData.userId.name) {
      const nameParts = responseData.userId.name.split(' ');
      if (nameParts.length >= 2) {
        responseData.userId.avatar = nameParts[0].charAt(0).toUpperCase() + nameParts[1].charAt(0).toUpperCase();
      } else {
        responseData.userId.avatar = responseData.userId.name.substring(0, 2).toUpperCase();
      }
    } else {
      responseData.userId.avatar = 'U';
    }
    
    // Also ensure profileImage is consistently available
    if (!responseData.userId.profileImage) {
      responseData.userId.profileImage = null;
    }
  } else {
    // This should not happen due to the check above, but adding as safety
    throw new NotFoundError('Stylist user data is incomplete');
  }
  
  // Also process reviews to add avatars and handle null/missing customerId
  if (responseData.reviews && Array.isArray(responseData.reviews)) {
    responseData.reviews = responseData.reviews
      .filter(review => review.customerId) // Filter out reviews with deleted/unpopulated users
      .map(review => {
        // The `addAvatarInitials` helper is perfect for this.
        // It handles null checks and creates an avatar from the name.
        review.customerId = addAvatarInitials(review.customerId);
        return review;
      });
  }

  if (!req.user || !stylist.userId || req.user._id.toString() !== stylist.userId._id.toString()) {
    // Remove private information for non-owners
    delete responseData.statistics;
    delete responseData.settings;
    delete responseData.verification.documents;
    
    // Limit reviews to most recent 10
    responseData.reviews = responseData.reviews.slice(-10);
  }

  // Ensure avatar exists
  ensureAvatarExists(responseData);

  // Add user field for frontend compatibility (map userId to user)
  if (responseData.userId) {
    responseData.user = responseData.userId;
  }

  // Flatten rating object for frontend compatibility
  if (responseData.rating && typeof responseData.rating === 'object' && responseData.rating.average !== undefined) {
    // Store reviewCount before flattening if not already set
    if (responseData.reviewCount === undefined && responseData.rating.count !== undefined) {
      responseData.reviewCount = responseData.rating.count;
    }
    // Flatten the rating to just the average number
    responseData.rating = responseData.rating.average;
  } else if (responseData.rating === undefined || responseData.rating === null) {
    // Ensure rating is always a number, default to 0
    responseData.rating = 0;
  }

  // Ensure reviewCount is always a number
  if (responseData.reviewCount === undefined || responseData.reviewCount === null) {
    responseData.reviewCount = 0;
  }

  res.json({
    success: true,
    message: 'Stylist profile retrieved successfully',
    data: {
      stylist: responseData
    }
  });
}));

// @route   GET /api/stylists/:id/portfolio
// @desc    Get stylist portfolio
// @access  Public
router.get('/:id/portfolio', asyncHandler(async (req, res) => {
  const stylistId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const service = req.query.service;

  const stylist = await Stylist.findById(stylistId, 'portfolio isActive');
  
  if (!stylist || !stylist.isActive) {
    throw new NotFoundError('Stylist');
  }

  let portfolio = stylist.portfolio;

  // Filter by service if specified
  if (service) {
    portfolio = portfolio.filter(item => item.service === service);
  }

  // Sort by upload date (newest first)
  portfolio.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedPortfolio = portfolio.slice(startIndex, endIndex);

  res.json({
    success: true,
    message: 'Portfolio retrieved successfully',
    data: {
      portfolio: paginatedPortfolio,
      pagination: {
        page,
        limit,
        total: portfolio.length,
        pages: Math.ceil(portfolio.length / limit),
        hasNext: endIndex < portfolio.length,
        hasPrev: page > 1
      }
    }
  });
}));

// @route   POST /api/stylists/portfolio
// @desc    Add portfolio item
// @access  Private (Stylist only)
router.post('/portfolio', auth, asyncHandler(async (req, res) => {
  // Find or create stylist profile
  const stylist = await getOrCreateStylistProfile(req.user._id);

  // Validation schema for portfolio item
  const portfolioSchema = Joi.object({
    imageUrl: Joi.string().uri().required(),
    caption: Joi.string().max(200).allow(''),
    service: Joi.string().valid(
      'braids', 'weaves', 'natural_hair', 'relaxed_hair', 'cuts', 
      'color', 'locs', 'extensions', 'treatments', 'styling', 
      'children_hair', 'men_cuts', 'beard_grooming'
    ).required(),
    tags: Joi.array().items(Joi.string()).default([])
  });

  const { error, value } = portfolioSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid portfolio data', error.details.map(d => d.message));
  }

  // Create new portfolio item
  const portfolioItem = {
    imageUrl: value.imageUrl,
    caption: value.caption,
    service: value.service,
    uploadedAt: new Date(),
    likes: 0
  };

  // Add to portfolio
  stylist.portfolio.push(portfolioItem);
  await stylist.save();

  // Get the created item (last one added)
  const createdItem = stylist.portfolio[stylist.portfolio.length - 1];

  res.status(201).json({
    success: true,
    message: 'Portfolio item added successfully',
    data: {
      portfolioItem: createdItem
    }
  });
}));

// @route   DELETE /api/stylists/portfolio/:itemId
// @desc    Remove portfolio item
// @access  Private (Stylist only)
router.delete('/portfolio/:itemId', auth, asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  // Find or create stylist profile
  const stylist = await getOrCreateStylistProfile(req.user._id);

  // Find and remove portfolio item
  const itemIndex = stylist.portfolio.findIndex(
    item => item._id.toString() === itemId
  );

  if (itemIndex === -1) {
    throw new NotFoundError('Portfolio item');
  }

  stylist.portfolio.splice(itemIndex, 1);
  await stylist.save();

  res.json({
    success: true,
    message: 'Portfolio item removed successfully'
  });
}));

// @route   PUT /api/stylists/profile
// @desc    Update stylist profile
// @access  Private (Stylist only)
router.put('/profile', asyncHandler(async (req, res) => {
  // Check if user is stylist or admin
  if (!req.user || (req.user.role !== 'stylist' && req.user.role !== 'admin')) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Only stylists can update profiles'
    });
  }
  // Validate request body
  const { error, value } = updateStylistProfileSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid profile data', error.details.map(d => d.message));
  }

  // Find or create stylist profile
  const stylist = await getOrCreateStylistProfile(req.user._id);

  // Update fields
  Object.keys(value).forEach(key => {
    if (value[key] !== undefined) {
      stylist[key] = value[key];
    }
  });

  await stylist.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      stylist: stylist.toJSON()
    }
  });
}));

module.exports = router;