const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: false,
    sparse: true // Allows multiple documents with null/undefined bookingId
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['customer', 'stylist'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastReadAt: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [{
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function() {
        return this.messageType !== 'system';
      }
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'price_offer', 'system', 'booking_update'],
      default: 'text'
    },
    content: {
      text: String,
      imageUrl: String,
      priceOffer: {
        amount: Number,
        currency: { type: String, default: 'USD' },
        serviceDetails: String,
        expiresAt: Date
      },
      systemMessage: {
        type: {
          type: String,
          enum: [
            'booking_created',
            'price_negotiated',
            'booking_confirmed',
            'booking_cancelled',
            'payment_received',
            'service_completed'
          ]
        },
        data: mongoose.Schema.Types.Mixed
      }
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    readBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
    editedAt: Date,
    deletedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      deviceInfo: String
    }
  }],
  negotiation: {
    isActive: {
      type: Boolean,
      default: false
    },
    currentOffer: {
      amount: Number,
      offeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      offeredAt: Date,
      expiresAt: Date,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'expired'],
        default: 'pending'
      }
    },
    offerHistory: [{
      amount: Number,
      offeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      offeredAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'expired'],
        default: 'pending'
      },
      expiresAt: Date,
      message: String
    }],
    finalAgreedPrice: Number,
    agreedAt: Date
  },
  chatSettings: {
    isActive: {
      type: Boolean,
      default: true
    },
    endedAt: Date,
    endedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    autoEndAfterBooking: {
      type: Boolean,
      default: false
    }
  },
  unreadCounts: {
    customer: {
      type: Number,
      default: 0
    },
    stylist: {
      type: Number,
      default: 0
    }
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  typing: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
chatSchema.index({ bookingId: 1 });
chatSchema.index({ 'participants.userId': 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ 'messages.timestamp': -1 });

// Compound indexes
chatSchema.index({ bookingId: 1, 'messages.timestamp': -1 });
chatSchema.index({ 'participants.userId': 1, lastActivity: -1 });

// Virtual for total message count
chatSchema.virtual('messageCount').get(function() {
  return this.messages.filter(msg => !msg.isDeleted).length;
});

// Virtual for active participants
chatSchema.virtual('activeParticipants').get(function() {
  return this.participants.filter(p => !p.leftAt);
});

// Virtual for last message
chatSchema.virtual('lastMessage').get(function() {
  const activeMessages = this.messages.filter(msg => !msg.isDeleted);
  return activeMessages.length > 0 ? activeMessages[activeMessages.length - 1] : null;
});

// Pre-save middleware to update last activity
chatSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
  }
  next();
});

// Method to add a new message
chatSchema.methods.addMessage = function(senderId, messageData) {
  const message = {
    senderId,
    messageType: messageData.type || 'text',
    content: messageData.content,
    timestamp: new Date(),
    readBy: [{ userId: senderId, readAt: new Date() }]
  };

  this.messages.push(message);
  this.lastActivity = new Date();

  // Update unread counts
  this.participants.forEach(participant => {
    if (participant.userId.toString() !== senderId.toString()) {
      const role = participant.role;
      this.unreadCounts[role] += 1;
    }
  });

  return this.save();
};

// Method to add a system message
chatSchema.methods.addSystemMessage = function(messageType, data) {
  const systemMessage = {
    senderId: null, // System messages have no sender
    messageType: 'system',
    content: {
      systemMessage: {
        type: messageType,
        data: data
      }
    },
    timestamp: new Date(),
    readBy: [] // System messages are auto-read
  };

  this.messages.push(systemMessage);
  this.lastActivity = new Date();

  return this.save();
};

// Method to add a price offer
chatSchema.methods.addPriceOffer = function(senderId, offerData) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Add to message history
  const offerMessage = {
    senderId,
    messageType: 'price_offer',
    content: {
      priceOffer: {
        amount: offerData.amount,
        currency: offerData.currency || 'USD',
        serviceDetails: offerData.serviceDetails,
        expiresAt
      }
    },
    timestamp: new Date(),
    readBy: [{ userId: senderId, readAt: new Date() }]
  };

  this.messages.push(offerMessage);

  // Update negotiation status
  this.negotiation.isActive = true;
  this.negotiation.currentOffer = {
    amount: offerData.amount,
    offeredBy: senderId,
    offeredAt: new Date(),
    expiresAt,
    status: 'pending'
  };

  // Add to offer history
  this.negotiation.offerHistory.push({
    amount: offerData.amount,
    offeredBy: senderId,
    offeredAt: new Date(),
    expiresAt,
    message: offerData.message,
    status: 'pending'
  });

  this.lastActivity = new Date();

  // Update unread counts
  this.participants.forEach(participant => {
    if (participant.userId.toString() !== senderId.toString()) {
      const role = participant.role;
      this.unreadCounts[role] += 1;
    }
  });

  return this.save();
};

