const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('Testing TrendWise DB API endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/api/trendwise-db/health`);
    const healthData = await healthResponse.json();
    console.log('Health check result:', healthData);
    console.log('');

    // Test status endpoint
    console.log('2. Testing status endpoint...');
    const statusResponse = await fetch(`${BASE_URL}/api/trendwise-db/status`);
    const statusData = await statusResponse.json();
    console.log('Status check result:', statusData);
    console.log('');

    // Test demo endpoint
    console.log('3. Testing demo endpoint...');
    const demoResponse = await fetch(`${BASE_URL}/api/trendwise-db/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadTimeDays: 7 })
    });
    const demoData = await demoResponse.json();
    console.log('Demo result:', demoData);
    console.log('');

  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

testAPI();
