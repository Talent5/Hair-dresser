const mongoose = require('mongoose');
const Stylist = require('../models/Stylist');
const User = require('../models/User');
require('dotenv').config();

async function fixCorruptedUserIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hairdresser');
    console.log('Connected to MongoDB');

    // Find all stylists with corrupted userId fields
    const stylists = await Stylist.find({
      $or: [
        { userId: '[object Object]' },
        { userId: { $exists: false } },
        { userId: null },
        { userId: '' }
      ]
    }).populate('userId');

    console.log(`Found ${stylists.length} stylists with corrupted userId fields`);

    for (const stylist of stylists) {
      console.log(`\nProcessing stylist ${stylist._id}...`);
      console.log(`Current userId: ${stylist.userId}`);

      // Try to find the correct user based on the stylist's creation pattern
      // Look for users with stylist role that don't have a corresponding stylist profile
      const potentialUsers = await User.find({ 
        role: 'stylist',
        _id: { $nin: await Stylist.distinct('userId', { userId: { $ne: '[object Object]' } }) }
      });

      if (potentialUsers.length === 1) {
        // If there's exactly one orphaned stylist user, link them
        const correctUser = potentialUsers[0];
        stylist.userId = correctUser._id;
        await stylist.save();
        console.log(`✅ Fixed stylist ${stylist._id} - linked to user ${correctUser._id} (${correctUser.name})`);
      } else if (potentialUsers.length > 1) {
        console.log(`⚠️  Multiple potential users found for stylist ${stylist._id}:`);
        potentialUsers.forEach(user => {
          console.log(`   - ${user._id}: ${user.name} (${user.email})`);
        });
        console.log('   Manual intervention required');
      } else {
        console.log(`❌ No suitable user found for stylist ${stylist._id}`);
      }
    }

    // Verify the fixes
    const remainingCorrupted = await Stylist.countDocuments({
      $or: [
        { userId: '[object Object]' },
        { userId: { $exists: false } },
        { userId: null },
        { userId: '' }
      ]
    });

    console.log(`\n✅ Fix complete. ${remainingCorrupted} stylists still have corrupted userId fields.`);

  } catch (error) {
    console.error('Error fixing corrupted userIds:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixCorruptedUserIds().then(() => process.exit(0));
}

module.exports = fixCorruptedUserIds;