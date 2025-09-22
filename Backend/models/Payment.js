const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
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
  type: {
    type: String,
    enum: ['deposit', 'full_payment', 'refund', 'penalty'],
    required: true
  },
  amount: {
    value: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'ZWL']
    }
  },
  status: {
    type: String,
    enum: [
      'pending',        // Payment initiated but not processed
      'processing',     // Being processed by payment gateway
      'held',          // Money held in escrow
      'completed',     // Payment successful and released
      'failed',        // Payment failed
      'cancelled',     // Payment cancelled
      'refunded',      // Payment refunded
      'disputed'       // Payment disputed
    ],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['ecocash', 'zipit', 'bank_transfer', 'cash'],
    required: true
  },
  ecocash: {
    transactionId: String,
    pollUrl: String,
    merchantTransactionId: String,
    customerPhone: {
      type: String,
      match: [/^(\+263|0)[7-9][0-9]{8}$/, 'Please enter a valid Zimbabwean phone number']
    },
    reference: String,
    statusCode: String,
    statusMessage: String,
    amount: Number,
    fees: Number,
    netAmount: Number
  },
  escrow: {
    isEscrow: {
      type: Boolean,
      default: true
    },
    heldAt: Date,
    releaseConditions: {
      type: String,
      enum: ['service_completion', 'customer_confirmation', 'automatic_timeout'],
      default: 'service_completion'
    },
    releaseScheduledAt: Date, // Automatic release date if no confirmation
    releasedAt: Date,
    releasedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    releaseReason: String
  },
  timeline: [{
    status: {
      type: String,
      enum: ['pending', 'processing', 'held', 'completed', 'failed', 'cancelled', 'refunded', 'disputed']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    description: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  fees: {
    platformFee: {
      percentage: {
        type: Number,
        default: 5 // 5% platform fee
      },
      amount: Number
    },
    paymentGatewayFee: {
      percentage: Number,
      fixedAmount: Number,
      totalAmount: Number
    },
    totalFees: Number
  },
  refund: {
    refundId: String,
    refundAmount: Number,
    refundReason: {
      type: String,
      enum: [
        'cancellation',
        'no_show',
        'service_not_delivered',
        'quality_issue',
        'dispute_resolution',
        'other'
      ]
    },
    refundedAt: Date,
    refundTransactionId: String,
    refundStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed']
    }
  },
  dispute: {
    isDisputed: {
      type: Boolean,
      default: false
    },
    disputeId: String,
    disputedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    disputeReason: String,
    disputedAt: Date,
    resolution: {
      status: {
        type: String,
        enum: ['pending', 'investigating', 'resolved', 'escalated']
      },
      resolvedAt: Date,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      resolution: String,
      refundAmount: Number
    }
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    paymentGatewayResponse: mongoose.Schema.Types.Mixed,
    retryCount: {
      type: Number,
      default: 0
    },
    notes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ customerId: 1 });
paymentSchema.index({ stylistId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ 'ecocash.transactionId': 1 });
paymentSchema.index({ 'ecocash.merchantTransactionId': 1 });
paymentSchema.index({ createdAt: -1 });

// Compound indexes
paymentSchema.index({ customerId: 1, status: 1 });
paymentSchema.index({ status: 1, 'escrow.releaseScheduledAt': 1 });

// Virtual for net amount after fees
paymentSchema.virtual('netAmount').get(function() {
  return this.amount.value - (this.fees.totalFees || 0);
});

// Virtual for escrow hold duration
paymentSchema.virtual('escrowHoldDuration').get(function() {
  if (!this.escrow.heldAt) return null;
  
  const releaseDate = this.escrow.releasedAt || new Date();
  const holdDuration = releaseDate - this.escrow.heldAt;
  
  return Math.floor(holdDuration / (1000 * 60 * 60 * 24)); // days
});

// Pre-save middleware to calculate fees
paymentSchema.pre('save', function(next) {
  if (this.isModified('amount.value') || this.isNew) {
    // Calculate platform fee
    this.fees.platformFee.amount = Math.round(
      (this.amount.value * this.fees.platformFee.percentage / 100) * 100
    ) / 100;
    
    // Calculate payment gateway fees (Ecocash charges ~1.5%)
    if (this.paymentMethod === 'ecocash') {
      this.fees.paymentGatewayFee.percentage = 1.5;
      this.fees.paymentGatewayFee.totalAmount = Math.round(
        (this.amount.value * 1.5 / 100) * 100
      ) / 100;
    }
    
    // Calculate total fees
    this.fees.totalFees = (this.fees.platformFee.amount || 0) + 
                         (this.fees.paymentGatewayFee.totalAmount || 0);
  }
  
  next();
});

// Method to add timeline entry
paymentSchema.methods.addTimelineEntry = function(status, description, metadata = {}) {
  this.timeline.push({
    status,
    description,
    metadata,
    timestamp: new Date()
  });
  
  this.status = status;
  return this.save();
};

// Method to process Ecocash payment
paymentSchema.methods.processEcocashPayment = async function(customerPhone) {
  try {
    // Mock Ecocash API integration
    const merchantTransactionId = `CM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate API call to Ecocash
    const ecocashResponse = await this.mockEcocashAPI({
      amount: this.amount.value,
      customerPhone,
      merchantTransactionId,
      description: `CurlMap Booking Payment - ${this.bookingId}`
    });
    
    // Update payment with Ecocash details
    this.ecocash = {
      transactionId: ecocashResponse.transactionId,
      pollUrl: ecocashResponse.pollUrl,
      merchantTransactionId,
      customerPhone,
      reference: ecocashResponse.reference,
      statusCode: ecocashResponse.statusCode,
      statusMessage: ecocashResponse.statusMessage
    };
    
    // Add timeline entry
    this.addTimelineEntry('processing', 'Ecocash payment initiated', ecocashResponse);
    
    return {
      success: true,
      transactionId: ecocashResponse.transactionId,
      pollUrl: ecocashResponse.pollUrl,
      message: 'Please complete payment on your phone'
    };
    
  } catch (error) {
    this.addTimelineEntry('failed', `Payment failed: ${error.message}`);
    throw error;
  }
};

// Mock Ecocash API method (replace with real implementation)
paymentSchema.methods.mockEcocashAPI = async function(paymentData) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock successful response (90% success rate for testing)
  const isSuccess = Math.random() > 0.1;
  
  if (isSuccess) {
    return {
      transactionId: `ECO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pollUrl: `https://api.ecocash.co.zw/v1/transactions/poll/${Date.now()}`,
      reference: `REF_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      statusCode: 'PENDING',
      statusMessage: 'Transaction initiated successfully',
      fees: paymentData.amount * 0.015 // 1.5% fee
    };
  } else {
    throw new Error('Ecocash service temporarily unavailable');
  }
};

// Method to check payment status (for polling)
paymentSchema.methods.checkPaymentStatus = async function() {
  if (!this.ecocash.pollUrl) {
    throw new Error('No poll URL available for this payment');
  }
  
  try {
    // Mock status check (replace with real API call)
    const statusResponse = await this.mockEcocashStatusCheck();
    
    // Update payment status based on response
    if (statusResponse.status === 'COMPLETED') {
      this.status = this.escrow.isEscrow ? 'held' : 'completed';
      this.ecocash.statusCode = 'COMPLETED';
      this.ecocash.statusMessage = 'Payment completed successfully';
      
      if (this.escrow.isEscrow) {
        this.escrow.heldAt = new Date();
        // Auto-release after 7 days if no disputes
        this.escrow.releaseScheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
      
      this.addTimelineEntry(
        this.status, 
        this.escrow.isEscrow ? 'Payment held in escrow' : 'Payment completed'
      );
      
    } else if (statusResponse.status === 'FAILED') {
      this.status = 'failed';
      this.ecocash.statusCode = 'FAILED';
      this.ecocash.statusMessage = statusResponse.message;
      
      this.addTimelineEntry('failed', `Payment failed: ${statusResponse.message}`);
    }
    
    return this.save();
    
  } catch (error) {
    throw new Error(`Failed to check payment status: ${error.message}`);
  }
};

// Mock status check method
paymentSchema.methods.mockEcocashStatusCheck = async function() {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock status progression
  const statuses = ['PENDING', 'COMPLETED', 'FAILED'];
  const weights = [0.2, 0.75, 0.05]; // 75% success rate
  
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < statuses.length; i++) {
    cumulativeWeight += weights[i];
    if (random <= cumulativeWeight) {
      return {
        status: statuses[i],
        message: statuses[i] === 'FAILED' ? 'Insufficient funds' : 'Transaction processed'
      };
    }
  }
  
  return { status: 'COMPLETED', message: 'Transaction processed' };
};

// Method to release escrow payment
paymentSchema.methods.releaseEscrow = function(releasedBy, reason = 'Service completion confirmed') {
  if (!this.escrow.isEscrow) {
    throw new Error('This payment is not held in escrow');
  }
  
  if (this.status !== 'held') {
    throw new Error('Payment is not in escrow status');
  }
  
  this.status = 'completed';
  this.escrow.releasedAt = new Date();
  this.escrow.releasedBy = releasedBy;
  this.escrow.releaseReason = reason;
  
  this.addTimelineEntry('completed', `Escrow released: ${reason}`);
  
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = async function(refundAmount, reason) {
  if (this.status !== 'held' && this.status !== 'completed') {
    throw new Error('Payment cannot be refunded in current status');
  }
  
  try {
    // Mock refund API call
    const refundResponse = await this.mockEcocashRefund({
      originalTransactionId: this.ecocash.transactionId,
      refundAmount,
      reason
    });
    
    this.refund = {
      refundId: refundResponse.refundId,
      refundAmount,
      refundReason: reason,
      refundedAt: new Date(),
      refundTransactionId: refundResponse.transactionId,
      refundStatus: 'completed'
    };
    
    this.status = 'refunded';
    this.addTimelineEntry('refunded', `Refund processed: ${reason}`);
    
    return this.save();
    
  } catch (error) {
    this.addTimelineEntry('failed', `Refund failed: ${error.message}`);
    throw error;
  }
};

// Mock refund method
paymentSchema.methods.mockEcocashRefund = async function(refundData) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    refundId: `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    transactionId: `ECO_REF_${Date.now()}`,
    status: 'COMPLETED',
    message: 'Refund processed successfully'
  };
};

// Static method to find payments due for auto-release
paymentSchema.statics.findDueForAutoRelease = function() {
  const now = new Date();
  
  return this.find({
    status: 'held',
    'escrow.isEscrow': true,
    'escrow.releaseScheduledAt': { $lte: now },
    'escrow.releasedAt': { $exists: false }
  });
};

// Static method to get payment statistics
paymentSchema.statics.getStatistics = function(dateRange = {}) {
  const matchStage = {
    createdAt: {
      $gte: dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      $lte: dateRange.end || new Date()
    }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalVolume: { $sum: '$amount.value' },
        completedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        totalFees: { $sum: '$fees.totalFees' },
        averageTransactionValue: { $avg: '$amount.value' }
      }
    },
    {
      $addFields: {
        successRate: {
          $multiply: [
            { $divide: ['$completedTransactions', '$totalTransactions'] },
            100
          ]
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);