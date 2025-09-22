const Chat = require('../models/Chat');
const Booking = require('../models/Booking');

// Chat event handlers
const chatHandler = (socket) => {
  console.log(`User ${socket.user.name} connected to chat`);

  // Join user to their personal room
  socket.join(`user_${socket.userId}`);

  // Join general chat room
  socket.on('join_chat', async (data) => {
    try {
      const { chatId } = data;

      if (!chatId) {
        socket.emit('error', { message: 'Chat ID is required' });
        return;
      }

      // Find and verify chat access
      const chat = await Chat.findById(chatId)
        .populate('participants.userId', 'name profileImage')
        .populate('bookingId', 'service status');

      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      // Check if user is participant
      const isParticipant = chat.participants.some(p => 
        p.userId._id.toString() === socket.userId.toString()
      );

      if (!isParticipant) {
        socket.emit('error', { message: 'Unauthorized access to chat' });
        return;
      }

      // Join the chat room - use different room naming for general vs booking chats
      const roomName = chat.bookingId ? `booking_${chat.bookingId}` : `chat_${chatId}`;
      socket.join(roomName);

      // Mark messages as read
      await chat.markAsRead(socket.userId);

      socket.emit('chat_joined', {
        chatId: chat._id,
        chat: chat.toJSON(),
        roomName
      });

      console.log(`User ${socket.user.name} joined chat room: ${roomName}`);

    } catch (error) {
      console.error('Join chat error:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });

  // Legacy booking chat join support (keep for backward compatibility)
  socket.on('join_booking_chat', async (data) => {
    try {
      const { bookingId } = data;

      // Verify user has access to this booking
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        socket.emit('error', { message: 'Booking not found' });
        return;
      }

      const isAuthorized = booking.customerId.toString() === socket.userId.toString() ||
                          booking.stylistId.toString() === socket.userId.toString();

      if (!isAuthorized) {
        socket.emit('error', { message: 'Unauthorized access to chat' });
        return;
      }

      // Join the booking chat room
      socket.join(`booking_${bookingId}`);

      // Get or create chat
      let chat = await Chat.findOne({ bookingId })
        .populate('participants.userId', 'name profileImage')
        .populate('bookingId', 'service status');

      if (!chat) {
        // Create new chat
        const participants = [
          { userId: booking.customerId, role: 'customer' },
          { userId: booking.stylistId, role: 'stylist' }
        ];

        chat = new Chat({
          bookingId,
          participants
        });

        await chat.save();
        await chat.populate('participants.userId', 'name profileImage');
        await chat.populate('bookingId', 'service status');

        // Add system message for chat creation
        await chat.addSystemMessage('booking_created', {
          bookingId,
          service: booking.service.name
        });
      }

      // Mark messages as read
      await chat.markAsRead(socket.userId);

      socket.emit('chat_joined', {
        chatId: chat._id,
        chat: chat.toJSON()
      });

    } catch (error) {
      console.error('Join booking chat error:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { chatId, messageType = 'text', content } = data;

      // Find chat and verify access
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      const isParticipant = chat.participants.some(p => 
        p.userId.toString() === socket.userId.toString()
      );

      if (!isParticipant) {
        socket.emit('error', { message: 'Unauthorized access to chat' });
        return;
      }

      console.log('Sending message via socket:', {
        chatId,
        senderId: socket.userId,
        messageType,
        content
      });

      // Add message to chat
      await chat.addMessage(socket.userId, {
        type: messageType,
        content
      });

      // Reload chat with populated data
      await chat.populate('participants.userId', 'name profileImage');

      // Get the last message
      const lastMessage = chat.messages[chat.messages.length - 1];

      // Determine room name
      const roomName = chat.bookingId ? `booking_${chat.bookingId}` : `chat_${chatId}`;

      // Emit to all participants in the room
      socket.to(roomName).emit('new_message', {
        chatId: chat._id,
        message: lastMessage,
        unreadCounts: chat.unreadCounts
      });

      // Confirm to sender
      socket.emit('message_sent', {
        chatId: chat._id,
        message: lastMessage
      });

      console.log('Message sent successfully via socket');

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Send price offer
  socket.on('send_price_offer', async (data) => {
    try {
      const { chatId, amount, currency = 'USD', serviceDetails, message } = data;

      // Find chat and verify access
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      const isParticipant = chat.participants.some(p => 
        p.userId.toString() === socket.userId.toString()
      );

      if (!isParticipant) {
        socket.emit('error', { message: 'Unauthorized access to chat' });
        return;
      }

      // Add price offer
      await chat.addPriceOffer(socket.userId, {
        amount,
        currency,
        serviceDetails,
        message
      });

      await chat.populate('participants.userId', 'name profileImage');

      // Get the last message (price offer)
      const lastMessage = chat.messages[chat.messages.length - 1];

      // Determine room name
      const roomName = chat.bookingId ? `booking_${chat.bookingId}` : `chat_${chatId}`;

      // Emit to all participants
      socket.to(roomName).emit('price_offer_received', {
        chatId: chat._id,
        message: lastMessage,
        currentOffer: chat.negotiation.currentOffer,
        unreadCounts: chat.unreadCounts
      });

      // Confirm to sender
      socket.emit('price_offer_sent', {
        chatId: chat._id,
        message: lastMessage,
        currentOffer: chat.negotiation.currentOffer
      });

    } catch (error) {
      console.error('Send price offer error:', error);
      socket.emit('error', { message: 'Failed to send price offer' });
    }
  });

  // Respond to price offer
  socket.on('respond_to_offer', async (data) => {
    try {
      const { chatId, response, newOffer } = data; // response: 'accepted' or 'rejected'

      // Find chat and verify access
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      const isParticipant = chat.participants.some(p => 
        p.userId.toString() === socket.userId.toString()
      );

      if (!isParticipant) {
        socket.emit('error', { message: 'Unauthorized access to chat' });
        return;
      }

      // Respond to offer
      await chat.respondToPriceOffer(socket.userId, response, newOffer);
      await chat.populate('participants.userId', 'name profileImage');

      // Determine room name
      const roomName = chat.bookingId ? `booking_${chat.bookingId}` : `chat_${chatId}`;

      if (response === 'accepted') {
        // Update booking with agreed price if this is a booking chat
        if (chat.bookingId) {
          await Booking.findByIdAndUpdate(chat.bookingId, {
            'pricing.negotiatedPrice': chat.negotiation.finalAgreedPrice,
            'negotiation.isNegotiated': true,
            'negotiation.finalPrice': chat.negotiation.finalAgreedPrice,
            'negotiation.agreedAt': new Date()
          });
        }

        // Emit price agreement to all participants
        socket.to(roomName).emit('price_agreed', {
          chatId: chat._id,
          agreedPrice: chat.negotiation.finalAgreedPrice,
          currency: 'USD'
        });

        socket.emit('price_agreed', {
          chatId: chat._id,
          agreedPrice: chat.negotiation.finalAgreedPrice,
          currency: 'USD'
        });

      } else if (response === 'rejected') {
        // Emit rejection
        socket.to(roomName).emit('offer_rejected', {
          chatId: chat._id,
          hasCounterOffer: !!newOffer
        });

        // If there's a counter offer, handle it like a new offer
        if (newOffer) {
          const lastMessage = chat.messages[chat.messages.length - 1];
          socket.to(roomName).emit('price_offer_received', {
            chatId: chat._id,
            message: lastMessage,
            currentOffer: chat.negotiation.currentOffer,
            unreadCounts: chat.unreadCounts
          });
        }
      }

    } catch (error) {
      console.error('Respond to offer error:', error);
      socket.emit('error', { message: 'Failed to respond to offer' });
    }
  });

  // Mark messages as read
  socket.on('mark_messages_read', async (data) => {
    try {
      const { chatId, messageIds } = data;

      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      const isParticipant = chat.participants.some(p => 
        p.userId.toString() === socket.userId.toString()
      );

      if (!isParticipant) {
        socket.emit('error', { message: 'Unauthorized access to chat' });
        return;
      }

      await chat.markAsRead(socket.userId, messageIds);

      // Determine room name
      const roomName = chat.bookingId ? `booking_${chat.bookingId}` : `chat_${chatId}`;

      // Notify other participants
      socket.to(roomName).emit('messages_read', {
        chatId: chat._id,
        readBy: socket.userId,
        unreadCounts: chat.unreadCounts
      });

    } catch (error) {
      console.error('Mark messages read error:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  });

  // Typing indicators
  socket.on('typing_start', async (data) => {
    try {
      const { chatId } = data;

      const chat = await Chat.findById(chatId);
      if (!chat) return;

      const isParticipant = chat.participants.some(p => 
        p.userId.toString() === socket.userId.toString()
      );

      if (!isParticipant) return;

      await chat.setTyping(socket.userId, true);

      // Determine room name
      const roomName = chat.bookingId ? `booking_${chat.bookingId}` : `chat_${chatId}`;

      socket.to(roomName).emit('user_typing', {
        chatId: chat._id,
        userId: socket.userId,
        userName: socket.user.name
      });

    } catch (error) {
      console.error('Typing start error:', error);
    }
  });

  socket.on('typing_stop', async (data) => {
    try {
      const { chatId } = data;

      const chat = await Chat.findById(chatId);
      if (!chat) return;

      const isParticipant = chat.participants.some(p => 
        p.userId.toString() === socket.userId.toString()
      );

      if (!isParticipant) return;

      await chat.setTyping(socket.userId, false);

      // Determine room name
      const roomName = chat.bookingId ? `booking_${chat.bookingId}` : `chat_${chatId}`;

      socket.to(roomName).emit('user_stopped_typing', {
        chatId: chat._id,
        userId: socket.userId
      });

    } catch (error) {
      console.error('Typing stop error:', error);
    }
  });

  // Get active chats for user
  socket.on('get_my_chats', async () => {
    try {
      const chats = await Chat.findActiveChatsForUser(socket.userId);

      socket.emit('my_chats', {
        chats: chats.map(chat => ({
          ...chat.toJSON(),
          lastMessage: chat.lastMessage
        }))
      });

    } catch (error) {
      console.error('Get my chats error:', error);
      socket.emit('error', { message: 'Failed to get chats' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`User ${socket.user.name} disconnected from chat`);

    try {
      // Clean up typing indicators
      await Chat.updateMany(
        { 'typing.userId': socket.userId },
        { $pull: { typing: { userId: socket.userId } } }
      );

      // Notify other users that this user stopped typing
      socket.broadcast.emit('user_disconnected', {
        userId: socket.userId
      });

    } catch (error) {
      console.error('Disconnect cleanup error:', error);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
};

module.exports = chatHandler;