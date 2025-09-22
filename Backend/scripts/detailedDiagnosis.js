const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function detailedLoginDiagnosis() {
  try {
    console.log('🔍 Detailed Login Diagnosis...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/curlmap', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'test'
    });
    
    console.log('✅ Connected to database\n');
    
    // 1. Check all users with password selection enabled
    console.log('1️⃣ CHECKING ALL USERS WITH PASSWORDS:');
    console.log('--------------------------------------');
    
    const allUsers = await User.find({}).select('+password');
    console.log(`Total users found: ${allUsers.length}\n`);
    
    for (let i = 0; i < Math.min(allUsers.length, 5); i++) {
      const user = allUsers[i];
      console.log(`User ${i + 1}: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Phone: ${user.phone}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Active: ${user.isActive}`);
      console.log(`  Has Password: ${!!user.password}`);
      console.log(`  Password Length: ${user.password ? user.password.length : 0}`);
      console.log(`  Password Looks Hashed: ${user.password && user.password.startsWith('$2')}`);
      console.log();
    }
    
    // 2. Test actual login simulation with a specific user
    console.log('2️⃣ LOGIN SIMULATION:');
    console.log('---------------------');
    
    // Find the first active user
    const testUser = await User.findOne({ isActive: true }).select('+password');
    
    if (!testUser) {
      console.log('❌ No active users found');
      return;
    }
    
    console.log(`Testing with user: ${testUser.name} (${testUser.email})`);
    console.log(`User ID: ${testUser._id}`);
    console.log(`Has password: ${!!testUser.password}`);
    
    if (!testUser.password) {
      console.log('❌ User has no password - this is the problem!');
      
      // Fix this user's password
      console.log('🔧 Setting default password for this user...');
      const defaultPassword = 'password123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      await User.findByIdAndUpdate(testUser._id, {
        password: hashedPassword
      });
      
      console.log(`✅ Set password for ${testUser.name}`);
      console.log(`📝 Test login credentials:`);
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Password: ${defaultPassword}`);
      
      return;
    }
    
    // Test password comparison
    console.log('\n3️⃣ PASSWORD VERIFICATION TEST:');
    console.log('-------------------------------');
    
    const testPasswords = ['password123', 'test123456', 'admin123', '123456'];
    
    for (const testPassword of testPasswords) {
      try {
        const isMatch = await testUser.comparePassword(testPassword);
        console.log(`Password "${testPassword}": ${isMatch ? '✅ MATCH' : '❌ No match'}`);
        
        if (isMatch) {
          console.log(`🎉 Found working password: "${testPassword}"`);
          console.log(`📝 Login credentials that should work:`);
          console.log(`   Email: ${testUser.email}`);
          console.log(`   Phone: ${testUser.phone}`);
          console.log(`   Password: ${testPassword}`);
          break;
        }
      } catch (error) {
        console.log(`Password "${testPassword}": ❌ Error - ${error.message}`);
      }
    }
    
    // 4. Check if password comparison method works at all
    console.log('\n4️⃣ PASSWORD HASH VERIFICATION:');
    console.log('-------------------------------');
    
    try {
      // Create a test hash and verify it works
      const testPlainPassword = 'testpassword123';
      const testHash = await bcrypt.hash(testPlainPassword, 12);
      const directComparison = await bcrypt.compare(testPlainPassword, testHash);
      
      console.log('Direct bcrypt test:', directComparison ? '✅ Working' : '❌ Failed');
      
      // Test the user's actual password comparison method
      if (testUser.password) {
        const userMethodTest = await testUser.comparePassword('anypassword');
        console.log('User comparePassword method:', typeof userMethodTest === 'boolean' ? '✅ Working' : '❌ Failed');
      }
      
    } catch (error) {
      console.log('Password hash verification error:', error.message);
    }
    
    // 5. Provide specific recommendations
    console.log('\n5️⃣ RECOMMENDATIONS:');
    console.log('--------------------');
    
    if (!testUser.password) {
      console.log('🚨 CRITICAL: Users are missing password hashes');
      console.log('   Run: node scripts/fixUserPasswords.js');
    } else {
      console.log('✅ Users have password hashes');
      console.log('💡 Try these test credentials in your app:');
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Phone: ${testUser.phone}`);
      console.log('   Common passwords: password123, test123456, admin123');
      console.log('');
      console.log('🔍 If login still fails, check:');
      console.log('   1. Frontend is sending correct request format');
      console.log('   2. Server error logs for detailed error messages');
      console.log('   3. Network connectivity between frontend and backend');
      console.log('   4. CORS configuration for production domain');
    }
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Database disconnected');
  }
}

// Run diagnosis
detailedLoginDiagnosis().catch(console.error);