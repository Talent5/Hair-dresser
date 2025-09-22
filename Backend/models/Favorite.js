const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({
  userId: {
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
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['braids', 'natural', 'cuts', 'color', 'locs', 'extensions', 'treatments', 'styling'],
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  lastBookedAt: {
    type: Date,
    default: null
  },
  bookingCount: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  isNotificationEnabled: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, {
  timestamps: true
});

// Create compound index to prevent duplicate favorites
FavoriteSchema.index({ userId: 1, stylistId: 1 }, { unique: true });

// Index for efficient querying
FavoriteSchema.index({ userId: 1, createdAt: -1 });
FavoriteSchema.index({ stylistId: 1 });
FavoriteSchema.index({ category: 1 });
FavoriteSchema.index({ lastBookedAt: -1 });

// Virtual for time since last booking
FavoriteSchema.virtual('daysSinceLastBooking').get(function() {
  if (!this.lastBookedAt) return null;
  const now = new Date();
  const diffTime = Math.abs(now - this.lastBookedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to update booking statistics
FavoriteSchema.methods.updateBookingStats = function(bookingAmount) {
  this.lastBookedAt = new Date();
  this.bookingCount += 1;
  this.totalSpent += bookingAmount || 0;
  return this.save();
};

// Static method to get user's favorite stylists with full details
FavoriteSchema.statics.getUserFavoritesWithDetails = function(userId, options = {}) {
  const { category, limit = 50, sortBy = 'createdAt', sortOrder = -1 } = options;
  
  let matchStage = { userId: new mongoose.Types.ObjectId(userId) };
  if (category && category !== 'all') {
    if (category === 'recent') {
      matchStage.lastBookedAt = { $ne: null };
    } else {
      matchStage.category = category;
    }
  }

  const sortStage = {};
  if (sortBy === 'recent' && category === 'recent') {
    sortStage.lastBookedAt = -1;
  } else {
    sortStage[sortBy] = sortOrder;
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'users',
        localField: 'stylistId',
        foreignField: '_id',
        as: 'stylistUser'
      }
    },
    {
      $lookup: {
        from: 'stylists',
        localField: 'stylistProfileId',
        foreignField: '_id',
        as: 'stylistProfile'
      }
    },
    { $unwind: '$stylistUser' },
    { $unwind: '$stylistProfile' },
    {
      $project: {
        _id: 1,
        userId: 1,
        stylistId: 1,
        notes: 1,
        category: 1,
        tags: 1,
        lastBookedAt: 1,
        bookingCount: 1,
        totalSpent: 1,
        priority: 1,
        createdAt: 1,
        updatedAt: 1,
        name: '$stylistUser.name',
        avatar: '$stylistUser.avatar',
        location: '$stylistUser.location',
        businessName: '$stylistProfile.businessName',
        specialties: '$stylistProfile.specialties',
        rating: '$stylistProfile.rating',
        reviewCount: '$stylistProfile.reviewCount',
        pricing: '$stylistProfile.pricing',
        isAvailable: '$stylistProfile.isAvailable',
        portfolio: '$stylistProfile.portfolio'
      }
    },
    { $sort: sortStage },
    { $limit: limit }
  ]);
};

// Static method to check if a stylist is favorited by a user
FavoriteSchema.statics.isFavorite = function(userId, stylistId) {
  return this.findOne({ userId, stylistId }).then(favorite => !!favorite);
};

// Static method to get favorite statistics for a user
FavoriteSchema.statics.getUserFavoriteStats = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalFavorites: { $sum: 1 },
        totalBookings: { $sum: '$bookingCount' },
        totalSpent: { $sum: '$totalSpent' },
        categoryCounts: {
          $push: {
            $cond: [
              { $ne: ['$category', null] },
              '$category',
              'uncategorized'
            ]
          }
        },
        recentBookings: {
          $sum: {
            $cond: [
              { $ne: ['$lastBookedAt', null] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalFavorites: 1,
        totalBookings: 1,
        totalSpent: 1,
        recentBookings: 1,
        categoryCounts: {
          $reduce: {
            input: '$categoryCounts',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                {
                  $arrayToObject: [[
                    { k: '$$this', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1] } }
                  ]]
                }
              ]
            }
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Favorite', FavoriteSchema);