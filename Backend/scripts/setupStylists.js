const mongoose = require('mongoose');
const User = require('../models/User');
const Stylist = require('../models/Stylist');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hairdresser', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Helper function to create stylist profile
const createStylistProfile = async (userId) => {
  try {
    const existingStylist = await Stylist.findOne({ userId });
    if (existingStylist) {
      return existingStylist;
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const stylistData = {
      userId: userId,
      businessName: user.name || 'Hair Stylist',
      bio: 'Professional hair stylist providing quality services',
      specialties: ['general'],
      experience: {
        years: 1,
        description: 'Experienced hair stylist'
      },
      services: [
        {
          name: 'Basic Cut & Style',
          category: 'cuts',
          description: 'Professional haircut and styling',
          duration: 60,
          basePrice: { amount: 50, currency: 'USD' },
          isActive: true
        }
      ],
      location: {
        isMobile: false,
        isHomeBased: true,
        address: user.address || '',
        mobileRadius: 10,
        additionalFee: 0
      },
      availability: {
        schedule: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true },
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true },
          { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true }
        ],
        exceptions: []
      },
      portfolio: [],
      rating: { average: 5.0, count: 0 },
      statistics: {
        completedBookings: 0,
        totalEarnings: 0,
        averageRating: 5.0,
        responseTime: 30
      },
      settings: {
        notifications: {
          bookingRequests: true,
          messages: true,
          reminders: true,
          marketing: false
        },
        paymentSettings: {
          bankDetails: {},
          paymentMethods: [],
          taxSettings: {}
        }
      },
      verification: {
        isVerified: false,
        documents: []
      },
      reviews: [],
      isActive: true,
      isPremium: false
    };

    const stylist = new Stylist(stylistData);
    await stylist.save();
    
    console.log(`✅ Created stylist profile for user: ${user.name || user.email}`);
    return stylist;
  } catch (error) {
    console.error(`❌ Error creating stylist profile for user ${userId}:`, error.message);
    return null;
  }
};

async function setupStylistsFromUsers() {
  try {
    console.log('Setting up stylist profiles...');

    // Find all users
    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} total users`);

    // Show user details to help identify stylists
    console.log('\nUser details:');
    for (const user of allUsers) {
      console.log(`- ${user._id}: ${user.name || 'No name'} (${user.email}) - Role: ${user.role}`);
    }

    // For now, let's create stylist profiles for ALL users and update their roles
    // You can modify this logic based on your specific needs
    let createdCount = 0;
    let updatedRoleCount = 0;

    for (const user of allUsers) {
      // Update role to stylist
      if (user.role !== 'stylist') {
        await User.findByIdAndUpdate(user._id, { role: 'stylist' });
        updatedRoleCount++;
        console.log(`Updated role for ${user.name || user.email} to 'stylist'`);
      }

      // Create stylist profile
      const stylist = await createStylistProfile(user._id);
      if (stylist) {
        createdCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`- Total users found: ${allUsers.length}`);
    console.log(`- User roles updated: ${updatedRoleCount}`);
    console.log(`- Stylist profiles created: ${createdCount}`);
    console.log(`✅ Setup completed successfully!`);

  } catch (error) {
    console.error('Error setting up stylists:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
async function run() {
  await connectDB();
  await setupStylistsFromUsers();
}

run();