const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  // Core relationship fields
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    validate: {
      validator: async function(customerId) {
        const User = mongoose.model('User');
        const user = await User.findById(customerId);
        return user && user.role === 'customer';
      },
      message: 'Customer ID must reference a valid customer user'
    }
  },
  stylistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    validate: {
      validator: async function(stylistId) {
        const User = mongoose.model('User');
        const user = await User.findById(stylistId);
        return user && user.role === 'stylist';
      },
      message: 'Stylist ID must reference a valid stylist user'
    }
  },
  stylistProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stylist',
    required: true
  },

  // Rating details
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: function(rating) {
        return Number.isInteger(rating * 2); // Allow half stars (1, 1.5, 2, 2.5, etc.)
      },
      message: 'Rating must be in increments of 0.5'
    }
  },

  // Detailed rating breakdown
  ratingBreakdown: {
    serviceQuality: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: function(rating) {
          return Number.isInteger(rating * 2);
        },
        message: 'Service quality rating must be in increments of 0.5'
      }
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: function(rating) {
          return Number.isInteger(rating * 2);
        },
        message: 'Professionalism rating must be in increments of 0.5'
      }
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: function(rating) {
          return Number.isInteger(rating * 2);
        },
        message: 'Communication rating must be in increments of 0.5'
      }
    },
    timeliness: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: function(rating) {
          return Number.isInteger(rating * 2);
        },
        message: 'Timeliness rating must be in increments of 0.5'
      }
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: function(rating) {
          return Number.isInteger(rating * 2);
        },
        message: 'Value for money rating must be in increments of 0.5'
      }
    }
  },

  // Review content
  review: {
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Review title cannot exceed 100 characters']
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters']
    },
    pros: [{
      type: String,
      trim: true,
      maxlength: [200, 'Pro item cannot exceed 200 characters']
    }],
    cons: [{
      type: String,
      trim: true,
      maxlength: [200, 'Con item cannot exceed 200 characters']
    }]
  },

  // Service-specific details
  serviceDetails: {
    serviceName: {
      type: String,
      required: true
    },
    serviceCategory: {
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
    actualDuration: {
      type: Number, // in minutes
      min: 0
    },
    finalPrice: {
      type: Number,
      min: 0
    }
  },

  // Additional feedback
  wouldRecommend: {
    type: Boolean,
    default: null
  },
  wouldBookAgain: {
    type: Boolean,
    default: null
  },

  // Media attachments
  photos: [{
    url: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      maxlength: [200, 'Photo caption cannot exceed 200 characters']
    },
    type: {
      type: String,
      enum: ['before', 'after', 'process'],
      default: 'after'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Stylist response
  stylistResponse: {
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Stylist response cannot exceed 500 characters']
    },
    respondedAt: {
      type: Date
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  },

  // Moderation and status
  status: {
    type: String,
    enum: ['pending', 'approved', 'flagged', 'rejected', 'hidden'],
    default: 'approved'
  },
  moderationDetails: {
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: {
      type: Date
    },
    reason: {
      type: String,
      maxlength: [200, 'Moderation reason cannot exceed 200 characters']
    },
    notes: {
      type: String,
      maxlength: [500, 'Moderation notes cannot exceed 500 characters']
    }
  },

  // Engagement metrics
  helpfulVotes: {
    helpful: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }],
    notHelpful: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Verification
  isVerified: {
    type: Boolean,
    default: true // Automatically verified if linked to a completed booking
  },
  verificationDetails: {
    method: {
      type: String,
      enum: ['booking_verification', 'manual_verification', 'photo_verification'],
      default: 'booking_verification'
    },
    verifiedAt: {
      type: Date,
      default: Date.now
    }
  },

  // Analytics and tracking
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    },
    reportCount: {
      type: Number,
      default: 0
    },
    lastViewedAt: {
      type: Date
    }
  },

  // Metadata
  source: {
    type: String,
    enum: ['mobile_app', 'web_app', 'admin_panel'],
    default: 'mobile_app'
  },
  ipAddress: {
    type: String
  },
  deviceInfo: {
    platform: {
      type: String,
      enum: ['ios', 'android', 'web']
    },
    version: String,
    userAgent: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
ratingSchema.index({ stylistId: 1, createdAt: -1 });
ratingSchema.index({ stylistProfileId: 1, status: 1 });
ratingSchema.index({ bookingId: 1 }, { unique: true }); // One rating per booking
ratingSchema.index({ customerId: 1, createdAt: -1 });
ratingSchema.index({ overallRating: -1 });
ratingSchema.index({ status: 1, createdAt: -1 });
ratingSchema.index({ 'serviceDetails.serviceCategory': 1, overallRating: -1 });

// Compound indexes
ratingSchema.index({ stylistId: 1, overallRating: -1, status: 1 });
ratingSchema.index({ 'serviceDetails.serviceCategory': 1, stylistId: 1 });

// Virtual for helpful score
ratingSchema.virtual('helpfulScore').get(function() {
  const helpful = this.helpfulVotes.helpful.length;
  const notHelpful = this.helpfulVotes.notHelpful.length;
  const total = helpful + notHelpful;
  
  if (total === 0) return 0;
  return Math.round((helpful / total) * 100);
});

// Virtual for time since rating
ratingSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
});

