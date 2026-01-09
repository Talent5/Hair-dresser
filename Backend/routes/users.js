const express = require('express');
const User = require('../models/User');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { uploadSingleImage } = require('../middleware/uploadImage');
const { deleteImage } = require('../utils/imagekit');
const Joi = require('joi');
const router = express.Router();

// Note: Auth middleware is applied at the app level in server.js

// Validation schema for profile updates
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  phone: Joi.string().pattern(/^(\+263|0)[0-9]{9}$/), // Zimbabwe phone format
  bio: Joi.string().max(500).allow(''),
  location: Joi.object({
    address: Joi.string().allow(''),
    coordinates: Joi.array().items(Joi.number()).length(2)
  })
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    message: 'User profile retrieved successfully',
    data: { user }
  });
}));

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', asyncHandler(async (req, res) => {
  // Validate input
  const { error, value } = updateProfileSchema.validate(req.body);
  if (error) {
    throw new ValidationError('Invalid profile data', error.details.map(d => d.message));
  }

  const user = await User.findById(req.userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update user fields
  if (value.name) user.name = value.name;
  if (value.phone) user.phone = value.phone;
  if (value.bio !== undefined) user.bio = value.bio;
  if (value.location) {
    if (value.location.address) user.location.address = value.location.address;
    if (value.location.coordinates) user.location.coordinates = value.location.coordinates;
  }

  // Update last modified timestamp
  user.updatedAt = new Date();

  await user.save();

  // Return updated user without password
  const updatedUser = await User.findById(req.userId).select('-password');

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: updatedUser }
  });
}));

// @route   POST /api/users/profile/avatar
// @desc    Upload user profile avatar
// @access  Private
router.post('/profile/avatar', uploadSingleImage('avatar', 'profiles'), asyncHandler(async (req, res) => {
  if (!req.imageData) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided'
    });
  }

  const user = await User.findById(req.userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Delete old profile image if exists
  if (user.profileImage && user.profileImage.fileId) {
    try {
      await deleteImage(user.profileImage.fileId);
    } catch (error) {
      console.error('Error deleting old profile image:', error);
      // Continue even if deletion fails
    }
  }

  // Update user profile image
  user.profileImage = {
    url: req.imageData.url,
    fileId: req.imageData.fileId,
    thumbnailUrl: req.imageData.thumbnailUrl
  };
  user.updatedAt = new Date();

  await user.save();

  // Return updated user without password
  const updatedUser = await User.findById(req.userId).select('-password');

  res.json({
    success: true,
    message: 'Profile avatar uploaded successfully',
    data: { 
      user: updatedUser,
      avatar: req.imageData
    }
  });
}));

// @route   DELETE /api/users/profile/avatar
// @desc    Delete user profile avatar
// @access  Private
router.delete('/profile/avatar', asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!user.profileImage || !user.profileImage.fileId) {
    return res.status(400).json({
      success: false,
      message: 'No profile avatar to delete'
    });
  }

  // Delete from ImageKit
  try {
    await deleteImage(user.profileImage.fileId);
  } catch (error) {
    console.error('Error deleting profile image from ImageKit:', error);
    // Continue to remove from database even if ImageKit deletion fails
  }

  // Remove from user record
  user.profileImage = undefined;
  user.updatedAt = new Date();

  await user.save();

  const updatedUser = await User.findById(req.userId).select('-password');

  res.json({
    success: true,
    message: 'Profile avatar deleted successfully',
    data: { user: updatedUser }
  });
}));

module.exports = router;