const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  stylistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedTime: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  portfolio: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Prevent duplicate offers from the same stylist for the same request
OfferSchema.index({ requestId: 1, stylistId: 1 }, { unique: true });

// Index for efficient querying
OfferSchema.index({ requestId: 1, createdAt: -1 });
OfferSchema.index({ stylistId: 1, createdAt: -1 });
OfferSchema.index({ status: 1 });

module.exports = mongoose.model('Offer', OfferSchema);