#!/usr/bin/env node

/**
 * Test Script for TrendWise Professional Pipeline
 * 
 * This script tests the new database-driven pipeline functionality
 * without requiring file uploads.
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api/trendwise-db';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`\n🔍 Testing ${method} ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Success: ${response.status}`);
      console.log('📊 Response:', JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log(`❌ Error: ${response.status}`);
      console.log('📊 Error Response:', JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting TrendWise Professional Pipeline Tests');
  console.log('=' .repeat(60));

  // Test 1: Health Check
  console.log('\n📋 Test 1: Health Check');
  await testEndpoint('/health');

  // Test 2: Status Check
  console.log('\n📋 Test 2: Status Check');
  await testEndpoint('/status');

  // Test 3: Data Summary
  console.log('\n📋 Test 3: Data Summary');
  await testEndpoint('/data-summary');

  // Test 4: Recent Predictions
  console.log('\n📋 Test 4: Recent Predictions');
  await testEndpoint('/predictions?days=7');

  // Test 5: Demo Mode
  console.log('\n📋 Test 5: Demo Mode');
  await testEndpoint('/demo', 'POST', { leadTimeDays: 7 });

  // Test 6: Auto Pipeline
  console.log('\n📋 Test 6: Auto Pipeline');
  await testEndpoint('/auto-pipeline', 'POST', { 
    leadTimeDays: 7, 
    skipTraining: false 
  });

  // Test 7: Data Refresh
  console.log('\n📋 Test 7: Data Refresh');
  await testEndpoint('/refresh-data', 'POST', { 
    retrain: true, 
    leadTimeDays: 7 
  });

  console.log('\n🎉 All tests completed!');
  console.log('=' .repeat(60));
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/api/health');
    if (response.ok) {
      console.log('✅ Server is running on http://localhost:3001');
      return true;
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first:');
    console.log('   npm run dev');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testEndpoint, runTests };
