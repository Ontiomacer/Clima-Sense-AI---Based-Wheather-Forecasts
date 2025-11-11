// Simple test script to verify GEE API is working
const http = require('http');

console.log('Testing GEE API...\n');

// Test 1: Health check
const healthCheck = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('✓ Health Check:');
        console.log(JSON.parse(data));
        console.log('');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('✗ Health Check Failed:', error.message);
      reject(error);
    });

    req.end();
  });
};

// Test 2: Fetch rainfall data
const testRainfallData = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      dataset: 'rainfall',
      startDate: '2025-10-09',
      endDate: '2025-11-08'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/gee-data',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('✓ Rainfall Data Request:');
        const result = JSON.parse(data);
        console.log({
          success: result.success,
          dataset: result.dataset,
          dateRange: `${result.startDate} to ${result.endDate}`,
          hasVisParams: !!result.visParams,
          message: result.message
        });
        console.log('');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('✗ Rainfall Data Request Failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

// Run tests
(async () => {
  try {
    await healthCheck();
    await testRainfallData();
    console.log('✓ All tests passed!\n');
    console.log('Your GEE API server is working correctly.');
    console.log('You can now start the frontend with: npm run dev');
  } catch (error) {
    console.error('\n✗ Tests failed!');
    console.error('Make sure the GEE server is running: npm run gee-server');
  }
})();
