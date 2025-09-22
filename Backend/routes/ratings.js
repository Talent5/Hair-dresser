const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Stylist = require('../models/Stylist');
const { authMiddleware, requireCustomerOrAdmin, requireStylistOrAdmin } = require('../middleware/auth');

// @route   GET /api/ratings/:id
// @desc    Get a specific rating by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const ratingId = req.params.id;

    const rating = await Rating.findById(ratingId)
      .populate('customerId', 'name profileImage')
      .populate('stylistProfileId', 'businessName')
      .populate('bookingId', 'service appointmentDateTime');

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Check if user has permission to view this rating
    const isCustomer = rating.customerId._id.toString() === req.user.id;
    const isStylist = rating.stylistProfileId && 
      await Stylist.findOne({ _id: rating.stylistProfileId._id, userId: req.user.id });
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isStylist && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this rating'
      });
    }

    res.json({
      success: true,
      data: rating
    });
  } catch (error) {
    console.error('Error fetching rating:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching rating'
    });
  }
});

// @route   POST /api/ratings
// @desc    Submit a new rating for a completed booking
// @access  Private (Customer only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      bookingId,
      overallRating,
      ratingBreakdown,
      review,
      wouldRecommend,
      wouldBookAgain,
      photos
    } = req.body;

    // Validate that user is a customer
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can submit ratings'
      });
    }

    // Check if booking exists and belongs to the user
    const booking = await Booking.findById(bookingId)
      .populate('stylistId', 'name')
      .populate('stylistProfileId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only rate your own bookings'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only rate completed bookings'
      });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({ bookingId });
    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this booking'
      });
    }

    // Validate rating values
    if (overallRating < 1 || overallRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Overall rating must be between 1 and 5'
      });
    }

    // Create new rating
    const rating = new Rating({
      bookingId,
      customerId: req.user.id,
      stylistId: booking.stylistId._id,
      stylistProfileId: booking.stylistProfileId._id,
      overallRating,
      ratingBreakdown: ratingBreakdown || {},
      review: review || {},
      wouldRecommend,
      wouldBookAgain,
      photos: photos || [],
      serviceDetails: {
        serviceName: booking.service.name,
        serviceCategory: booking.service.category,
        actualDuration: booking.service.duration,
        finalPrice: booking.pricing.totalAmount
      },
      source: req.headers['user-agent']?.includes('Mobile') ? 'mobile_app' : 'web_app',
      ipAddress: req.ip,
      deviceInfo: {
        platform: req.headers['x-platform'] === 'ios' ? 'ios' : 
                  req.headers['x-platform'] === 'android' ? 'android' : 'web',
        version: req.headers['x-app-version'] || '1.0.0',
        userAgent: req.headers['user-agent']
      }
    });

    await rating.save();

    // Update booking with rating reference
    await Booking.findByIdAndUpdate(bookingId, {
      'rating.customerRating': {
        rating: overallRating,
        comment: review.comment,
        ratedAt: new Date()
      }
    });

    // Update stylist rating statistics
    await Stylist.updateStylistRatings(booking.stylistProfileId._id);

    // Emit socket notification to stylist
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.stylistId._id}`).emit('new_rating', {
        type: 'new_rating',
        message: `You received a new ${overallRating}-star rating`,
        rating: {
          id: rating._id,
          overallRating,
          customerId: req.user.id,
          customerName: req.user.name,
          bookingId: booking._id,
          service: booking.service
        },
        timestamp: new Date()
      });
    }

    // Populate the rating for response
    const populatedRating = await Rating.findById(rating._id)
      .populate('customerId', 'name profileImage')
      .populate('stylistId', 'name')
      .select('-ipAddress -deviceInfo');

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        rating: populatedRating
      }
    });

  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/ratings/stylist/:stylistId
// @desc    Get all ratings for a specific stylist
// @access  Public
router.get('/stylist/:stylistId', async (req, res) => {
  try {
    const { stylistId } = req.params;
    const {
      page = 1,
      limit = 10,
      sort = 'newest',
      minRating,
      service,
      verified = true
    } = req.query;

    // Build query
    const query = {
      stylistId,
      status: 'approved'
    };

    if (verified === 'true') {
      query.isVerified = true;
    }

    if (minRating) {
      query.overallRating = { $gte: parseFloat(minRating) };
    }

    if (service) {
      query['serviceDetails.serviceCategory'] = service;
    }

    // Build sort
    let sortOptions = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'highest':
        sortOptions = { overallRating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortOptions = { overallRating: 1, createdAt: -1 };
        break;
      case 'helpful':
        // This would need a complex aggregation for helpful votes
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [ratings, total] = await Promise.all([
      Rating.find(query)
        .populate('customerId', 'name profileImage')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-ipAddress -deviceInfo'),
      Rating.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        ratings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRatings: total,
          hasNext: skip + ratings.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching stylist ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/ratings/stylist/:stylistId/stats
// @desc    Get rating statistics for a stylist
// @access  Public
router.get('/stylist/:stylistId/stats', async (req, res) => {
  try {
    const { stylistId } = req.params;

    const stats = await Rating.getStylistRatingStats(stylistId);

    if (stats.length === 0) {
      return res.json({
        success: true,
        data: {
          totalRatings: 0,
          averageOverall: 0,
          averageServiceQuality: 0,
          averageProfessionalism: 0,
          averageCommunication: 0,
          averageTimeliness: 0,
          averageValueForMoney: 0,
          ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          recommendationRate: 0,
          returnRate: 0
        }
      });
    }

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('Error fetching rating stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rating statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/ratings/customer/:customerId
// @desc    Get all ratings submitted by a customer
// @access  Private (Customer or Admin)
router.get('/customer/:customerId', authMiddleware, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own ratings'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [ratings, total] = await Promise.all([
      Rating.find({ customerId })
        .populate('stylistId', 'name profileImage')
        .populate('bookingId', 'service appointmentDateTime')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-ipAddress -deviceInfo'),
      Rating.countDocuments({ customerId })
    ]);

    res.json({
      success: true,
      data: {
        ratings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRatings: total,
          hasNext: skip + ratings.length < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching customer ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/ratings/:ratingId/helpful
// @desc    Vote on rating helpfulness
// @access  Private
router.post('/:ratingId/helpful', authMiddleware, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { isHelpful } = req.body;

    if (typeof isHelpful !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isHelpful must be a boolean value'
      });
    }

    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    await rating.addHelpfulVote(req.user.id, isHelpful);

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        helpfulScore: rating.helpfulScore,
        totalVotes: rating.helpfulVotes.helpful.length + rating.helpfulVotes.notHelpful.length
      }
    });

  } catch (error) {
    console.error('Error recording helpful vote:', error);
    
    if (error.message.includes('Cannot vote') || error.message.includes('already voted')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to record vote',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/ratings/:ratingId/respond
// @desc    Stylist response to a rating
// @access  Private (Stylist only)
router.post('/:ratingId/respond', authMiddleware, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { message, isPublic = true } = req.body;

    if (req.user.role !== 'stylist') {
      return res.status(403).json({
        success: false,
        message: 'Only stylists can respond to ratings'
      });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Response message is required'
      });
    }

    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    if (rating.stylistId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only respond to ratings for your services'
      });
    }

    if (rating.stylistResponse.message) {
      return res.status(400).json({
        success: false,
        message: 'You have already responded to this rating'
      });
    }

    rating.stylistResponse = {
      message: message.trim(),
      respondedAt: new Date(),
      isPublic
    };

    await rating.save();

    res.json({
      success: true,
      message: 'Response submitted successfully',
      data: {
        response: rating.stylistResponse
      }
    });

  } catch (error) {
    console.error('Error submitting stylist response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit response',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/ratings/:ratingId
// @desc    Update a rating (within edit window)
// @access  Private (Customer only)
router.put('/:ratingId', authMiddleware, async (req, res) => {
  try {
    const { ratingId } = req.params;
    const {
      overallRating,
      ratingBreakdown,
      review,
      wouldRecommend,
      wouldBookAgain,
      photos
    } = req.body;

    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can update ratings'
      });
    }

    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    if (rating.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own ratings'
      });
    }

    // Check if edit window has expired (24 hours)
    const editWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const timeSinceCreation = Date.now() - rating.createdAt.getTime();
    
    if (timeSinceCreation > editWindow) {
      return res.status(400).json({
        success: false,
        message: 'Rating can only be edited within 24 hours of submission'
      });
    }

    // Update fields
    if (overallRating !== undefined) {
      if (overallRating < 1 || overallRating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Overall rating must be between 1 and 5'
        });
      }
      rating.overallRating = overallRating;
    }

    if (ratingBreakdown) {
      rating.ratingBreakdown = { ...rating.ratingBreakdown.toObject(), ...ratingBreakdown };
    }

    if (review) {
      rating.review = { ...rating.review.toObject(), ...review };
    }

    if (wouldRecommend !== undefined) {
      rating.wouldRecommend = wouldRecommend;
    }

    if (wouldBookAgain !== undefined) {
      rating.wouldBookAgain = wouldBookAgain;
    }

    if (photos) {
      rating.photos = photos;
    }

    // Mark as updated
    rating.markModified('ratingBreakdown');
    rating.markModified('review');
    rating.markModified('photos');

    await rating.save();

    // Update stylist rating statistics
    await Stylist.updateStylistRatings(rating.stylistProfileId);

    // Emit socket notification to stylist
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${rating.stylistId}`).emit('rating_updated', {
        type: 'rating_updated',
        message: `A customer updated their rating to ${overallRating || rating.overallRating} stars`,
        rating: {
          id: rating._id,
          overallRating: overallRating || rating.overallRating,
          customerId: req.user.id,
          customerName: req.user.name
        },
        timestamp: new Date()
      });
    }

    const updatedRating = await Rating.findById(ratingId)
      .populate('customerId', 'name profileImage')
      .populate('stylistId', 'name')
      .select('-ipAddress -deviceInfo');

    res.json({
      success: true,
      message: 'Rating updated successfully',
      data: {
        rating: updatedRating
      }
    });

  } catch (error) {
    console.error('Error updating rating:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rating',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/ratings/:ratingId
// @desc    Delete a rating
// @access  Private (Customer or Admin)
router.delete('/:ratingId', authMiddleware, async (req, res) => {
  try {
    const { ratingId } = req.params;

    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && rating.customerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own ratings'
      });
    }

    // For customers, check delete window (24 hours)
    if (req.user.role === 'customer') {
      const deleteWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const timeSinceCreation = Date.now() - rating.createdAt.getTime();
      
      if (timeSinceCreation > deleteWindow) {
        return res.status(400).json({
          success: false,
          message: 'Rating can only be deleted within 24 hours of submission'
        });
      }
    }

    await Rating.findByIdAndDelete(ratingId);

    // Update booking to remove rating reference
    await Booking.findByIdAndUpdate(rating.bookingId, {
      $unset: { 'rating.customerRating': 1 }
    });

    res.json({
      success: true,
      message: 'Rating deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete rating',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/ratings/recent
// @desc    Get recent ratings across the platform
// @access  Public
router.get('/recent', async (req, res) => {
  try {
    const { limit = 20, service } = req.query;

    const query = {
      status: 'approved',
      isVerified: true
    };

    if (service) {
      query['serviceDetails.serviceCategory'] = service;
    }

    const ratings = await Rating.find(query)
      .populate('customerId', 'name profileImage')
      .populate('stylistId', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('-ipAddress -deviceInfo -helpfulVotes');

    res.json({
      success: true,
      data: {
        ratings
      }
    });

  } catch (error) {
    console.error('Error fetching recent ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent ratings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
