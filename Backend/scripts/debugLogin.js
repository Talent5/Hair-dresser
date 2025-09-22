const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import models
const User = require('../models/User');

async function debugLogin() {
  try {
    console.log('🔍 Starting Login Debug Session...\n');
    
    // 1. Check Environment Variables
    console.log('📋 ENVIRONMENT VARIABLES CHECK:');
    console.log('--------------------------------');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET ✅' : 'MISSING ❌');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET ✅' : 'MISSING ❌');
    console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || '7d (default)');
    console.log('PORT:', process.env.PORT || '5000 (default)');
    console.log('CLIENT_URL:', process.env.CLIENT_URL || 'undefined');
    console.log();

    // Check critical missing variables
    const criticalVars = [];
    if (!process.env.MONGODB_URI) criticalVars.push('MONGODB_URI');
    if (!process.env.JWT_SECRET) criticalVars.push('JWT_SECRET');
    
    if (criticalVars.length > 0) {
      console.log('🚨 CRITICAL: Missing environment variables:', criticalVars.join(', '));
      console.log('These variables are required for authentication to work.');
      console.log('Please ensure your .env file exists and contains these variables.\n');
    }

    // 2. Test Database Connection
    console.log('🗄️  DATABASE CONNECTION TEST:');
    console.log('-------------------------------');
    
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/curlmap', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: 'test'
      });
      
      console.log('✅ Database connected successfully');
      console.log('Database name:', mongoose.connection.db.databaseName);
      console.log('Connection state:', mongoose.connection.readyState); // 1 = connected
      
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
      console.log('Full error:', error);
      return;
    }

    // 3. Check Users Collection
    console.log('\n👥 USERS COLLECTION CHECK:');
    console.log('---------------------------');
    
    try {
      const userCount = await User.countDocuments();
      console.log('Total users in database:', userCount);
      
      if (userCount === 0) {
        console.log('⚠️  No users found in database. This might be why login is failing.');
        console.log('Consider creating a test user or checking if you\'re connected to the right database.');
      } else {
        // Show sample users (without passwords)
        const sampleUsers = await User.find({}).select('name email phone role isActive createdAt').limit(3);
        console.log('Sample users:');
        sampleUsers.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.name} (${user.email || user.phone}) - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
        });
      }
      
    } catch (error) {
      console.log('❌ Error checking users collection:', error.message);
    }

    // 4. Test JWT Token Generation
    console.log('\n🔐 JWT TOKEN GENERATION TEST:');
    console.log('------------------------------');
    
    try {
      if (!process.env.JWT_SECRET) {
        console.log('❌ Cannot test JWT - JWT_SECRET not set');
      } else {
        const testPayload = { userId: 'test-user-id', test: true };
        const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('✅ JWT token generated successfully');
        console.log('Token preview:', token.substring(0, 50) + '...');
        
        // Test verification
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ JWT token verified successfully');
        console.log('Decoded payload:', decoded);
      }
    } catch (error) {
      console.log('❌ JWT test failed:', error.message);
    }

    // 5. Test Auth Endpoint Simulation
    console.log('\n🔍 LOGIN SIMULATION TEST:');
    console.log('--------------------------');
    
    try {
      // Find a test user
      const testUser = await User.findOne({ isActive: true });
      
      if (!testUser) {
        console.log('⚠️  No active users found for login simulation');
      } else {
        console.log('Found test user:', testUser.email || testUser.phone);
        console.log('User role:', testUser.role);
        console.log('User active status:', testUser.isActive);
        console.log('User has password hash:', !!testUser.password);
        
        // Test password comparison (if we have a password)
        if (testUser.password) {
          console.log('✅ User has password hash - login should work if correct password provided');
        } else {
          console.log('❌ User missing password hash - this will cause login to fail');
        }
      }
      
    } catch (error) {
      console.log('❌ Login simulation failed:', error.message);
    }

    // 6. Production-specific checks
    console.log('\n🌐 PRODUCTION ENVIRONMENT CHECKS:');
    console.log('----------------------------------');
    
    if (process.env.NODE_ENV === 'production') {
      console.log('✅ Running in production mode');
      
      // Check CORS configuration
      console.log('CORS allowed origins from server.js:');
      console.log('  - http://localhost:3000');
      console.log('  - http://localhost:3001'); 
      console.log('  - https://hair-dresser-adkn.onrender.com');
      
      if (!process.env.CLIENT_URL) {
        console.log('⚠️  CLIENT_URL not set - password reset emails may not work');
      }
      
    } else {
      console.log('ℹ️  Running in development mode');
      console.log('Production-specific issues may not appear in development');
    }

    // 7. Common Production Issues Check
    console.log('\n⚠️  COMMON PRODUCTION LOGIN ISSUES:');
    console.log('------------------------------------');
    console.log('1. Wrong database: Check if MONGODB_URI points to production database');
    console.log('2. Missing JWT_SECRET: Ensure JWT_SECRET is set in production environment');
    console.log('3. CORS issues: Check if frontend URL is in CORS allowedOrigins');
    console.log('4. Database connectivity: Ensure production database is accessible');
    console.log('5. Environment variables: Ensure all required env vars are set in production');
    console.log('6. Password hashing: Ensure user passwords are properly hashed in database');

    console.log('\n✅ Debug session completed!');
    
  } catch (error) {
    console.error('❌ Debug session failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
  }
}

// Run the debug function
debugLogin().catch(console.error);