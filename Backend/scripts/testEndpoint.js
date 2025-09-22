const http = require('http');

async function testStylistEndpoint() {
  const stylistId = '68cfe2f192131870549c9af3';
  const options = {
    hostname: '192.168.0.49',
    port: 5000,
    path: `/api/stylists/${stylistId}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      if (res.statusCode === 200) {
        console.log('✅ Success! Stylist endpoint working');
        const responseData = JSON.parse(data);
        console.log('Stylist Business Name:', responseData.data?.stylist?.businessName);
        console.log('Stylist ID:', responseData.data?.stylist?._id);
        console.log('User Name:', responseData.data?.stylist?.userId?.name);
        console.log('User Avatar:', responseData.data?.stylist?.userId?.avatar);
        console.log('User ProfileImage:', responseData.data?.stylist?.userId?.profileImage);
        console.log('\n📋 Full Response Structure:');
        console.log(JSON.stringify(responseData, null, 2));
      } else {
        console.log('❌ Error response:');
        console.log(data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Request error:', error.message);
  });

  req.end();
}

testStylistEndpoint();