const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stylistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stylistProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stylist',
    required: true
  },
  service: {
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: [
        'braids',
        'weaves',
        'natural_hair',
        'relaxed_hair',
        'cuts',
        'color',
        'locs',
        'extensions',
        'treatments',
        'styling',
        'children_hair',
        'men_cuts',
        'beard_grooming'
      ],
      required: true
    },
    duration: {
      type: Number, // in minutes
      required: true
    },
    basePrice: {
      type: Number,
      required: true
    }
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    negotiatedPrice: {
      type: Number,
      required: true
    },
    customerOffer: {
      type: Number,
      required: false,
      validate: {
        validator: function(offer) {
          if (offer && this.basePrice) {
            const minimumPrice = this.basePrice * 0.8; // 20% below base price
            return offer >= minimumPrice;
          }
          return true;
        },
        message: 'Customer offer cannot be more than 20% below the base price'
      }
    },
    depositAmount: {
      type: Number,
      default: function() {
        return Math.round(this.negotiatedPrice * 0.1 * 100) / 100; // 10% deposit
      }
    },
    additionalFees: [{
      type: {
        type: String,
        enum: ['travel', 'materials', 'overtime', 'premium_location']
      },
      amount: Number,
      description: String
    }],
    totalAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  appointmentDateTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Appointment date must be in the future'
    }
  },
  estimatedEndTime: {
    type: Date,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['customer_location', 'stylist_studio', 'neutral_location'],
      required: true
    },
    address: {
      street: String,
      suburb: String,
      city: String,
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function(coords) {
            return coords.length === 2;
          },
          message: 'Coordinates must be [longitude, latitude]'
        }
      }
    },
    instructions: String, // Special instructions for finding the location
    additionalFee: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: [
      'pending',        // Waiting for stylist confirmation
      'pending_approval', // Customer offered lower price, awaiting stylist approval
      'accepted',       // Stylist has accepted the booking
      'confirmed',      // Both parties agreed
      'in_progress',    // Service is happening
      'completed',      // Service finished successfully
      'cancelled',      // Cancelled by either party
      'no_show',        // Customer didn't show up
      'stylist_no_show' // Stylist didn't show up
    ],
    default: 'pending'
  },
  negotiation: {
    isNegotiated: {
      type: Boolean,
      default: false
    },
    originalPrice: Number,
    finalPrice: Number,
    negotiationHistory: [{
      from: {
        type: String,
        enum: ['customer', 'stylist']
      },
      proposedPrice: Number,
      message: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    agreedAt: Date
  },
  confirmation: {
    stylistConfirmedAt: Date,
    customerConfirmedAt: Date,
    autoConfirmDeadline: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from creation
      }
    }
  },
  communication: {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    },
    lastMessageAt: Date,
    unreadCount: {
      customer: { type: Number, default: 0 },
      stylist: { type: Number, default: 0 }
    }
  },
  reminders: {
    sent24Hours: { type: Boolean, default: false },
    sent2Hours: { type: Boolean, default: false },
    sent30Minutes: { type: Boolean, default: false }
  },
  cancellation: {
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date,
    reason: {
      type: String,
      enum: [
        'customer_request',
        'stylist_unavailable',
        'emergency',
        'weather',
        'illness',
        'scheduling_conflict',
        'payment_issue',
        'other'
      ]
    },
    explanation: String,
    refundAmount: Number,
    refundProcessed: {
      type: Boolean,
      default: false
    }
  },
  completion: {
    completedAt: Date,
    actualDuration: Number, // in minutes
    photosBeforeAfter: [{
      type: {
        type: String,
        enum: ['before', 'after']
      },
      url: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    notes: String
  },
  rating: {
    customerRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      ratedAt: Date
    },
    stylistRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      ratedAt: Date
    }
  },
  payment: {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    depositPaid: {
      type: Boolean,
      default: false
    },
    depositPaidAt: Date,
    fullPaymentCompleted: {
      type: Boolean,
      default: false
    },
    fullPaymentCompletedAt: Date
  },
  dispute: {
    isDisputed: {
      type: Boolean,
      default: false
    },
    disputedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    disputeReason: {
      type: String,
      enum: [
        'service_quality',
        'no_show',
        'late_arrival',
        'pricing_disagreement',
        'unprofessional_behavior',
        'safety_concern',
        'other'
      ]
    },
    disputeDescription: String,
    disputedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'escalated'],
      default: 'pending'
    },
    resolution: {
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      resolution: String,
      resolvedAt: Date,
      refundAmount: Number
    }
  },
  metadata: {
    source: {
      type: String,
      enum: ['mobile_app', 'web_app', 'admin_panel'],
      default: 'mobile_app'
    },
    userAgent: String,
    ipAddress: String,
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
bookingSchema.index({ customerId: 1 });
bookingSchema.index({ stylistId: 1 });
bookingSchema.index({ appointmentDateTime: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ 'payment.depositPaid': 1 });

// Compound indexes
bookingSchema.index({ stylistId: 1, appointmentDateTime: 1 });
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ status: 1, appointmentDateTime: 1 });

