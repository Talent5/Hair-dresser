const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Stylist = require('../models/Stylist');
const Chat = require('../models/Chat');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/bookings
// @desc    Get user bookings
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    // Build query filter
    let filter = {
      $or: [
        { customerId: userId },
        { stylistId: userId }
      ]
    };

    if (status && status !== 'all') {
      filter.status = status;
    }

    // Get bookings with pagination
    const bookings = await Booking.find(filter)
      .populate('customerId', 'name email avatar phone')
      .populate('stylistId', 'name email avatar phone')
      .populate('stylistProfileId', 'businessName specialties rating reviewCount')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Booking.countDocuments(filter);

    // Format bookings for frontend
    const formattedBookings = bookings.map(booking => {
      const bookingObj = booking.toObject();
      
      // Add user role for this booking
      const isCustomer = booking.customerId._id.toString() === userId;
      const isStylist = booking.stylistId._id.toString() === userId;
      
      // Transform booking data to match frontend expectations
      return {
        _id: bookingObj._id,
        customerId: bookingObj.customerId._id,
        stylistId: bookingObj.stylistId._id,
        customer: bookingObj.customerId,
        stylist: bookingObj.stylistId,
        service: {
          name: bookingObj.service.name,
          description: `${bookingObj.service.category} service`, // Add description
          estimatedDuration: bookingObj.service.duration, // Map duration to estimatedDuration
          originalPrice: bookingObj.service.basePrice
        },
        negotiatedPrice: bookingObj.pricing.negotiatedPrice, // Extract from pricing object
        depositAmount: bookingObj.pricing.depositAmount,
        status: bookingObj.status,
        appointmentTime: bookingObj.appointmentDateTime, // Map appointmentDateTime to appointmentTime
        location: {
          type: 'Point',
          coordinates: bookingObj.location.address.coordinates || [0, 0],
          address: (() => {
            // Format address from object to string
            const addr = bookingObj.location.address;
            if (addr) {
              const parts = [addr.street, addr.suburb, addr.city].filter(Boolean);
              return parts.length > 0 ? parts.join(', ') : 'Address not specified';
            }
            return 'Address not specified';
          })()
        },
        paymentId: bookingObj.paymentId,
        payment: bookingObj.payment,
        chatId: bookingObj.chatId,
        notes: bookingObj.notes,
        cancellationReason: bookingObj.cancellationReason,
        rating: bookingObj.rating,
        review: bookingObj.review,
        createdAt: bookingObj.createdAt,
        updatedAt: bookingObj.updatedAt,
        userRole: isCustomer ? 'customer' : 'stylist',
        otherParty: isCustomer ? bookingObj.stylistId : bookingObj.customerId,
        canCancel: booking.canBeCancelled(userId).canCancel,
        timeUntilAppointment: booking.timeUntilAppointment,
        durationFormatted: booking.durationFormatted,
        fullLocationAddress: booking.fullLocationAddress
      };
    });

    res.json({
      success: true,
      data: {
        bookings: formattedBookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking details
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name email avatar phone')
      .populate('stylistId', 'name email avatar phone')
      .populate('stylistProfileId', 'businessName specialties rating reviewCount')
      .populate('payment.paymentId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is authorized to view this booking
    const isCustomer = booking.customerId._id.toString() === userId;
    const isStylist = booking.stylistId._id.toString() === userId;

    if (!isCustomer && !isStylist) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    const bookingObj = booking.toObject();
    const formattedBooking = {
      _id: bookingObj._id,
      customerId: bookingObj.customerId._id,
      stylistId: bookingObj.stylistId._id,
      customer: bookingObj.customerId,
      stylist: bookingObj.stylistId,
      service: {
        name: bookingObj.service.name,
        description: `${bookingObj.service.category} service`,
        estimatedDuration: bookingObj.service.duration,
        originalPrice: bookingObj.service.basePrice
      },
      negotiatedPrice: bookingObj.pricing.negotiatedPrice,
      depositAmount: bookingObj.pricing.depositAmount,
      status: bookingObj.status,
      appointmentTime: bookingObj.appointmentDateTime,
      location: {
        type: 'Point',
        coordinates: bookingObj.location.address.coordinates || [0, 0],
        address: (() => {
          const addr = bookingObj.location.address;
          if (addr) {
            const parts = [addr.street, addr.suburb, addr.city].filter(Boolean);
            return parts.length > 0 ? parts.join(', ') : 'Address not specified';
          }
          return 'Address not specified';
        })()
      },
      paymentId: bookingObj.paymentId,
      payment: bookingObj.payment,
      chatId: bookingObj.chatId,
      notes: bookingObj.notes,
      cancellationReason: bookingObj.cancellationReason,
      rating: bookingObj.rating,
      review: bookingObj.review,
      createdAt: bookingObj.createdAt,
      updatedAt: bookingObj.updatedAt,
      userRole: isCustomer ? 'customer' : 'stylist',
      otherParty: isCustomer ? bookingObj.stylistId : bookingObj.customerId,
      canCancel: booking.canBeCancelled(userId),
      timeUntilAppointment: booking.timeUntilAppointment,
      durationFormatted: booking.durationFormatted,
      fullLocationAddress: booking.fullLocationAddress
    };

    res.json({
      success: true,
      data: formattedBooking
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching booking details'
    });
  }
});

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const customerId = req.user.id;
    const {
      stylistId,
      service,
      appointmentDateTime,
      location,
      pricing,
      notes
    } = req.body;

    // Validate required fields
    if (!stylistId || !service || !appointmentDateTime || !location || !pricing) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Debug logging
    console.log('Received stylistId:', stylistId, 'Type:', typeof stylistId);
    console.log('Received service:', service, 'Type:', typeof service);
    
    // Ensure stylistId is a string and handle edge cases
    let stylistIdString;
    if (!stylistId) {
      return res.status(400).json({
        success: false,
        message: 'Stylist ID is required'
      });
    }
    
    if (typeof stylistId === 'object') {
      console.error('stylistId received as object:', stylistId);
      return res.status(400).json({
        success: false,
        message: 'Invalid stylist ID format - received object instead of string'
      });
    }
    
    stylistIdString = String(stylistId).trim();
    
    if (stylistIdString === '[object Object]' || stylistIdString === '') {
      console.error('Invalid stylistId value:', stylistIdString);
      return res.status(400).json({
        success: false,
        message: 'Invalid stylist ID value'
      });
    }
    
    console.log('Processed stylistId:', stylistIdString);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(stylistIdString)) {
      console.error('Invalid ObjectId format:', stylistIdString);
      return res.status(400).json({
        success: false,
        message: 'Invalid stylist ID format'
      });
    }

    // Check if stylist exists
    const stylist = await User.findById(stylistIdString);
    if (!stylist || stylist.role !== 'stylist') {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }

    // Get stylist profile
    const stylistProfile = await Stylist.findOne({ userId: stylistIdString });
    if (!stylistProfile) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    // Validate customer offer if provided
    if (pricing.customerOffer && pricing.basePrice) {
      const minimumPrice = pricing.basePrice * 0.8; // 20% below base price
      if (pricing.customerOffer < minimumPrice) {
        return res.status(400).json({
          success: false,
          message: `Customer offer ($${pricing.customerOffer}) is too low. Minimum acceptable price is $${minimumPrice.toFixed(2)}`
        });
      }
    }

    // Determine initial status based on pricing
    let initialStatus = 'pending';
    if (pricing.customerOffer && pricing.customerOffer < pricing.basePrice) {
      initialStatus = 'pending_approval'; // Requires stylist approval for reduced price
    }

    // Calculate estimated end time
    const appointmentDate = new Date(appointmentDateTime);
    const serviceDuration = service.duration || 60; // Default to 60 minutes if not specified
    const estimatedEndTime = new Date(appointmentDate.getTime() + serviceDuration * 60000); // Add duration in milliseconds

    // Create booking
    const booking = new Booking({
      customerId,
      stylistId: stylistIdString,
      stylistProfileId: stylistProfile._id,
      service,
      appointmentDateTime: appointmentDate,
      estimatedEndTime: estimatedEndTime,
      location,
      pricing,
      status: initialStatus,
      metadata: {
        notes,
        source: 'mobile_app'
      }
    });

    await booking.save();

    // Create chat for this booking
    const chat = new Chat({
      bookingId: booking._id,
      participants: [
        {
          userId: customerId,
          role: 'customer',
          joinedAt: new Date(),
          lastReadAt: new Date()
        },
        {
          userId: stylistIdString,
          role: 'stylist',
          joinedAt: new Date(),
          lastReadAt: new Date()
        }
      ],
      messages: [],
      chatSettings: {
        isActive: true,
        autoEndAfterBooking: false
      },
      unreadCounts: {
        customer: 0,
        stylist: 0
      },
      lastActivity: new Date()
    });

    await chat.save();

    // Add a system message to welcome both parties
    await chat.addSystemMessage('booking_created', {
      bookingId: booking._id,
      serviceName: service.name,
      appointmentTime: appointmentDateTime,
      customerName: req.user.name,
      stylistName: stylist.name
    });

    // Update booking with chat ID
    booking.communication.chatId = chat._id;
    await booking.save();

    // Populate booking data
    await booking.populate('customerId stylistId stylistProfileId communication.chatId');

    const responseMessage = initialStatus === 'pending_approval' 
      ? 'Booking created successfully. Your reduced price offer is pending stylist approval.'
      : 'Booking created successfully';

    res.status(201).json({
      success: true,
      data: {
        _id: booking._id,
        customerId: booking.customerId,
        stylistId: booking.stylistId,
        service: {
          name: booking.service.name,
          description: `${booking.service.category} service`,
          estimatedDuration: booking.service.duration,
          originalPrice: booking.service.basePrice
        },
        negotiatedPrice: booking.pricing.negotiatedPrice,
        depositAmount: booking.pricing.depositAmount,
        status: booking.status,
        appointmentTime: booking.appointmentDateTime,
        location: {
          type: 'Point',
          coordinates: booking.location.address.coordinates || [0, 0],
          address: (() => {
            const addr = booking.location.address;
            if (addr) {
              const parts = [addr.street, addr.suburb, addr.city].filter(Boolean);
              return parts.length > 0 ? parts.join(', ') : 'Address not specified';
            }
            return 'Address not specified';
          })()
        },
        chatId: chat._id,
        notes: booking.notes,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      },
      message: responseMessage
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      validation: error.errors ? Object.keys(error.errors) : null
    });
    res.status(500).json({
      success: false,
      message: 'Server error while creating booking',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        validation: error.errors ? Object.keys(error.errors) : null
      } : undefined
    });
  }
});

