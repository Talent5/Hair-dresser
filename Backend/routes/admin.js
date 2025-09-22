const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Stylist = require('../models/Stylist');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { authMiddleware } = require('../middleware/auth');

// Middleware to check admin role
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard analytics endpoint
router.get('/analytics/dashboard', async (req, res) => {
  try {
    // Get current date and date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch basic counts
    const [totalUsers, totalStylists, totalBookings, completedBookings] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'stylist' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'completed' })
    ]);

    // Active bookings (confirmed, in-progress)
    const activeBookings = await Booking.countDocuments({
      status: { $in: ['confirmed', 'in-progress'] }
    });

    // Pending stylist approvals
    const pendingApprovals = await User.countDocuments({
      role: 'stylist',
      'stylistProfile.verified': false
    });

    // Revenue calculations
    const revenueResult = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Monthly revenue
    const monthlyRevenueResult = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, monthlyRevenue: { $sum: '$amount' } } }
    ]);
    const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].monthlyRevenue : 0;

    // Last month revenue for comparison
    const lastMonthRevenueResult = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { 
            $gte: startOfLastMonth,
            $lte: endOfLastMonth
          }
        }
      },
      { $group: { _id: null, lastMonthRevenue: { $sum: '$amount' } } }
    ]);
    const lastMonthRevenue = lastMonthRevenueResult.length > 0 ? lastMonthRevenueResult[0].lastMonthRevenue : 0;

    // Calculate growth percentages
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
      : 0;

    // User growth
    const thisMonthUsers = await User.countDocuments({
      role: { $ne: 'admin' },
      createdAt: { $gte: startOfMonth }
    });

    const lastMonthUsers = await User.countDocuments({
      role: { $ne: 'admin' },
      createdAt: { 
        $gte: startOfLastMonth,
        $lte: endOfLastMonth
      }
    });

    const userGrowth = lastMonthUsers > 0 
      ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers * 100)
      : 0;

    // Booking growth
    const thisMonthBookings = await Booking.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    const lastMonthBookings = await Booking.countDocuments({
      createdAt: { 
        $gte: startOfLastMonth,
        $lte: endOfLastMonth
      }
    });

    const bookingGrowth = lastMonthBookings > 0 
      ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings * 100)
      : 0;

    // Average rating calculation
    const ratingResult = await Booking.aggregate([
      { $match: { rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const averageRating = ratingResult.length > 0 ? ratingResult[0].avgRating : 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalStylists,
        totalBookings,
        totalRevenue,
        monthlyRevenue,
        activeBookings,
        pendingApprovals,
        completedBookings,
        averageRating: Math.round(averageRating * 10) / 10,
        growth: {
          users: Math.round(userGrowth * 10) / 10,
          bookings: Math.round(bookingGrowth * 10) / 10,
          revenue: Math.round(revenueGrowth * 10) / 10
        }
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard analytics',
      error: error.message
    });
  }
});

// Monthly trends for charts
router.get('/analytics/trends', async (req, res) => {
  try {
    const { period = '12' } = req.query;
    const months = parseInt(period);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get monthly booking trends
    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get monthly revenue trends
    const revenueTrends = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get monthly user registration trends
    const userTrends = await User.aggregate([
      {
        $match: {
          role: { $ne: 'admin' },
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        bookings: bookingTrends,
        revenue: revenueTrends,
        users: userTrends
      }
    });

  } catch (error) {
    console.error('Trends analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trends data',
      error: error.message
    });
  }
});

// Service popularity analytics
router.get('/analytics/services', async (req, res) => {
  try {
    const servicePopularity = await Booking.aggregate([
      {
        $group: {
          _id: '$serviceName',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          avgRating: { $avg: '$rating' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: servicePopularity
    });

  } catch (error) {
    console.error('Service analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching service analytics',
      error: error.message
    });
  }
});

// Recent activities
router.get('/analytics/activities', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('stylistId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 2)
      .lean();

    // Get recent user registrations
    const recentUsers = await User.find({ role: { $ne: 'admin' } })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 2)
      .lean();

    // Format activities
    const activities = [];

    recentBookings.forEach(booking => {
      activities.push({
        type: 'booking',
        message: `New booking from ${booking.userId?.name || 'Unknown User'}`,
        time: booking.createdAt,
        location: booking.location?.city || 'Unknown',
        metadata: {
          bookingId: booking._id,
          service: booking.serviceName,
          amount: booking.totalPrice
        }
      });
    });

    recentUsers.forEach(user => {
      activities.push({
        type: user.role === 'stylist' ? 'stylist' : 'user',
        message: `${user.name || 'New user'} joined the platform`,
        time: user.createdAt,
        location: user.location?.city || 'Unknown',
        metadata: {
          userId: user._id,
          role: user.role
        }
      });
    });

    // Sort by time and limit
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const limitedActivities = activities.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: limitedActivities
    });

  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activities',
      error: error.message
    });
  }
});

// Get all users for admin management
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = { role: { $ne: 'admin' } };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get all stylists for admin management
router.get('/stylists', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, verified, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = { role: 'stylist' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (verified && verified !== 'all') {
      query['stylistProfile.verified'] = verified === 'true';
    }

    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    const stylists = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        stylists,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get stylists error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stylists',
      error: error.message
    });
  }
});

// Get all bookings for admin management
router.get('/bookings', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { serviceName: { $regex: search, $options: 'i' } }
      ];
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'name email')
      .populate('stylistId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

// Get all payments for admin management
router.get('/payments', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('bookingId')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
});

// Admin actions - Verify stylist
router.patch('/stylists/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findOneAndUpdate(
      { _id: id, role: 'stylist' },
      { 'stylistProfile.verified': true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }

    res.json({
      success: true,
      message: 'Stylist verified successfully',
      data: user
    });

  } catch (error) {
    console.error('Verify stylist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying stylist',
      error: error.message
    });
  }
});

