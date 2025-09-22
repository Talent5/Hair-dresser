const mongoose = require('mongoose');
const User = require('../models/User');
const Stylist = require('../models/Stylist');
require('dotenv').config();

// Harare coordinates and surrounding areas
const harareLocations = [
  { name: 'City Center', coordinates: [31.0492, -17.8292] },
  { name: 'Belvedere', coordinates: [31.0656, -17.8156] },
  { name: 'Avondale', coordinates: [31.0275, -17.8042] },
  { name: 'Mount Pleasant', coordinates: [31.0892, -17.7844] },
  { name: 'Borrowdale', coordinates: [31.0761, -17.7533] },
  { name: 'Glen Lorne', coordinates: [31.0483, -17.7442] },
  { name: 'Marlborough', coordinates: [31.1075, -17.8267] },
  { name: 'Waterfalls', coordinates: [31.1342, -17.8617] },
  { name: 'Chitungwiza', coordinates: [31.0872, -18.0128] },
  { name: 'Warren Park', coordinates: [31.0200, -17.8500] }
];

const demoUsers = [
  // Admin User
  {
    name: 'Admin User',
    email: 'admin@curlmap.com',
    phone: '+263771234567',
    password: 'admin123',
    role: 'admin',
    location: {
      type: 'Point',
      coordinates: harareLocations[0].coordinates
    },
    address: {
      street: '123 Admin Street',
      suburb: 'City Center',
      city: 'Harare',
      country: 'Zimbabwe'
    },
    isVerified: true
  },
  
  // Customers
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+263771234568',
    password: 'customer123',
    role: 'customer',
    location: {
      type: 'Point',
      coordinates: harareLocations[1].coordinates
    },
    address: {
      street: '45 Belvedere Road',
      suburb: 'Belvedere',
      city: 'Harare',
      country: 'Zimbabwe'
    },
    isVerified: true
  },
  {
    name: 'Thandiwe Moyo',
    email: 'thandiwe.moyo@email.com',
    phone: '+263771234569',
    password: 'customer123',
    role: 'customer',
    location: {
      type: 'Point',
      coordinates: harareLocations[2].coordinates
    },
    address: {
      street: '12 Avondale Shopping Center',
      suburb: 'Avondale',
      city: 'Harare',
      country: 'Zimbabwe'
    },
    isVerified: true
  },
  {
    name: 'Michelle Chikwanha',
    email: 'michelle.chikwanha@email.com',
    phone: '+263771234570',
    password: 'customer123',
    role: 'customer',
    location: {
      type: 'Point',
      coordinates: harareLocations[3].coordinates
    },
    address: {
      street: '78 Mount Pleasant Drive',
      suburb: 'Mount Pleasant',
      city: 'Harare',
      country: 'Zimbabwe'
    },
    isVerified: true
  },
  
  // Stylists
  {
    name: 'Grace Manyika',
    email: 'grace.manyika@email.com',
    phone: '+263771234571',
    password: 'stylist123',
    role: 'stylist',
    location: {
      type: 'Point',
      coordinates: harareLocations[4].coordinates
    },
    address: {
      street: '23 Borrowdale Brook',
      suburb: 'Borrowdale',
      city: 'Harare',
      country: 'Zimbabwe'
    },
    isVerified: true
  },
  {
    name: 'Chipo Dendere',
    email: 'chipo.dendere@email.com',
    phone: '+263771234572',
    password: 'stylist123',
    role: 'stylist',
    location: {
      type: 'Point',
      coordinates: harareLocations[5].coordinates
    },
    address: {
      street: '156 Glen Lorne Road',
      suburb: 'Glen Lorne',
      city: 'Harare',
      country: 'Zimbabwe'
    },
    isVerified: true
  },
  {
    name: 'Tendai Mukamuri',
    email: 'tendai.mukamuri@email.com',
    phone: '+263771234573',
    password: 'stylist123',
    role: 'stylist',
    location: {
      type: 'Point',
      coordinates: harareLocations[6].coordinates
    },
    address: {
      street: '89 Marlborough Drive',
      suburb: 'Marlborough',
      city: 'Harare',
      country: 'Zimbabwe'
    },
    isVerified: true
  },
  {
    name: 'Rumbidzai Mubvumba',
    email: 'rumbidzai.mubvumba@email.com',
    phone: '+263771234574',
    password: 'stylist123',
    role: 'stylist',
    location: {
      type: 'Point',
      coordinates: harareLocations[7].coordinates
    },
    address: {
      street: '34 Waterfalls Avenue',
      suburb: 'Waterfalls',
      city: 'Harare',
      country: 'Zimbabwe'
    },
    isVerified: true
  }
];

