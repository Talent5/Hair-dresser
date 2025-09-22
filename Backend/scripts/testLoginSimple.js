const https = require('https');
const http = require('http');
const { URL } = require('url');

// Working credentials we found
const WORKING_CREDENTIALS = {
  email: 'admin@curlmap.com',
  password: 'admin123'
};

function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Node.js Test Script',
        ...options.headers
      },
      timeout: 15000
    };
    
    if (data) {
      const jsonData = JSON.stringify(data);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }
    
    const req = lib.request(requestOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testLogin() {
  console.log('🧪 Testing Login with Node.js Built-in HTTP...\n');
  
  // Test local server first
  const localUrl = 'http://localhost:5000';
  
  console.log(`🏠 Testing Local Server: ${localUrl}`);
  console.log('='.repeat(50));
  
  try {
    // 1. Health check
    console.log('1. Health Check...');
    try {
      const healthResponse = await makeRequest(`${localUrl}/api/health`);
      console.log(`✅ Health check: ${healthResponse.status}`);
      if (healthResponse.data.status) {
        console.log(`Server status: ${healthResponse.data.status}`);
      }
    } catch (healthError) {
      console.log(`❌ Health check failed: ${healthError.message}`);
      if (healthError.code === 'ECONNREFUSED') {
        console.log('💡 Local server not running. Start it with: npm start');
        return;
      }
    }
    
    // 2. Login test
    console.log('\n2. Login Test...');
    const loginResponse = await makeRequest(`${localUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Origin': 'https://hair-dresser-adkn.onrender.com'
      }
    }, WORKING_CREDENTIALS);
    
    console.log(`Status: ${loginResponse.status}`);
    console.log('Response:');
    console.log(JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.status === 200) {
      console.log('\n🎉 LOGIN SUCCESSFUL!');
      console.log('✅ Authentication is working locally');
      
      // Test token if available
      const token = loginResponse.data.data?.tokens?.accessToken;
      if (token) {
        console.log('\n3. Token Verification...');
        try {
          const verifyResponse = await makeRequest(`${localUrl}/api/auth/verify-token`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log(`Token verification: ${verifyResponse.status}`);
          if (verifyResponse.status === 200) {
            console.log('✅ Token is valid');
            console.log(`User: ${verifyResponse.data.data?.user?.name}`);
          }
        } catch (verifyError) {
          console.log(`❌ Token verification failed: ${verifyError.message}`);
        }
      }
      
    } else if (loginResponse.status === 401) {
      console.log('❌ Authentication failed - wrong credentials');
    } else if (loginResponse.status === 400) {
      console.log('❌ Bad request - validation error');
    } else if (loginResponse.status === 500) {
      console.log('❌ Server error');
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    console.log(`Error code: ${error.code || 'Unknown'}`);
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Provide summary
  console.log('\n📋 SUMMARY:');
  console.log('-----------');
  console.log('✅ Found working credentials:');
  console.log(`   Email: ${WORKING_CREDENTIALS.email}`);
  console.log(`   Password: ${WORKING_CREDENTIALS.password}`);
  console.log('');
  console.log('🔍 If your app still shows "something went wrong":');
  console.log('   1. Check if you\'re using the correct backend URL in your app');
  console.log('   2. Verify these credentials work in your app\'s login form');
  console.log('   3. Check browser network tab for actual error responses');
  console.log('   4. Make sure your production backend is running');
  console.log('   5. Check that CORS allows your frontend domain');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('   - Test these credentials in your actual app');
  console.log('   - Check your app\'s API endpoint configuration');
  console.log('   - Look at browser console for JavaScript errors');
}

// Run the test
testLogin().catch(console.error);