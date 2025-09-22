const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function fixUserPasswords() {
  try {
    console.log('🔧 Starting User Password Fix...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/curlmap', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'test'
    });
    
    console.log('✅ Connected to database');
    
    // Find all users without password hashes
    const usersWithoutPasswords = await User.find({
      $or: [
        { password: { $exists: false } },
        { password: null },
        { password: '' }
      ]
    }).select('name email phone role');
    
    console.log(`Found ${usersWithoutPasswords.length} users without password hashes:`);
    usersWithoutPasswords.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email || user.phone}) - ${user.role}`);
    });
    
    if (usersWithoutPasswords.length === 0) {
      console.log('✅ All users have password hashes - issue might be elsewhere');
      return;
    }
    
    // Fix passwords for users without them
    console.log('\n🔧 Fixing user passwords...');
    console.log('Setting default password: "password123" for all users without passwords');
    console.log('⚠️  Users should change their passwords after first login\n');
    
    const defaultPassword = 'password123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
    
    for (const user of usersWithoutPasswords) {
      try {
        await User.findByIdAndUpdate(user._id, {
          password: hashedPassword
        });
        console.log(`✅ Fixed password for: ${user.name} (${user.email || user.phone})`);
      } catch (error) {
        console.log(`❌ Failed to fix password for: ${user.name} - ${error.message}`);
      }
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const stillBrokenUsers = await User.find({
      $or: [
        { password: { $exists: false } },
        { password: null },
        { password: '' }
      ]
    });
    
    if (stillBrokenUsers.length === 0) {
      console.log('✅ All users now have password hashes!');
      console.log('🎉 Login should now work with password: "password123"');
      console.log('📝 Remember to ask users to change their passwords after login');
    } else {
      console.log(`❌ ${stillBrokenUsers.length} users still missing passwords`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
  }
}

// Run the fix
fixUserPasswords().catch(console.error);