const stylistProfiles = [
  {
    // Grace Manyika
    businessName: 'Grace\'s Natural Hair Studio',
    bio: 'Specializing in natural hair care and protective styles for over 8 years. I believe in healthy hair practices and bringing out the beauty in your natural texture.',
    specialties: ['natural_hair', 'braids', 'locs', 'treatments'],
    experience: {
      years: 8,
      description: 'Started as a self-taught stylist and completed professional certification in natural hair care'
    },
    services: [
      {
        name: 'Wash and Go',
        category: 'natural_hair',
        basePrice: { amount: 25, currency: 'USD' },
        duration: 90,
        description: 'Deep cleanse, condition, and style for natural hair'
      },
      {
        name: 'Box Braids',
        category: 'braids',
        basePrice: { amount: 80, currency: 'USD' },
        duration: 300,
        description: 'Protective box braids in various sizes'
      },
      {
        name: 'Loc Maintenance',
        category: 'locs',
        basePrice: { amount: 40, currency: 'USD' },
        duration: 120,
        description: 'Root maintenance and loc care'
      }
    ],
    availability: {
      schedule: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true },
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true },
        { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true },
        { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true },
        { dayOfWeek: 6, startTime: '10:00', endTime: '15:00', isAvailable: true },
        { dayOfWeek: 0, startTime: '10:00', endTime: '15:00', isAvailable: false }
      ],
      exceptions: []
    },
    location: {
      isHomeBased: true,
      isMobile: true,
      homeStudio: {
        address: '23 Borrowdale Brook, Borrowdale, Harare',
        description: 'Comfortable home studio with modern equipment',
        amenities: ['parking', 'wifi', 'refreshments']
      },
      mobileRadius: 15,
      additionalFee: 5
    },
    verification: {
      isVerified: true,
      verifiedAt: new Date()
    }
  },
  {
    // Chipo Dendere
    businessName: 'Chipo\'s Braiding Lounge',
    bio: 'Expert braider with 10+ years experience. Specializing in intricate braiding styles and hair extensions.',
    specialties: ['braids', 'extensions', 'weaves', 'styling'],
    experience: {
      years: 12,
      description: 'Professional braider trained in traditional and modern techniques'
    },
    services: [
      {
        name: 'Cornrows',
        category: 'braids',
        basePrice: { amount: 30, currency: 'USD' },
        duration: 180,
        description: 'Classic cornrow braiding in various patterns'
      },
      {
        name: 'Senegalese Twists',
        category: 'braids',
        basePrice: { amount: 100, currency: 'USD' },
        duration: 360,
        description: 'Beautiful twisted protective style'
      },
      {
        name: 'Weave Installation',
        category: 'weaves',
        basePrice: { amount: 60, currency: 'USD' },
        duration: 240,
        description: 'Professional weave installation with natural finish'
      }
    ],
    availability: {
      schedule: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '18:00', isAvailable: true },
        { dayOfWeek: 2, startTime: '08:00', endTime: '18:00', isAvailable: true },
        { dayOfWeek: 3, startTime: '08:00', endTime: '18:00', isAvailable: true },
        { dayOfWeek: 4, startTime: '08:00', endTime: '18:00', isAvailable: true },
        { dayOfWeek: 5, startTime: '08:00', endTime: '18:00', isAvailable: true },
        { dayOfWeek: 6, startTime: '09:00', endTime: '16:00', isAvailable: true },
        { dayOfWeek: 0, startTime: '12:00', endTime: '17:00', isAvailable: true }
      ],
      exceptions: []
    },
    location: {
      isHomeBased: false,
      isMobile: true,
      mobileRadius: 20,
      additionalFee: 8
    },
    verification: {
      isVerified: true,
      verifiedAt: new Date()
    }
  },
  {
    // Tendai Mukamuri
    businessName: 'Tendai\'s Hair Artistry',
    bio: 'Creative stylist specializing in cuts, color, and modern styling. Bringing international trends to Harare.',
    specialties: ['cuts', 'color', 'styling', 'relaxed_hair'],
    experience: {
      years: 6,
      description: 'Trained in South Africa and UK, specializing in contemporary hair styling'
    },
    services: [
      {
        name: 'Precision Cut',
        category: 'cuts',
        basePrice: { amount: 35, currency: 'USD' },
        duration: 90,
        description: 'Professional hair cutting and styling'
      },
      {
        name: 'Hair Color',
        category: 'color',
        basePrice: { amount: 70, currency: 'USD' },
        duration: 180,
        description: 'Full color service including highlights and balayage'
      },
      {
        name: 'Relaxer Touch-up',
        category: 'relaxed_hair',
        basePrice: { amount: 45, currency: 'USD' },
        duration: 120,
        description: 'Root relaxer and styling service'
      }
    ],
    availability: {
      schedule: [
        { dayOfWeek: 1, startTime: '10:00', endTime: '19:00', isAvailable: true },
        { dayOfWeek: 2, startTime: '10:00', endTime: '19:00', isAvailable: true },
        { dayOfWeek: 3, startTime: '10:00', endTime: '19:00', isAvailable: true },
        { dayOfWeek: 4, startTime: '10:00', endTime: '19:00', isAvailable: true },
        { dayOfWeek: 5, startTime: '10:00', endTime: '19:00', isAvailable: true },
        { dayOfWeek: 6, startTime: '09:00', endTime: '17:00', isAvailable: true },
        { dayOfWeek: 0, startTime: '10:00', endTime: '15:00', isAvailable: false }
      ],
      exceptions: []
    },
    location: {
      isHomeBased: true,
      isMobile: true,
      homeStudio: {
        address: '89 Marlborough Drive, Marlborough, Harare',
        description: 'Modern salon setup with latest equipment',
        amenities: ['parking', 'wifi', 'waiting_area', 'refreshments']
      },
      mobileRadius: 12,
      additionalFee: 6
    },
    verification: {
      isVerified: true,
      verifiedAt: new Date()
    }
  },
  {
    // Rumbidzai Mubvumba
    businessName: 'Rumbi\'s Family Hair Care',
    bio: 'Family-friendly stylist with expertise in children\'s hair and gentle hair care practices.',
    specialties: ['children_hair', 'natural_hair', 'braids', 'treatments'],
    experience: {
      years: 5,
      description: 'Specialized training in children\'s hair care and sensitive scalp treatments'
    },
    services: [
      {
        name: 'Kids Hair Styling',
        category: 'children_hair',
        basePrice: { amount: 20, currency: 'USD' },
        duration: 60,
        description: 'Gentle styling for children aged 3-12'
      },
      {
        name: 'Scalp Treatment',
        category: 'treatments',
        basePrice: { amount: 30, currency: 'USD' },
        duration: 75,
        description: 'Deep conditioning and scalp therapy'
      },
      {
        name: 'Mini Braids',
        category: 'braids',
        basePrice: { amount: 40, currency: 'USD' },
        duration: 180,
        description: 'Small protective braids perfect for all ages'
      }
    ],
    availability: {
      schedule: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '16:00', isAvailable: true },
        { dayOfWeek: 2, startTime: '09:00', endTime: '16:00', isAvailable: true },
        { dayOfWeek: 3, startTime: '09:00', endTime: '16:00', isAvailable: true },
        { dayOfWeek: 4, startTime: '09:00', endTime: '16:00', isAvailable: true },
        { dayOfWeek: 5, startTime: '09:00', endTime: '16:00', isAvailable: true },
        { dayOfWeek: 6, startTime: '10:00', endTime: '14:00', isAvailable: true },
        { dayOfWeek: 0, startTime: '10:00', endTime: '14:00', isAvailable: true }
      ],
      exceptions: []
    },
    location: {
      isHomeBased: true,
      isMobile: true,
      homeStudio: {
        address: '34 Waterfalls Avenue, Waterfalls, Harare',
        description: 'Child-friendly home studio environment',
        amenities: ['parking', 'kids_area', 'refreshments']
      },
      mobileRadius: 10,
      additionalFee: 3
    },
    verification: {
      isVerified: true,
      verifiedAt: new Date()
    }
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB using the same connection as the main app
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/curlmap', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'test' // Explicitly specify the database name to match server config
    });

    console.log('Connected to MongoDB');
    console.log('Database name:', mongoose.connection.name);

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Stylist.deleteMany({});

    console.log('Creating demo users...');
    
    // Create users
    const createdUsers = [];
    for (const userData of demoUsers) {
      const user = new User(userData);
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`Created user: ${userData.name} (${userData.role})`);
    }

    // Create stylist profiles for users with role 'stylist'
    console.log('Creating stylist profiles...');
    
    const stylistUsers = createdUsers.filter(user => user.role === 'stylist');
    
    for (let i = 0; i < stylistUsers.length; i++) {
      const stylistUser = stylistUsers[i];
      const profileData = stylistProfiles[i];
      
      const stylistProfile = new Stylist({
        userId: stylistUser._id,
        ...profileData
      });
      
      await stylistProfile.save();
      console.log(`Created stylist profile: ${profileData.businessName}`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\n👥 Demo Users Created:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n👨‍💼 Admin:');
    console.log('Email: admin@curlmap.com | Password: admin123');
    
    console.log('\n👩‍🦱 Customers:');
    const customers = createdUsers.filter(user => user.role === 'customer');
    customers.forEach(customer => {
      console.log(`Email: ${customer.email} | Password: customer123`);
    });
    
    console.log('\n💇‍♀️ Stylists:');
    const stylists = createdUsers.filter(user => user.role === 'stylist');
    stylists.forEach(stylist => {
      console.log(`Email: ${stylist.email} | Password: stylist123`);
    });
    
    console.log('\n🎯 Quick Test Login:');
    console.log('Customer: sarah.johnson@email.com / customer123');
    console.log('Stylist: grace.manyika@email.com / stylist123');
    console.log('Admin: admin@curlmap.com / admin123');
    
    console.log('\n💡 All users are verified and ready to use!');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;