// Virtual for booking duration in a readable format
bookingSchema.virtual('durationFormatted').get(function() {
  const hours = Math.floor(this.service.duration / 60);
  const minutes = this.service.duration % 60;
  
  if (hours === 0) return `${minutes} minutes`;
  if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`;
});

// Virtual for time until appointment
bookingSchema.virtual('timeUntilAppointment').get(function() {
  const now = new Date();
  const appointment = new Date(this.appointmentDateTime);
  const diffMs = appointment - now;
  
  if (diffMs < 0) return 'Past due';
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
});

// Virtual for full location address
bookingSchema.virtual('fullLocationAddress').get(function() {
  if (!this.location.address) return '';
  const { street, suburb, city } = this.location.address;
  return [street, suburb, city].filter(Boolean).join(', ');
});

// Pre-save middleware to set estimated end time
bookingSchema.pre('save', function(next) {
  if (this.isModified('appointmentDateTime') || this.isModified('service.duration')) {
    this.estimatedEndTime = new Date(
      this.appointmentDateTime.getTime() + (this.service.duration * 60 * 1000)
    );
  }
  
  // Calculate total amount if pricing fields are modified
  if (this.isModified('pricing')) {
    const additionalFeesTotal = this.pricing.additionalFees.reduce(
      (sum, fee) => sum + fee.amount, 0
    );
    this.pricing.totalAmount = this.pricing.negotiatedPrice + additionalFeesTotal;
  }
  
  next();
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function(userId) {
  const now = new Date();
  const appointment = new Date(this.appointmentDateTime);
  const hoursUntilAppointment = (appointment - now) / (1000 * 60 * 60);
  
  // Can't cancel if already completed, in progress, cancelled, or rejected
  if (['completed', 'in_progress', 'cancelled', 'rejected', 'no_show', 'stylist_no_show'].includes(this.status)) {
    return { canCancel: false, reason: 'Booking cannot be cancelled in current status' };
  }
  
  // Check if user is part of this booking
  const isCustomer = this.customerId.toString() === userId.toString();
  const isStylist = this.stylistId.toString() === userId.toString();
  
  if (!isCustomer && !isStylist) {
    return { canCancel: false, reason: 'User not authorized to cancel this booking' };
  }
  
  // Check cancellation policy (24 hours minimum)
  if (hoursUntilAppointment < 24) {
    return { 
      canCancel: true, 
      withPenalty: true,
      refundPercentage: 50,
      reason: 'Late cancellation - 50% refund'
    };
  }
  
  return { 
    canCancel: true, 
    withPenalty: false,
    refundPercentage: 100,
    reason: 'Full refund available'
  };
};

// Method to update booking status with validation
bookingSchema.methods.updateStatus = function(newStatus, updatedBy) {
  const validTransitions = {
    pending: ['accepted', 'rejected', 'confirmed', 'cancelled'],
    pending_approval: ['accepted', 'rejected', 'confirmed', 'cancelled'], // Stylist can approve or cancel
    accepted: ['confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'stylist_no_show'], // Added 'completed'
    confirmed: ['in_progress', 'completed', 'cancelled', 'no_show', 'stylist_no_show'], // Added 'completed'
    in_progress: ['completed', 'cancelled'],
    completed: [], // Terminal state
    cancelled: [], // Terminal state
    rejected: [], // Terminal state
    no_show: [], // Terminal state
    stylist_no_show: [] // Terminal state
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  
  // Set completion timestamp if completed
  if (newStatus === 'completed' && !this.completion.completedAt) {
    this.completion.completedAt = new Date();
  }
  
  // Set cancellation details if cancelled
  if (newStatus === 'cancelled' && !this.cancellation.cancelledAt) {
    this.cancellation.cancelledBy = updatedBy;
    this.cancellation.cancelledAt = new Date();
  }
  
  return this.save();
};

// Static method to find upcoming bookings for reminders
bookingSchema.statics.findUpcomingForReminders = function() {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);
  
  return this.find({
    status: { $in: ['confirmed', 'accepted', 'pending'] },
    appointmentDateTime: {
      $gte: now,
      $lte: in24Hours
    },
    $or: [
      { appointmentDateTime: { $lte: in24Hours }, 'reminders.sent24Hours': false },
      { appointmentDateTime: { $lte: in2Hours }, 'reminders.sent2Hours': false },
      { appointmentDateTime: { $lte: in30Minutes }, 'reminders.sent30Minutes': false }
    ]
  }).populate('customerId stylistId', 'name phone email deviceTokens');
};

// Static method to find overdue bookings
bookingSchema.statics.findOverdue = function() {
  const now = new Date();
  
  return this.find({
    status: 'pending',
    'confirmation.autoConfirmDeadline': { $lt: now }
  });
};

module.exports = mongoose.model('Booking', bookingSchema);