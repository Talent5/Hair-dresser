// Test script to verify booking status transitions
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/curlmap');

const Booking = require('./models/Booking');

async function testStatusTransitions() {
  console.log('Testing booking status transitions...');
  
  try {
    // Create a test booking
    const testBooking = new Booking({
      customerId: new mongoose.Types.ObjectId(),
      stylistId: new mongoose.Types.ObjectId(),
      service: 'Test Hair Service',
      appointmentDate: new Date(),
      location: {
        type: 'Point',
        coordinates: [31.0335, -17.8252] // Harare coordinates
      },
      status: 'accepted',
      pricing: {
        basePrice: 50,
        totalAmount: 50
      }
    });

    await testBooking.save();
    console.log('✅ Created test booking with status: accepted');

    // Test direct transition from accepted to completed
    await testBooking.updateStatus('completed', testBooking.stylistId);
    console.log('✅ Successfully transitioned from accepted to completed');

    // Clean up test booking
    await Booking.findByIdAndDelete(testBooking._id);
    console.log('✅ Test booking cleaned up');

    console.log('\n🎉 All status transition tests passed!');
    console.log('\n📋 Valid booking status flows:');
    console.log('1. pending → accepted → completed (Quick flow)');
    console.log('2. pending → accepted → confirmed → completed (Standard flow)');
    console.log('3. pending → accepted → confirmed → in_progress → completed (Detailed flow)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testStatusTransitions();
}

module.exports = { testStatusTransitions };