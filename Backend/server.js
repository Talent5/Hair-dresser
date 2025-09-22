const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config(); 

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const stylistRoutes = require('./routes/stylists');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const chatRoutes = require('./routes/chat');
const requestRoutes = require('./routes/requests');
const favoriteRoutes = require('./routes/favorites');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

// Import socket handlers
const socketAuth = require('./socket/auth');
const chatHandler = require('./socket/chat');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());

// CORS configuration - simplified and more permissive for debugging
app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/curlmap', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'test' // Explicitly specify the database name
})
.then(() => {
  console.log('Connected to MongoDB');
  console.log('Database name:', mongoose.connection.name);
  console.log('Connection database:', mongoose.connection.db.databaseName);
  
  // Make db name accessible to routes
  app.set('db', mongoose.connection.name);
  
  // Create geospatial indexes after connection
  const User = require('./models/User');
  User.collection.createIndex({ location: "2dsphere" }, (err) => {
    if (err) console.log('Error creating geospatial index:', err);
    else console.log('Geospatial index created successfully');
  });
})
.catch((error) => console.error('MongoDB connection error:', error));

// Socket.IO authentication and chat handling
io.use(socketAuth);
io.on('connection', chatHandler);

// Make io accessible to routes
app.set('io', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/stylists', stylistRoutes); // Auth handled per route
app.use('/api/bookings', authMiddleware, bookingRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/requests', requestRoutes); // Auth handled per route
app.use('/api/favorites', favoriteRoutes); // Auth handled per route

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CurlMap API Server',
    version: '1.0.0',
    docs: '/api/health'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces for mobile access

server.listen(PORT, HOST, () => {
  console.log(`CurlMap server running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Network accessible at: http://192.168.0.49:${PORT}`);
});

module.exports = app;