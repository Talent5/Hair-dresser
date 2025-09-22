const axios = require('axios');
require('dotenv').config();

// Use the credentials we found
const WORKING_CREDENTIALS = {
  email: 'admin@curlmap.com',
  password: 'admin123'
};

// Update this to your production URL
const PRODUCTION_URL = 'https://hair-dresser-backend.onrender.com'; // Update this
const LOCAL_URL = 'http://localhost:5000';

async function testRealLogin() {
  console.log('🧪 Testing Real Login with Working Credentials...\n');
  
  // Test both local and production
  const urls = [LOCAL_URL, PRODUCTION_URL];
  
  for (const baseUrl of urls) {
    console.log(`🌐 Testing: ${baseUrl}`);
    console.log('='.repeat(50));
    
    try {
      // 1. Health check first
      console.log('1. Health Check...');
      try {
        const healthResponse = await axios.get(`${baseUrl}/api/health`, { timeout: 10000 });
        console.log('✅ Server is responsive');
        console.log('Server status:', healthResponse.data.status);
      } catch (healthError) {
        console.log('❌ Health check failed:', healthError.code || healthError.message);
        if (healthError.code === 'ECONNREFUSED') {
          console.log('💀 Server is not running or unreachable');
          continue;
        }
      }
      
      // 2. Test login
      console.log('\n2. Login Test...');
      const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, WORKING_CREDENTIALS, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'https://hair-dresser-adkn.onrender.com' // Add origin header
        },
        timeout: 15000,
        validateStatus: function (status) {
          return status < 500; // Accept 4xx errors for debugging
        }
      });
      
      console.log(`Status: ${loginResponse.status}`);
      console.log('Response:');
      console.log(JSON.stringify(loginResponse.data, null, 2));
      
      if (loginResponse.status === 200) {
        console.log('🎉 LOGIN SUCCESSFUL!');
        console.log('✅ Authentication is working correctly');
        console.log('🔑 Access token received:', !!loginResponse.data.data?.tokens?.accessToken);
        
        // Test token verification
        if (loginResponse.data.data?.tokens?.accessToken) {
          console.log('\n3. Token Verification Test...');
          try {
            const verifyResponse = await axios.get(`${baseUrl}/api/auth/verify-token`, {
              headers: {
                'Authorization': `Bearer ${loginResponse.data.data.tokens.accessToken}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            });
            
            console.log('✅ Token verification successful');
            console.log('User info:', verifyResponse.data.data?.user?.name);
            
          } catch (verifyError) {
            console.log('❌ Token verification failed:', verifyError.response?.data?.message || verifyError.message);
          }
        }
        
      } else {
        console.log('❌ LOGIN FAILED');
        if (loginResponse.status === 401) {
          console.log('🔐 Authentication issue - wrong credentials or user not found');
        } else if (loginResponse.status === 400) {
          console.log('📝 Validation issue - check request format');
        } else if (loginResponse.status === 500) {
          console.log('🚨 Server error - check backend logs');
        }
      }
      
    } catch (error) {
      console.log('❌ Request failed completely');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      
      if (error.code === 'ECONNREFUSED') {
        console.log('💀 Cannot connect to server');
      } else if (error.code === 'ENOTFOUND') {
        console.log('🌐 DNS resolution failed - check URL');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('⏰ Request timed out');
      }
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
  }
  
  // Summary and next steps
  console.log('📋 SUMMARY & NEXT STEPS:');
  console.log('-------------------------');
  console.log('✅ Working test credentials found:');
  console.log(`   Email: ${WORKING_CREDENTIALS.email}`);
  console.log(`   Password: ${WORKING_CREDENTIALS.password}`);
  console.log('');
  console.log('🔍 If production login still fails:');
  console.log('   1. Update PRODUCTION_URL above to your actual backend URL');
  console.log('   2. Check if your production server is running');
  console.log('   3. Verify environment variables are set in production');
  console.log('   4. Check production server logs for detailed errors');
  console.log('   5. Ensure CORS is configured for your frontend domain');
  console.log('');
  console.log('📱 For your frontend app:');
  console.log('   - Use these credentials to test login');
  console.log('   - Check network requests in browser dev tools');
  console.log('   - Verify API endpoint URLs in your frontend code');
}

// Run the test
testRealLogin().catch(console.error);