// Virtual for average detailed rating
ratingSchema.virtual('averageDetailedRating').get(function() {
  const breakdown = this.ratingBreakdown;
  const ratings = [
    breakdown.serviceQuality,
    breakdown.professionalism,
    breakdown.communication,
    breakdown.timeliness,
    breakdown.valueForMoney
  ].filter(rating => rating != null);
  
  if (ratings.length === 0) return null;
  
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 2) / 2; // Round to nearest 0.5
});

// Pre-save middleware to validate booking relationship
ratingSchema.pre('save', async function(next) {
  try {
    // Verify that the booking exists and involves the correct parties
    const Booking = mongoose.model('Booking');
    const booking = await Booking.findById(this.bookingId);
    
    if (!booking) {
      return next(new Error('Referenced booking does not exist'));
    }
    
    if (booking.customerId.toString() !== this.customerId.toString()) {
      return next(new Error('Customer ID does not match booking customer'));
    }
    
    if (booking.stylistId.toString() !== this.stylistId.toString()) {
      return next(new Error('Stylist ID does not match booking stylist'));
    }
    
    if (booking.status !== 'completed') {
      return next(new Error('Cannot rate booking that is not completed'));
    }
    
    // Auto-populate service details from booking if not provided
    if (!this.serviceDetails.serviceName) {
      this.serviceDetails.serviceName = booking.service.name;
      this.serviceDetails.serviceCategory = booking.service.category;
      this.serviceDetails.actualDuration = booking.completion.actualDuration;
      this.serviceDetails.finalPrice = booking.pricing.totalAmount;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware to update stylist's rating statistics
ratingSchema.post('save', async function(doc) {
  try {
    const Stylist = mongoose.model('Stylist');
    await Stylist.updateStylistRatings(doc.stylistProfileId);
  } catch (error) {
    console.error('Error updating stylist ratings:', error);
  }
});

// Post-remove middleware to update stylist's rating statistics
ratingSchema.post('remove', async function(doc) {
  try {
    const Stylist = mongoose.model('Stylist');
    await Stylist.updateStylistRatings(doc.stylistProfileId);
  } catch (error) {
    console.error('Error updating stylist ratings after removal:', error);
  }
});

// Instance method to check if user can vote on helpfulness
ratingSchema.methods.canUserVote = function(userId) {
  // Users cannot vote on their own ratings
  if (this.customerId.toString() === userId.toString()) {
    return { canVote: false, reason: 'Cannot vote on your own rating' };
  }
  
  // Check if user has already voted
  const hasVotedHelpful = this.helpfulVotes.helpful.some(
    vote => vote.userId.toString() === userId.toString()
  );
  const hasVotedNotHelpful = this.helpfulVotes.notHelpful.some(
    vote => vote.userId.toString() === userId.toString()
  );
  
  if (hasVotedHelpful || hasVotedNotHelpful) {
    return { canVote: false, reason: 'User has already voted on this rating' };
  }
  
  return { canVote: true };
};

// Instance method to add helpful vote
ratingSchema.methods.addHelpfulVote = function(userId, isHelpful) {
  const voteCheck = this.canUserVote(userId);
  if (!voteCheck.canVote) {
    throw new Error(voteCheck.reason);
  }
  
  const vote = { userId, votedAt: new Date() };
  
  if (isHelpful) {
    this.helpfulVotes.helpful.push(vote);
  } else {
    this.helpfulVotes.notHelpful.push(vote);
  }
  
  return this.save();
};

// Static method to get rating statistics for a stylist
ratingSchema.statics.getStylistRatingStats = function(stylistId) {
  return this.aggregate([
    {
      $match: {
        stylistId: mongoose.Types.ObjectId(stylistId),
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        totalRatings: { $sum: 1 },
        averageOverall: { $avg: '$overallRating' },
        averageServiceQuality: { $avg: '$ratingBreakdown.serviceQuality' },
        averageProfessionalism: { $avg: '$ratingBreakdown.professionalism' },
        averageCommunication: { $avg: '$ratingBreakdown.communication' },
        averageTimeliness: { $avg: '$ratingBreakdown.timeliness' },
        averageValueForMoney: { $avg: '$ratingBreakdown.valueForMoney' },
        ratingDistribution: {
          $push: '$overallRating'
        },
        recommendationRate: {
          $avg: {
            $cond: [{ $eq: ['$wouldRecommend', true] }, 1, 0]
          }
        },
        returnRate: {
          $avg: {
            $cond: [{ $eq: ['$wouldBookAgain', true] }, 1, 0]
          }
        }
      }
    },
    {
      $addFields: {
        ratingBreakdown: {
          5: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 5] }
              }
            }
          },
          4: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $gte: ['$$this', 4] }
              }
            }
          },
          3: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $gte: ['$$this', 3] }
              }
            }
          },
          2: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $gte: ['$$this', 2] }
              }
            }
          },
          1: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $gte: ['$$this', 1] }
              }
            }
          }
        }
      }
    },
    {
      $project: {
        ratingDistribution: 0
      }
    }
  ]);
};

// Static method to get recent ratings for a stylist
ratingSchema.statics.getRecentRatings = function(stylistId, limit = 10) {
  return this.find({
    stylistId,
    status: 'approved'
  })
  .populate('customerId', 'name profileImage')
  .sort({ createdAt: -1 })
  .limit(limit)
  .select('-ipAddress -deviceInfo');
};

module.exports = mongoose.model('Rating', ratingSchema);