// Method to respond to price offer
chatSchema.methods.respondToPriceOffer = function(responderId, response, newOffer = null) {
  if (!this.negotiation.currentOffer || this.negotiation.currentOffer.status !== 'pending') {
    throw new Error('No active price offer to respond to');
  }

  // Update current offer status
  this.negotiation.currentOffer.status = response; // 'accepted' or 'rejected'

  // Update offer history
  const currentOfferIndex = this.negotiation.offerHistory.length - 1;
  this.negotiation.offerHistory[currentOfferIndex].status = response;

  // If accepted, finalize the negotiation
  if (response === 'accepted') {
    this.negotiation.finalAgreedPrice = this.negotiation.currentOffer.amount;
    this.negotiation.agreedAt = new Date();
    this.negotiation.isActive = false;

    // Add system message
    this.addSystemMessage('price_negotiated', {
      agreedPrice: this.negotiation.finalAgreedPrice,
      currency: 'USD'
    });
  }

  // If rejected and new offer provided, create counter-offer
  if (response === 'rejected' && newOffer) {
    return this.addPriceOffer(responderId, newOffer);
  }

  return this.save();
};

// Method to mark messages as read
chatSchema.methods.markAsRead = function(userId, messageIds = null) {
  let messagesToUpdate = this.messages;

  // If specific message IDs provided, filter to those
  if (messageIds && Array.isArray(messageIds)) {
    messagesToUpdate = this.messages.filter(msg => 
      messageIds.includes(msg._id.toString())
    );
  }

  // Mark messages as read
  messagesToUpdate.forEach(message => {
    const existingRead = message.readBy.find(read => 
      read.userId.toString() === userId.toString()
    );

    if (!existingRead) {
      message.readBy.push({
        userId,
        readAt: new Date()
      });
    }
  });

  // Update participant's last read time
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  if (participant) {
    participant.lastReadAt = new Date();
  }

  // Reset unread count for this user's role
  const userParticipant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );
  if (userParticipant) {
    this.unreadCounts[userParticipant.role] = 0;
  }

  return this.save();
};

// Method to set typing status
chatSchema.methods.setTyping = function(userId, isTyping) {
  if (isTyping) {
    // Add or update typing status
    const existingTyping = this.typing.find(t => 
      t.userId.toString() === userId.toString()
    );

    if (existingTyping) {
      existingTyping.startedAt = new Date();
    } else {
      this.typing.push({
        userId,
        startedAt: new Date()
      });
    }
  } else {
    // Remove typing status
    this.typing = this.typing.filter(t => 
      t.userId.toString() !== userId.toString()
    );
  }

  return this.save();
};

// Method to end chat
chatSchema.methods.endChat = function(endedBy) {
  this.chatSettings.isActive = false;
  this.chatSettings.endedAt = new Date();
  this.chatSettings.endedBy = endedBy;

  // Add system message
  this.addSystemMessage('chat_ended', {
    endedBy,
    endedAt: new Date()
  });

  return this.save();
};

// Static method to find active chats for a user
chatSchema.statics.findActiveChatsForUser = function(userId) {
  return this.find({
    'participants.userId': userId,
    'chatSettings.isActive': true
  })
  .populate('bookingId', 'service status appointmentDateTime')
  .populate('participants.userId', 'name profileImage')
  .sort({ lastActivity: -1 });
};

// Static method to clean up old typing indicators
chatSchema.statics.cleanupTypingIndicators = function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  return this.updateMany(
    { 'typing.startedAt': { $lt: fiveMinutesAgo } },
    { $pull: { typing: { startedAt: { $lt: fiveMinutesAgo } } } }
  );
};

// Static method to find chats with expired offers
chatSchema.statics.findChatsWithExpiredOffers = function() {
  const now = new Date();
  
  return this.find({
    'negotiation.isActive': true,
    'negotiation.currentOffer.status': 'pending',
    'negotiation.currentOffer.expiresAt': { $lt: now }
  });
};

// Method to expire old offers
chatSchema.methods.expireOldOffers = function() {
  const now = new Date();
  
  if (this.negotiation.currentOffer && 
      this.negotiation.currentOffer.status === 'pending' &&
      this.negotiation.currentOffer.expiresAt < now) {
    
    this.negotiation.currentOffer.status = 'expired';
    
    // Update offer history
    const lastOfferIndex = this.negotiation.offerHistory.length - 1;
    if (lastOfferIndex >= 0) {
      this.negotiation.offerHistory[lastOfferIndex].status = 'expired';
    }
    
    // Add system message
    this.addSystemMessage('offer_expired', {
      expiredOffer: this.negotiation.currentOffer
    });
    
    return this.save();
  }
  
  return Promise.resolve(this);
};

module.exports = mongoose.model('Chat', chatSchema);