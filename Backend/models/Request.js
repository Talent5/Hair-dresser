const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  styleDescription: {
    type: String,
    required: true,
    trim: true
  },
  offerPrice: {
    type: Number,
    required: true,
    min: 0
  },
  preferredTime: {
    type: String,
    trim: true
  },
  additionalNotes: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'offered', 'accepted', 'completed', 'cancelled'],
    default: 'pending'
  },
  acceptedOfferId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    default: null
  },
  acceptedStylistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Create 2dsphere index for location-based queries
RequestSchema.index({ location: '2dsphere' });

// Index for efficient querying
RequestSchema.index({ status: 1, createdAt: -1 });
RequestSchema.index({ clientId: 1, createdAt: -1 });

module.exports = mongoose.model('Request', RequestSchema);