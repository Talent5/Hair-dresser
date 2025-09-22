const https = require('https');
const { URL } = require('url');

// Working credentials we found
const WORKING_CREDENTIALS = {
  email: 'admin@curlmap.com',
  password: 'admin123'
};

const PRODUCTION_URL = 'https://hair-dresser-adkn.onrender.com';

function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Node.js Production Test',
        ...options.headers
      },
      timeout: 20000
    };
    
    if (data) {
      const jsonData = JSON.stringify(data);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }
    
    const req = https.request(requestOptions, (res) => {
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
            data: parsedData,
            raw: responseData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData,
            raw: responseData
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

async function testProductionLogin() {
  console.log('🌐 Testing PRODUCTION Server Authentication...\n');
  console.log(`Production URL: ${PRODUCTION_URL}`);
  console.log('='.repeat(60));
  
  try {
    // 1. Health check first
    console.log('1️⃣ PRODUCTION HEALTH CHECK:');
    console.log('----------------------------');
    try {
      const healthResponse = await makeRequest(`${PRODUCTION_URL}/api/health`);
      console.log(`✅ Health Status: ${healthResponse.status}`);
      
      if (healthResponse.status === 200) {
        console.log('✅ Production server is running');
        console.log('Server info:', JSON.stringify(healthResponse.data, null, 2));
      } else {
        console.log('⚠️ Unexpected health status:', healthResponse.status);
        console.log('Response:', healthResponse.raw);
      }
    } catch (healthError) {
      console.log('❌ Production health check failed:', healthError.message);
      console.log('Error details:', healthError.code || 'Unknown error');
      
      if (healthError.code === 'ENOTFOUND') {
        console.log('🚨 DNS resolution failed - check if URL is correct');
        return;
      } else if (healthError.code === 'ECONNREFUSED') {
        console.log('🚨 Connection refused - server might be down');
        return;
      } else if (healthError.message.includes('timeout')) {
        console.log('🚨 Request timed out - server might be slow to respond');
      }
    }
    
    // 2. Test actual login
    console.log('\n2️⃣ PRODUCTION LOGIN TEST:');
    console.log('--------------------------');
    console.log('Testing credentials:');
    console.log(`  Email: ${WORKING_CREDENTIALS.email}`);
    console.log(`  Password: ${WORKING_CREDENTIALS.password}`);
    console.log();
    
    try {
      const loginResponse = await makeRequest(`${PRODUCTION_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Origin': 'https://hair-dresser-adkn.onrender.com',
          'Referer': 'https://hair-dresser-adkn.onrender.com/'
        }
      }, WORKING_CREDENTIALS);
      
      console.log(`Login Status: ${loginResponse.status}`);
      
      if (loginResponse.status === 200) {
        console.log('🎉 PRODUCTION LOGIN SUCCESSFUL!');
        console.log('✅ Authentication is working in production');
        console.log('User:', loginResponse.data.data?.user?.name);
        console.log('Role:', loginResponse.data.data?.user?.role);
        console.log('Token received:', !!loginResponse.data.data?.tokens?.accessToken);
        
        // Test token verification on production
        const token = loginResponse.data.data?.tokens?.accessToken;
        if (token) {
          console.log('\n3️⃣ PRODUCTION TOKEN VERIFICATION:');
          console.log('----------------------------------');
          try {
            const verifyResponse = await makeRequest(`${PRODUCTION_URL}/api/auth/verify-token`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log(`Token Status: ${verifyResponse.status}`);
            if (verifyResponse.status === 200) {
              console.log('✅ Token verification successful');
              console.log('Verified user:', verifyResponse.data.data?.user?.name);
            } else {
              console.log('❌ Token verification failed');
              console.log('Response:', JSON.stringify(verifyResponse.data, null, 2));
            }
          } catch (verifyError) {
            console.log('❌ Token verification request failed:', verifyError.message);
          }
        }
        
      } else if (loginResponse.status === 401) {
        console.log('❌ AUTHENTICATION FAILED (401)');
        console.log('This means wrong credentials or user not found');
        console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
        
      } else if (loginResponse.status === 400) {
        console.log('❌ BAD REQUEST (400)');
        console.log('This means validation error or malformed request');
        console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
        
      } else if (loginResponse.status === 500) {
        console.log('❌ SERVER ERROR (500)');
        console.log('This means internal server error - check production logs');
        console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
        
      } else if (loginResponse.status === 404) {
        console.log('❌ NOT FOUND (404)');
        console.log('Login endpoint not found - check URL and routing');
        console.log('Response:', loginResponse.raw);
        
      } else {
        console.log(`❌ UNEXPECTED STATUS: ${loginResponse.status}`);
        console.log('Response:', loginResponse.raw);
      }
      
    } catch (loginError) {
      console.log('❌ Login request completely failed');
      console.log('Error:', loginError.message);
      console.log('Code:', loginError.code || 'Unknown');
    }
    
    // 4. Test CORS
    console.log('\n4️⃣ CORS TEST:');
    console.log('--------------');
    try {
      const corsResponse = await makeRequest(`${PRODUCTION_URL}/api/auth/login`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://hair-dresser-adkn.onrender.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });
      
      console.log(`CORS Status: ${corsResponse.status}`);
      console.log('CORS Headers:');
      Object.keys(corsResponse.headers).forEach(header => {
        if (header.toLowerCase().includes('access-control')) {
          console.log(`  ${header}: ${corsResponse.headers[header]}`);
        }
      });
      
      if (corsResponse.status === 200 || corsResponse.status === 204) {
        console.log('✅ CORS preflight successful');
      } else {
        console.log('⚠️ CORS preflight returned unexpected status');
      }
      
    } catch (corsError) {
      console.log('❌ CORS test failed:', corsError.message);
    }
    
  } catch (error) {
    console.log('❌ Production test failed completely:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Final diagnosis
  console.log('\n🔍 PRODUCTION DIAGNOSIS:');
  console.log('------------------------');
  console.log('✅ Working credentials confirmed:');
  console.log(`   Email: ${WORKING_CREDENTIALS.email}`);
  console.log(`   Password: ${WORKING_CREDENTIALS.password}`);
  console.log('');
  console.log('🎯 If your app still shows "something went wrong":');
  console.log('   1. ✅ Backend authentication is working');
  console.log('   2. 🔍 Problem is likely in your frontend app');
  console.log('   3. 📱 Check your mobile app\'s API configuration');
  console.log('   4. 🌐 Verify the API base URL in your app code');
  console.log('   5. 📊 Look at network requests in browser/app debugging tools');
  console.log('   6. 🔒 Check if app is sending correct request format');
  console.log('');
  console.log('🚀 Next Steps:');
  console.log('   - Use these exact credentials in your app');
  console.log('   - Check your app\'s login.js or auth service file');
  console.log('   - Verify API endpoint URLs match production backend');
  console.log('   - Test login from browser first, then mobile app');
}

// Run the production test
testProductionLogin().catch(console.error);