// @route   PATCH /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const { status, reason, notes } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    const isCustomer = booking.customerId.toString() === userId;
    const isStylist = booking.stylistId.toString() === userId;

    if (!isCustomer && !isStylist) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Update status using the model method
    if (status === 'cancelled') {
      booking.cancellation.reason = reason;
      booking.cancellation.explanation = notes;
    }
    
    if (status === 'rejected') {
      booking.cancellation.reason = reason || 'stylist_unavailable';
      booking.cancellation.explanation = notes || 'Booking rejected by stylist';
      booking.cancellation.cancelledBy = userId;
      booking.cancellation.cancelledAt = new Date();
    }

    await booking.updateStatus(status, userId);

    res.json({
      success: true,
      data: booking,
      message: 'Booking status updated successfully'
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating booking status'
    });
  }
});

// @route   PATCH /api/bookings/:id/cancel
// @desc    Cancel a booking (alternative endpoint)
// @access  Private
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const { reason, explanation } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user can cancel
    const cancellationCheck = booking.canBeCancelled(userId);
    if (!cancellationCheck.canCancel) {
      return res.status(400).json({
        success: false,
        message: cancellationCheck.reason
      });
    }

    // Set cancellation details
    booking.cancellation.reason = reason;
    booking.cancellation.explanation = explanation;

    // Update to cancelled status
    await booking.updateStatus('cancelled', userId);

    res.json({
      success: true,
      data: {
        booking,
        refundInfo: {
          refundPercentage: cancellationCheck.refundPercentage,
          withPenalty: cancellationCheck.withPenalty
        }
      },
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling booking'
    });
  }
});

// @route   POST /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;
    const { reason, explanation } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user can cancel
    const cancellationCheck = booking.canBeCancelled(userId);
    if (!cancellationCheck.canCancel) {
      return res.status(400).json({
        success: false,
        message: cancellationCheck.reason
      });
    }

    // Set cancellation details
    booking.cancellation.reason = reason;
    booking.cancellation.explanation = explanation;

    // Update to cancelled status
    await booking.updateStatus('cancelled', userId);

    res.json({
      success: true,
      data: {
        booking,
        refundInfo: {
          refundPercentage: cancellationCheck.refundPercentage,
          withPenalty: cancellationCheck.withPenalty
        }
      },
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling booking'
    });
  }
});

module.exports = router;