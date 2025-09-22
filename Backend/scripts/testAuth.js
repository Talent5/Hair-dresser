const axios = require('axios');
require('dotenv').config();

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000'; // Change this to your production URL
const TEST_CREDENTIALS = {
  // Test with different credential formats
  emailLogin: {
    email: 'test@example.com', // Replace with actual test email
    password: 'test123456'
  },
  phoneLogin: {
    phone: '+263771234567', // Replace with actual test phone
    password: 'test123456'
  }
};

async function testAuthEndpoints() {
  console.log('🧪 Testing Authentication Endpoints...\n');
  console.log('Base URL:', BASE_URL);
  console.log('Testing against:', `${BASE_URL}/api/auth/login`);
  console.log();

  // Test 1: Health Check
  console.log('1️⃣ HEALTH CHECK:');
  console.log('----------------');
  try {
    const response = await axios.get(`${BASE_URL}/api/health`, {
      timeout: 10000
    });
    console.log('✅ Server is running');
    console.log('Health status:', response.data);
  } catch (error) {
    console.log('❌ Server health check failed');
    console.log('Error:', error.code || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('🚨 Server appears to be down or unreachable');
      return;
    }
  }

  // Test 2: Test Login with Email
  console.log('\n2️⃣ LOGIN TEST (Email):');
  console.log('-----------------------');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, TEST_CREDENTIALS.emailLogin, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Email login successful');
    console.log('Response status:', response.status);
    console.log('User info:', response.data.data?.user?.name || 'No user info');
    console.log('Token received:', !!response.data.data?.tokens?.accessToken);
    
  } catch (error) {
    console.log('❌ Email login failed');
    console.log('Status:', error.response?.status || 'No status');
    console.log('Error message:', error.response?.data?.message || error.message);
    console.log('Full error response:', JSON.stringify(error.response?.data, null, 2));
  }

  // Test 3: Test Login with Phone
  console.log('\n3️⃣ LOGIN TEST (Phone):');
  console.log('-----------------------');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, TEST_CREDENTIALS.phoneLogin, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Phone login successful');
    console.log('Response status:', response.status);
    console.log('User info:', response.data.data?.user?.name || 'No user info');
    console.log('Token received:', !!response.data.data?.tokens?.accessToken);
    
  } catch (error) {
    console.log('❌ Phone login failed');
    console.log('Status:', error.response?.status || 'No status');
    console.log('Error message:', error.response?.data?.message || error.message);
    console.log('Full error response:', JSON.stringify(error.response?.data, null, 2));
  }

  // Test 4: Test with Invalid Credentials
  console.log('\n4️⃣ INVALID CREDENTIALS TEST:');
  console.log('-----------------------------');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('⚠️ Invalid credentials test returned success (unexpected)');
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Invalid credentials properly rejected (401)');
      console.log('Error message:', error.response?.data?.message);
    } else {
      console.log('❌ Unexpected error for invalid credentials');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data?.message || error.message);
    }
  }

  // Test 5: Test Missing Required Fields
  console.log('\n5️⃣ VALIDATION TEST (Missing Fields):');
  console.log('-------------------------------------');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      password: 'test123456'
      // Missing email/phone
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('⚠️ Missing fields test returned success (unexpected)');
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Missing fields properly rejected (400)');
      console.log('Error message:', error.response?.data?.message);
    } else {
      console.log('❌ Unexpected error for missing fields');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data?.message || error.message);
    }
  }

  // Test 6: CORS Test
  console.log('\n6️⃣ CORS TEST:');
  console.log('--------------');
  try {
    const response = await axios.options(`${BASE_URL}/api/auth/login`, {
      headers: {
        'Origin': 'https://hair-dresser-adkn.onrender.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      timeout: 10000
    });
    
    console.log('✅ CORS preflight successful');
    console.log('Status:', response.status);
    
  } catch (error) {
    console.log('❌ CORS preflight failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.message);
  }

  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('--------------------');
  console.log('1. If health check fails: Server is down or URL is wrong');
  console.log('2. If login returns 500: Check server logs for detailed error');
  console.log('3. If login returns 401: Check user credentials in database');
  console.log('4. If login returns 400: Check request validation');
  console.log('5. Update TEST_CREDENTIALS above with real test user data');
  console.log('6. Check server logs while running this test for more details');
  
  console.log('\n✅ Authentication test completed!');
}

// Handle process termination
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run the test
testAuthEndpoints().catch(console.error);