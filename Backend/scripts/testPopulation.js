const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Stylist = require('../models/Stylist');

async function testPopulation() {
  try {
    // Connect to MongoDB with test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/curlmap', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'test'
    });
    
    console.log('Connected to MongoDB test database');
    
    const stylistId = '68cfe2f192131870549c9af3';
    
    // Test the same query as the endpoint
    const stylist = await Stylist.findById(stylistId)
      .populate('userId', 'name email phone profileImage location address createdAt isActive')
      .populate('reviews.customerId', 'name profileImage');
    
    console.log('\n🔍 Stylist Query Result:');
    console.log(`- Found: ${stylist ? 'YES' : 'NO'}`);
    
    if (stylist) {
      console.log(`- ID: ${stylist._id}`);
      console.log(`- Business Name: ${stylist.businessName}`);
      console.log(`- isActive: ${stylist.isActive}`);
      console.log(`- userId populated: ${stylist.userId ? 'YES' : 'NO'}`);
      
      if (stylist.userId) {
        console.log(`- userId._id: ${stylist.userId._id}`);
        console.log(`- userId.name: ${stylist.userId.name}`);
        console.log(`- userId.email: ${stylist.userId.email}`);
        console.log(`- userId.isActive: ${stylist.userId.isActive}`);
      } else {
        console.log('❌ userId not populated - checking raw userId field');
        console.log(`- Raw userId: ${stylist.toObject().userId}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testPopulation();