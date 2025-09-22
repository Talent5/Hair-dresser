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

async function fixStylistRoles() {
  try {
    console.log('Starting to fix stylist roles...');

    // Find all stylist profiles
    const stylistProfiles = await Stylist.find({}).populate('userId');
    console.log(`Found ${stylistProfiles.length} stylist profiles`);

    let updatedCount = 0;

    for (const stylistProfile of stylistProfiles) {
      if (stylistProfile.userId) {
        const user = stylistProfile.userId;
        if (user.role !== 'stylist') {
          console.log(`Updating user ${user._id} (${user.name || user.email}) from role '${user.role}' to 'stylist'`);
          
          // Update the user role
          await User.findByIdAndUpdate(user._id, { role: 'stylist' });
          updatedCount++;
        }
      }
    }

    // Also check for users who might need to be stylists based on search patterns
    // Look for users who appear in any stylist search results but aren't marked as stylists
    const potentialStylists = await User.find({
      role: { $ne: 'stylist' },
      // Add criteria here if you know specific patterns for stylists
    });

    console.log(`Found ${potentialStylists.length} potential stylists to review`);

    for (const user of potentialStylists) {
      // Check if this user has a stylist profile
      const existingStylistProfile = await Stylist.findOne({ userId: user._id });
      if (existingStylistProfile) {
        console.log(`Found user ${user._id} with stylist profile but wrong role. Updating...`);
        await User.findByIdAndUpdate(user._id, { role: 'stylist' });
        updatedCount++;
      }
    }

    console.log(`\nSummary:`);
    console.log(`- Total stylist profiles found: ${stylistProfiles.length}`);
    console.log(`- User roles updated: ${updatedCount}`);
    console.log(`✅ Fix completed successfully!`);

  } catch (error) {
    console.error('Error fixing stylist roles:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
async function run() {
  await connectDB();
  await fixStylistRoles();
}

run();