// Admin actions - Suspend/Activate user
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;
    
    const user = await User.findByIdAndUpdate(
      id,
      { 
        isActive,
        ...(reason && { suspensionReason: reason })
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
      data: user
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
});

// Admin actions - Update booking status
router.patch('/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
      id,
      { 
        status,
        ...(reason && { adminNotes: reason })
      },
      { new: true }
    ).populate('userId', 'name email')
     .populate('stylistId', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });

  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
});

// =======================
// RATING MANAGEMENT ROUTES
// =======================

// Get all ratings for admin dashboard
router.get('/ratings', adminMiddleware, async (req, res) => {
  try {
    const Rating = require('../models/Rating');
    
    const { 
      page = 1, 
      limit = 20, 
      filter = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = {};
    
    // Apply filters
    switch (filter) {
      case 'flagged':
        query.isFlagged = true;
        break;
      case 'pending':
        query.moderationStatus = 'pending';
        break;
      case 'reported':
        query.reportCount = { $gt: 0 };
        break;
      case 'approved':
        query.moderationStatus = 'approved';
        break;
      case 'rejected':
        query.moderationStatus = 'rejected';
        break;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const ratings = await Rating.find(query)
      .populate('bookingId', 'service totalAmount')
      .populate('userId', 'name email avatar')
      .populate('stylistId', 'userId')
      .populate({
        path: 'stylistId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Rating.countDocuments(query);

    res.json({
      success: true,
      data: {
        ratings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ratings',
      error: error.message
    });
  }
});

// Get rating statistics for admin dashboard
router.get('/ratings/stats', adminMiddleware, async (req, res) => {
  try {
    const Rating = require('../models/Rating');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get basic counts
    const [
      totalRatings,
      flaggedRatings,
      pendingModeration,
      averageRatingResult,
      todayRatings,
      thisWeekRatings,
      thisMonthRatings
    ] = await Promise.all([
      Rating.countDocuments(),
      Rating.countDocuments({ isFlagged: true }),
      Rating.countDocuments({ moderationStatus: 'pending' }),
      Rating.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$overallRating' } } }
      ]),
      Rating.countDocuments({ createdAt: { $gte: today } }),
      Rating.countDocuments({ createdAt: { $gte: thisWeekStart } }),
      Rating.countDocuments({ createdAt: { $gte: thisMonthStart } })
    ]);

    // Get rating distribution
    const ratingDistribution = await Rating.aggregate([
      {
        $group: {
          _id: '$overallRating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Get top rated stylists
    const topRatedStylists = await Rating.aggregate([
      {
        $group: {
          _id: '$stylistId',
          averageRating: { $avg: '$overallRating' },
          totalRatings: { $sum: 1 }
        }
      },
      { $match: { totalRatings: { $gte: 5 } } }, // Minimum 5 ratings
      { $sort: { averageRating: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'stylists',
          localField: '_id',
          foreignField: '_id',
          as: 'stylist'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'stylist.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $project: {
          stylistId: '$_id',
          averageRating: 1,
          totalRatings: 1,
          stylistName: { $arrayElemAt: ['$user.name', 0] }
        }
      }
    ]);

    const averageRating = averageRatingResult.length > 0 ? 
      averageRatingResult[0].avgRating : 0;

    const distributionMap = {};
    ratingDistribution.forEach(item => {
      distributionMap[item._id] = item.count;
    });

    const breakdown = {
      5: distributionMap[5] || 0,
      4: distributionMap[4] || 0,
      3: distributionMap[3] || 0,
      2: distributionMap[2] || 0,
      1: distributionMap[1] || 0
    };

    res.json({
      success: true,
      data: {
        totalRatings,
        averageRating: Math.round(averageRating * 10) / 10,
        flaggedRatings,
        pendingModeration,
        ratingsByPeriod: {
          today: todayRatings,
          thisWeek: thisWeekRatings,
          thisMonth: thisMonthRatings
        },
        ratingBreakdown: breakdown,
        topRatedStylists,
      }
    });
  } catch (error) {
    console.error('Error fetching rating stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rating statistics',
      error: error.message
    });
  }
});

// Moderate a rating
router.post('/ratings/:ratingId/moderate', adminMiddleware, async (req, res) => {
  try {
    const Rating = require('../models/Rating');
    const { ratingId } = req.params;
    const { action, reason } = req.body;

    if (!['approve', 'reject', 'flag'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid moderation action'
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Moderation reason is required'
      });
    }

    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Update rating based on action
    const updateData = {
      moderationHistory: [
        ...(rating.moderationHistory || []),
        {
          action,
          reason,
          moderatorId: req.user.id,
          timestamp: new Date()
        }
      ]
    };

    switch (action) {
      case 'approve':
        updateData.moderationStatus = 'approved';
        updateData.isFlagged = false;
        break;
      case 'reject':
        updateData.moderationStatus = 'rejected';
        updateData.isVisible = false;
        break;
      case 'flag':
        updateData.isFlagged = true;
        updateData.moderationStatus = 'pending';
        break;
    }

    const updatedRating = await Rating.findByIdAndUpdate(
      ratingId,
      updateData,
      { new: true }
    ).populate('userId', 'name email')
     .populate('stylistId');

    // Log admin action
    console.log(`Admin ${req.user.id} ${action}ed rating ${ratingId}: ${reason}`);

    res.json({
      success: true,
      message: `Rating ${action}ed successfully`,
      data: updatedRating
    });
  } catch (error) {
    console.error('Error moderating rating:', error);
    res.status(500).json({
      success: false,
      message: 'Error moderating rating',
      error: error.message
    });
  }
});

module.exports = router;