const mongoose = require('mongoose');

const stylistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  specialties: [{
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
      'beard_grooming',
      'Haircuts & Styling',
      'Hair Extensions', 
      'Hair Treatments',
      'Hair Coloring'
    ]
  }],
  experience: {
    years: {
      type: Number,
      min: 0,
      max: 50
    },
    description: String
  },
  qualifications: [{
    title: String,
    institution: String,
    year: Number,
    verified: {
      type: Boolean,
      default: false
    }
  }],
  portfolio: [{
    imageUrl: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      maxlength: [200, 'Caption cannot exceed 200 characters']
    },
    service: {
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
        'beard_grooming',
        'Haircuts & Styling',
        'Hair Extensions', 
        'Hair Treatments',
        'Hair Coloring'
      ]
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    likes: {
      type: Number,
      default: 0
    }
  }],
  services: [{
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
        'beard_grooming',
        'Haircuts & Styling',
        'Hair Extensions', 
        'Hair Treatments',
        'Hair Coloring'
      ],
      required: true
    },
    basePrice: {
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },
    duration: {
      type: Number, // in minutes
      required: true,
      min: 15
    },
    description: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  availability: {
    schedule: [{
      dayOfWeek: {
        type: Number, // 0 = Sunday, 1 = Monday, etc.
        min: 0,
        max: 6,
        required: true
      },
      startTime: {
        type: String, // Format: "HH:MM"
        required: true,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
      },
      endTime: {
        type: String, // Format: "HH:MM"
        required: true,
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }],
    exceptions: [{
      date: {
        type: Date,
        required: true
      },
      isAvailable: {
        type: Boolean,
        default: false
      },
      reason: String,
      startTime: String,
      endTime: String
    }],
    advanceBookingDays: {
      type: Number,
      default: 30,
      min: 1,
      max: 90
    }
  },
  location: {
    isHomeBased: {
      type: Boolean,
      default: false
    },
    isMobile: {
      type: Boolean,
      default: true
    },
    homeStudio: {
      address: String,
      description: String,
      amenities: [String] // ['parking', 'wifi', 'refreshments', 'waiting_area']
    },
    mobileRadius: {
      type: Number, // in kilometers
      default: 10,
      min: 1,
      max: 50
    },
    additionalFee: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    breakdown: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },
  reviews: [{
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: [500, 'Review comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    response: {
      text: String,
      respondedAt: Date
    }
  }],
  statistics: {
    totalBookings: {
      type: Number,
      default: 0
    },
    completedBookings: {
      type: Number,
      default: 0
    },
    cancelledBookings: {
      type: Number,
      default: 0
    },
    noShows: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    averageBookingValue: {
      type: Number,
      default: 0
    },
    responseTime: {
      type: Number, // in minutes
      default: 0
    }
  },
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    documents: [{
      type: {
        type: String,
        enum: ['id', 'certificate', 'business_license']
      },
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      }
    }],
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  settings: {
    autoAcceptBookings: {
      type: Boolean,
      default: false
    },
    requireDeposit: {
      type: Boolean,
      default: true
    },
    cancellationPolicy: {
      hoursBeforeBooking: {
        type: Number,
        default: 24
      },
      refundPercentage: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
      }
    },
    notifications: {
      newBookings: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true }
    },
    payment: {
      bankDetails: {
        accountName: String,
        accountNumber: String,
        bankName: String,
        branchCode: String,
        swiftCode: String
      },
      paymentMethods: [{
        type: String,
        enum: ['bank_transfer', 'mobile_money', 'paypal', 'stripe'],
        isEnabled: { type: Boolean, default: false }
      }],
      taxSettings: {
        taxNumber: String,
        isVatRegistered: { type: Boolean, default: false },
        vatNumber: String
      },
      preferences: {
        autoWithdraw: { type: Boolean, default: false },
        minimumWithdrawAmount: { type: Number, default: 100 },
        withdrawDay: { type: Number, min: 1, max: 31, default: 1 } // Day of month
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumExpiresAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
stylistSchema.index({ userId: 1 });
stylistSchema.index({ specialties: 1 });
stylistSchema.index({ 'rating.average': -1 });
stylistSchema.index({ isActive: 1, 'verification.isVerified': 1 });
stylistSchema.index({ createdAt: -1 });

// Virtual for completion rate
stylistSchema.virtual('completionRate').get(function() {
  if (this.statistics.totalBookings === 0) return 0;
  return (this.statistics.completedBookings / this.statistics.totalBookings) * 100;
});

// Virtual for response rate
stylistSchema.virtual('responseRate').get(function() {
  // This would be calculated based on chat response times
  return 95; // Placeholder
});

// Method to update rating when new review is added
stylistSchema.methods.updateRating = function() {
  const totalReviews = this.reviews.length;
  if (totalReviews === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
    return;
  }

  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.rating.average = Math.round((sum / totalReviews) * 10) / 10; // Round to 1 decimal
  this.rating.count = totalReviews;

  // Update breakdown
  this.rating.breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  this.reviews.forEach(review => {
    this.rating.breakdown[review.rating]++;
  });
};

// Method to check availability for a specific date and time
stylistSchema.methods.isAvailable = function(date, startTime, duration) {
  const dayOfWeek = date.getDay();
  const dateStr = date.toISOString().split('T')[0];

  // Check for exceptions first
  const exception = this.availability.exceptions.find(exc => 
    exc.date.toISOString().split('T')[0] === dateStr
  );

  if (exception) {
    return exception.isAvailable && 
           this.isTimeSlotAvailable(exception.startTime || '09:00', 
                                   exception.endTime || '17:00', 
                                   startTime, duration);
  }

  // Check regular schedule
  const daySchedule = this.availability.schedule.find(sched => 
    sched.dayOfWeek === dayOfWeek && sched.isAvailable
  );

  if (!daySchedule) return false;

  return this.isTimeSlotAvailable(daySchedule.startTime, daySchedule.endTime, startTime, duration);
};

// Helper method to check if time slot is available
stylistSchema.methods.isTimeSlotAvailable = function(dayStart, dayEnd, requestedStart, duration) {
  const toMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const dayStartMinutes = toMinutes(dayStart);
  const dayEndMinutes = toMinutes(dayEnd);
  const requestedStartMinutes = toMinutes(requestedStart);
  const requestedEndMinutes = requestedStartMinutes + duration;

  return requestedStartMinutes >= dayStartMinutes && 
         requestedEndMinutes <= dayEndMinutes;
};

// Static method to update stylist ratings from Rating collection
stylistSchema.statics.updateStylistRatings = async function(stylistProfileId) {
  try {
    const Rating = mongoose.model('Rating');
    
    // Calculate new rating statistics
    const stats = await Rating.aggregate([
      {
        $match: {
          stylistProfileId: new mongoose.Types.ObjectId(stylistProfileId),
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$overallRating' },
          ratingDistribution: { $push: '$overallRating' }
        }
      }
    ]);

    const stylist = await this.findById(stylistProfileId);
    if (!stylist) return;

    if (stats.length > 0) {
      const stat = stats[0];
      stylist.rating.average = Math.round(stat.averageRating * 10) / 10;
      stylist.rating.count = stat.totalRatings;

      // Update breakdown
      stylist.rating.breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      stat.ratingDistribution.forEach(rating => {
        const roundedRating = Math.floor(rating);
        if (stylist.rating.breakdown[roundedRating] !== undefined) {
          stylist.rating.breakdown[roundedRating]++;
        }
      });
    } else {
      // No ratings
      stylist.rating.average = 0;
      stylist.rating.count = 0;
      stylist.rating.breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    }

    await stylist.save();
  } catch (error) {
    console.error('Error updating stylist ratings:', error);
  }
};

// Static method to find stylists by service and location
stylistSchema.statics.findByServiceAndLocation = function(service, longitude, latitude, maxDistance = 5000) {
  return this.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $match: {
        'services.category': service,
        'isActive': true,
        'verification.isVerified': true,
        'user.location': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            $maxDistance: maxDistance
          }
        }
      }
    },
    {
      $addFields: {
        distance: {
          $multiply: [
            {
              $sqrt: {
                $add: [
                  {
                    $pow: [
                      { $subtract: [{ $arrayElemAt: ['$user.location.coordinates', 0] }, longitude] },
                      2
                    ]
                  },
                  {
                    $pow: [
                      { $subtract: [{ $arrayElemAt: ['$user.location.coordinates', 1] }, latitude] },
                      2
                    ]
                  }
                ]
              }
            },
            111320 // Convert degrees to meters approximately
          ]
        }
      }
    },
    {
      $sort: { 'rating.average': -1, distance: 1 }
    }
  ]);
};

module.exports = mongoose.model('Stylist', stylistSchema);