const express = require('express');
const Favorite = require('../models/Favorite');
const User = require('../models/User');
const Stylist = require('../models/Stylist');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/favorites
// @desc    Get user's favorite stylists
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, sortBy, limit = 50 } = req.query;

    const favorites = await Favorite.getUserFavoritesWithDetails(userId, {
      category,
      sortBy,
      limit: parseInt(limit)
    });

    // Calculate distances if user has location
    const favoritesWithDistance = favorites.map(favorite => {
      let distance = null;
      if (req.user.location && req.user.location.coordinates && 
          favorite.location && favorite.location.coordinates) {
        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in km
        const [userLng, userLat] = req.user.location.coordinates;
        const [stylistLng, stylistLat] = favorite.location.coordinates;
        
        const dLat = (stylistLat - userLat) * Math.PI / 180;
        const dLng = (stylistLng - userLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(userLat * Math.PI / 180) * Math.cos(stylistLat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;
      }

      return {
        id: favorite._id.toString(),
        stylistId: favorite.stylistId.toString(),
        name: favorite.name,
        businessName: favorite.businessName,
        avatar: favorite.avatar,
        rating: favorite.rating || 5.0,
        reviewCount: favorite.reviewCount || 0,
        specialties: favorite.specialties || [],
        location: {
          address: favorite.location?.address || '',
          distance: distance ? Math.round(distance * 10) / 10 : null
        },
        pricing: {
          minPrice: favorite.pricing?.minPrice || 0,
          maxPrice: favorite.pricing?.maxPrice || 0
        },
        isAvailable: favorite.isAvailable !== false,
        lastBookedAt: favorite.lastBookedAt,
        notes: favorite.notes,
        category: favorite.category,
        addedAt: favorite.createdAt,
        bookingCount: favorite.bookingCount,
        totalSpent: favorite.totalSpent,
        priority: favorite.priority
      };
    });

    res.json({
      success: true,
      data: favoritesWithDistance
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching favorites'
    });
  }
});

// @route   POST /api/favorites
// @desc    Add stylist to favorites
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { stylistId, notes, category, tags } = req.body;

    if (!stylistId) {
      return res.status(400).json({
        success: false,
        message: 'Stylist ID is required'
      });
    }

    // Check if stylist exists
    const stylist = await User.findById(stylistId);
    if (!stylist || stylist.role !== 'stylist') {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }

    // Get stylist profile
    const stylistProfile = await Stylist.findOne({ userId: stylistId });
    if (!stylistProfile) {
      return res.status(404).json({
        success: false,
        message: 'Stylist profile not found'
      });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ userId, stylistId });
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Stylist is already in your favorites'
      });
    }

    // Auto-categorize based on stylist's main specialty
    let autoCategory = category;
    if (!autoCategory && stylistProfile.specialties && stylistProfile.specialties.length > 0) {
      const mainSpecialty = stylistProfile.specialties[0].toLowerCase();
      if (mainSpecialty.includes('braid')) autoCategory = 'braids';
      else if (mainSpecialty.includes('natural')) autoCategory = 'natural';
      else if (mainSpecialty.includes('cut')) autoCategory = 'cuts';
      else if (mainSpecialty.includes('color')) autoCategory = 'color';
      else if (mainSpecialty.includes('loc')) autoCategory = 'locs';
    }

    // Create favorite
    const favorite = new Favorite({
      userId,
      stylistId,
      stylistProfileId: stylistProfile._id,
      notes,
      category: autoCategory,
      tags: tags || []
    });

    await favorite.save();

    // Populate the favorite data
    const populatedFavorite = await Favorite.findById(favorite._id)
      .populate('stylistId', 'name avatar location')
      .populate('stylistProfileId', 'businessName specialties rating reviewCount pricing isAvailable');

    res.status(201).json({
      success: true,
      data: populatedFavorite,
      message: 'Stylist added to favorites successfully'
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Stylist is already in your favorites'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while adding favorite'
    });
  }
});

// @route   DELETE /api/favorites/:stylistId
// @desc    Remove stylist from favorites
// @access  Private
router.delete('/:stylistId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { stylistId } = req.params;

    const favorite = await Favorite.findOneAndDelete({ userId, stylistId });
    
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    res.json({
      success: true,
      message: 'Stylist removed from favorites successfully'
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing favorite'
    });
  }
});

// @route   PATCH /api/favorites/:stylistId/notes
// @desc    Update favorite notes
// @access  Private
router.patch('/:stylistId/notes', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { stylistId } = req.params;
    const { notes } = req.body;

    const favorite = await Favorite.findOneAndUpdate(
      { userId, stylistId },
      { notes },
      { new: true }
    ).populate('stylistId', 'name avatar')
     .populate('stylistProfileId', 'businessName');

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    res.json({
      success: true,
      data: favorite,
      message: 'Notes updated successfully'
    });
  } catch (error) {
    console.error('Error updating favorite notes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notes'
    });
  }
});

// @route   PATCH /api/favorites/:stylistId
// @desc    Update favorite details (category, tags, priority)
// @access  Private
router.patch('/:stylistId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { stylistId } = req.params;
    const { category, tags, priority, notes } = req.body;

    const updateData = {};
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (priority !== undefined) updateData.priority = priority;
    if (notes !== undefined) updateData.notes = notes;

    const favorite = await Favorite.findOneAndUpdate(
      { userId, stylistId },
      updateData,
      { new: true }
    ).populate('stylistId', 'name avatar')
     .populate('stylistProfileId', 'businessName specialties rating reviewCount');

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    res.json({
      success: true,
      data: favorite,
      message: 'Favorite updated successfully'
    });
  } catch (error) {
    console.error('Error updating favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating favorite'
    });
  }
});

// @route   GET /api/favorites/:stylistId/check
// @desc    Check if stylist is favorited
// @access  Private
router.get('/:stylistId/check', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { stylistId } = req.params;

    const isFavorite = await Favorite.isFavorite(userId, stylistId);

    res.json({
      success: true,
      data: { isFavorite }
    });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking favorite'
    });
  }
});

// @route   GET /api/favorites/stats
// @desc    Get user's favorites statistics
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await Favorite.getUserFavoriteStats(userId);
    
    res.json({
      success: true,
      data: stats[0] || {
        totalFavorites: 0,
        totalBookings: 0,
        totalSpent: 0,
        recentBookings: 0,
        categoryCounts: {}
      }
    });
  } catch (error) {
    console.error('Error fetching favorite stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stats'
    });
  }
});

// @route   POST /api/favorites/:stylistId/booking-update
// @desc    Update favorite booking statistics (called after successful booking)
// @access  Private
router.post('/:stylistId/booking-update', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { stylistId } = req.params;
    const { bookingAmount } = req.body;

    const favorite = await Favorite.findOne({ userId, stylistId });
    
    if (favorite) {
      await favorite.updateBookingStats(bookingAmount);
    }

    res.json({
      success: true,
      message: 'Booking statistics updated'
    });
  } catch (error) {
    console.error('Error updating booking stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating booking stats'
    });
  }
});

module.exports = router;