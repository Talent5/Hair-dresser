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
const adminRoutes = require('./routes/admin');

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
    origin: [
      "http://localhost:3000", 
      "http://localhost:3001",
      "https://hair-dresser-adkn.onrender.com"
    ],
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());

// CORS configuration - Updated for production and mobile apps
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:3000", 
      "http://localhost:3001",
      "https://hair-dresser-adkn.onrender.com"
    ];
    
    // Allow mobile development IPs
    const mobilePatterns = [
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/,
      /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}:\d+$/
    ];
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check if origin matches mobile patterns
    for (const pattern of mobilePatterns) {
      if (pattern.test(origin)) {
        return callback(null, true);
      }
    }
    
    // Allow if no specific restrictions in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
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
  dbName: 'test', // Explicitly specify the database name
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 5, // Maintain a minimum of 5 socket connections
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
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
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1); // Exit process if can't connect to database
});

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
app.use('/api/admin', adminRoutes); // Admin routes with built-in auth

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: process.memoryUsage(),
    port: PORT,
    host: HOST
  };
  
  // Return 503 if database is not connected
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      ...healthStatus,
      status: 'UNHEALTHY',
      error: 'Database not connected'
    });
  }
  
  res.json(healthStatus);
});

// Render health check (simplified endpoint for monitoring)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
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

// Configure server timeouts for Render deployment
server.keepAliveTimeout = 120000; // 120 seconds
server.headersTimeout = 120000; // 120 seconds

server.listen(PORT, HOST, () => {
  console.log(`CurlMap server running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Network accessible at: http://192.168.0.49:${PORT}`);
  console.log(`Server timeouts configured: keepAlive=${server.keepAliveTimeout}ms, headers=${server.headersTimeout}ms`);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed.');
    
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app;