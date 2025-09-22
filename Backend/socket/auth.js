const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Socket.IO authentication middleware
const socketAuth = async (socket, next) => {
  try {
    // Get token from handshake auth
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return next(new Error('Invalid token or inactive user'));
    }

    // Attach user to socket
    socket.user = user;
    socket.userId = user._id;
    socket.userRole = user.role;

    // Update last seen
    user.updateLastSeen();

    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

module.exports = socketAuth;