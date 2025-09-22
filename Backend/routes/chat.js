const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { authMiddleware: auth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Helper function to check if user is participant (handles both old and new formats)
const isUserParticipant = (chat, userId) => {
  if (!chat.participants || !Array.isArray(chat.participants)) {
    return false;
  }
  
  return chat.participants.some(participant => {
    // Handle new format: { userId: ObjectId, role: String }
    if (participant.userId) {
      const participantId = participant.userId._id 
        ? participant.userId._id.toString() 
        : participant.userId.toString();
      return participantId === userId;
    }
    
    // Handle old format: direct ObjectId or string
    const participantId = participant._id 
      ? participant._id.toString() 
      : participant.toString();
    return participantId === userId;
  });
};

// @route   GET /api/chat
// @desc    Get user chats
// @access  Private
router.get('/', auth, asyncHandler(async (req, res) => {
  try {
    const chats = await Chat.find({
      'participants.userId': req.user.id
    })
    .populate('participants.userId', 'name email role location profileImage')
    .populate('bookingId', 'scheduledDate status')
    .sort({ lastActivity: -1 });

    console.log('Fetching chats for user:', req.user.id);
    console.log('Found chats:', chats.length);

    // Process chats to include computed fields
    const processedChats = chats.map(chat => {
      const chatObj = chat.toJSON();
      return {
        ...chatObj,
        lastMessage: chat.lastMessage,
        messageCount: chat.messageCount
      };
    });

    res.json({
      success: true,
      data: processedChats
    });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}));

// @route   POST /api/chat/create
// @desc    Create a new chat between customer and stylist
// @access  Private
router.post('/create', auth, asyncHandler(async (req, res) => {
  try {
    const { stylistId, message } = req.body;
    const customerId = req.user.id;

    if (!stylistId) {
      return res.status(400).json({
        success: false,
        message: 'Stylist ID is required'
      });
    }

    console.log('Creating chat between:', { customerId, stylistId });

    // Check if chat already exists between these users (general chat without booking)
    let existingChat = await Chat.findOne({
      $and: [
        { 'participants.userId': { $all: [customerId, stylistId] } },
        { 
          $or: [
            { bookingId: null },
            { bookingId: { $exists: false } }
          ]
        }
      ]
    });

    if (existingChat) {
      console.log('Found existing chat:', existingChat._id);
      
      // If initial message provided, add it
      if (message && message.trim()) {
        await existingChat.addMessage(customerId, {
          type: 'text',
          content: { text: message.trim() }
        });
      }
      
      await existingChat.populate('participants.userId', 'name email role location profileImage');
      
      return res.json({
        success: true,
        data: existingChat
      });
    }

    // Create new chat
    const newChat = new Chat({
      participants: [
        {
          userId: customerId,
          role: 'customer'
        },
        {
          userId: stylistId,
          role: 'stylist'
        }
      ],
      chatSettings: {
        isActive: true
      }
    });

    await newChat.save();
    console.log('Created new chat:', newChat._id);

    // Add initial message if provided
    if (message && message.trim()) {
      await newChat.addMessage(customerId, {
        type: 'text',
        content: { text: message.trim() }
      });
      console.log('Added initial message to chat');
    }

    await newChat.populate('participants.userId', 'name email role location profileImage');

    res.status(201).json({
      success: true,
      data: newChat
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}));

// @route   GET /api/chat/:chatId
// @desc    Get specific chat details
// @access  Private
router.get('/:chatId', auth, asyncHandler(async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('participants.userId', 'name email role location profileImage')
      .populate('bookingId', 'scheduledDate status')
      .populate('messages.senderId', 'name role');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    console.log('Checking participant access:');
    console.log('req.user.id:', req.user.id);
    console.log('chat.participants:', chat.participants.map(p => ({
      userId: p.userId._id || p.userId,
      role: p.role
    })));
    
    if (!isUserParticipant(chat, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Process the chat data for frontend
    const chatData = chat.toJSON();
    
    // Add sender information to messages
    chatData.messages = chatData.messages.map(message => ({
      ...message,
      senderName: message.senderId?.name || 'Unknown User'
    }));

    res.json({
      success: true,
      data: chatData
    });
    
    console.log('Chat sent to frontend:', {
      chatId: chat._id,
      messageCount: chat.messages.length,
      participantCount: chat.participants.length,
      lastActivity: chat.lastActivity
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}));

// @route   POST /api/chat/:chatId/message
// @desc    Send message in chat
// @access  Private
router.post('/:chatId/message', auth, asyncHandler(async (req, res) => {
  try {
    const { message, messageType = 'text' } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    if (!isUserParticipant(chat, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log('Adding message to chat:', {
      chatId: req.params.chatId,
      senderId: req.user.id,
      messageType,
      messageText: message.trim(),
      currentMessageCount: chat.messages.length
    });

    await chat.addMessage(req.user.id, {
      type: messageType,
      content: { text: message.trim() }
    });

    console.log('Message added successfully. New message count:', chat.messages.length);

    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}));

// @route   POST /api/chat/:chatId/price-offer
// @desc    Send price offer in chat
// @access  Private
router.post('/:chatId/price-offer', auth, asyncHandler(async (req, res) => {
  try {
    const { serviceName, price, description } = req.body;
    
    if (!serviceName || !price) {
      return res.status(400).json({
        success: false,
        message: 'Service name and price are required'
      });
    }

    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    if (!isUserParticipant(chat, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await chat.addPriceOffer(req.user.id, {
      amount: parseFloat(price),
      serviceDetails: serviceName,
      message: description
    });

    res.json({
      success: true,
      message: 'Price offer sent successfully'
    });
  } catch (error) {
    console.error('Error sending price offer:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}));

// @route   PUT /api/chat/:chatId/read
// @desc    Mark chat as read
// @access  Private
router.put('/:chatId/read', auth, asyncHandler(async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    if (!isUserParticipant(chat, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await chat.markAsRead(req.user.id);

    res.json({
      success: true,
      message: 'Chat marked as read'
    });
  } catch (error) {
    console.error('Error marking chat as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}));

module.exports = router;