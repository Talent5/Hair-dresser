const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Stylist = require('../models/Stylist');
require('dotenv').config();

const sampleBookings = [
  {
    service: {
      name: "Box Braids",
      category: "braids",
      duration: 240, // 4 hours
      basePrice: 120
    },
    pricing: {
      basePrice: 120,
      negotiatedPrice: 110,
      depositAmount: 11,
      additionalFees: [],
      totalAmount: 110,
      currency: "USD"
    },
    appointmentDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    location: {
      type: "customer_location",
      address: {
        street: "123 Main St",
        suburb: "Downtown",
        city: "Atlanta",
        coordinates: [-84.3880, 33.7490]
      },
      instructions: "Apartment 4B, ring buzzer",
      additionalFee: 0
    },
    status: "confirmed"
  },
  {
    service: {
      name: "Silk Press",
      category: "natural_hair",
      duration: 180, // 3 hours
      basePrice: 85
    },
    pricing: {
      basePrice: 85,
      negotiatedPrice: 85,
      depositAmount: 8.5,
      additionalFees: [],
      totalAmount: 85,
      currency: "USD"
    },
    appointmentDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    location: {
      type: "stylist_studio",
      address: {
        street: "456 Beauty Blvd",
        suburb: "Midtown",
        city: "Atlanta",
        coordinates: [-84.3700, 33.7600]
      },
      instructions: "Suite 202, second floor",
      additionalFee: 0
    },
    status: "pending"
  },
  {
    service: {
      name: "Locs Maintenance",
      category: "locs",
      duration: 120, // 2 hours
      basePrice: 60
    },
    pricing: {
      basePrice: 60,
      negotiatedPrice: 55,
      depositAmount: 5.5,
      additionalFees: [],
      totalAmount: 55,
      currency: "USD"
    },
    appointmentDateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (completed)
    location: {
      type: "customer_location",
      address: {
        street: "789 Oak Ave",
        suburb: "Buckhead",
        city: "Atlanta",
        coordinates: [-84.3500, 33.8000]
      },
      instructions: "House with blue door",
      additionalFee: 10
    },
    status: "completed",
    completion: {
      completedAt: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hours ago
      actualDuration: 135,
      notes: "Great session, locs look amazing!"
    }
  }
];

async function seedBookings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/curlmap');
    console.log('Connected to MongoDB');

    // Clear existing bookings
    await Booking.deleteMany({});
    console.log('Cleared existing bookings');

    // Get some users to assign bookings to
    const users = await User.find({ role: { $in: ['customer', 'stylist'] } }).limit(10);
    const stylists = await Stylist.find().populate('userId').limit(5);

    if (users.length < 2 || stylists.length < 1) {
      console.log('Not enough users or stylists found. Please run user seeding first.');
      return;
    }

    const customers = users.filter(user => user.role === 'customer');
    const stylistUsers = users.filter(user => user.role === 'stylist');

    // Create bookings with real user IDs and fresh dates
    const bookingsToCreate = sampleBookings.map((bookingData, index) => {
      const customer = customers[index % customers.length];
      const stylistUser = stylistUsers[index % stylistUsers.length];
      const stylistProfile = stylists.find(s => s.userId._id.toString() === stylistUser._id.toString());

      if (!stylistProfile) {
        console.log(`No stylist profile found for user ${stylistUser._id}`);
        return null;
      }

      // Create fresh appointment date (1-7 days from now)
      const daysFromNow = (index % 7) + 1;
      const appointmentDateTime = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);

      return {
        ...bookingData,
        customerId: customer._id,
        stylistId: stylistUser._id,
        stylistProfileId: stylistProfile._id,
        appointmentDateTime: appointmentDateTime,
        estimatedEndTime: new Date(appointmentDateTime.getTime() + bookingData.service.duration * 60 * 1000)
      };
    }).filter(Boolean);

    // Insert bookings
    const createdBookings = await Booking.insertMany(bookingsToCreate);
    console.log(`Created ${createdBookings.length} sample bookings`);

    // Display created bookings
    for (const booking of createdBookings) {
      console.log(`- ${booking.service.name} on ${booking.appointmentDateTime.toLocaleDateString()} (${booking.status})`);
    }

    console.log('Booking seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding bookings:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
if (require.main === module) {
  seedBookings();
}

module.exports = seedBookings;