// Simple test script to verify API functionality
// Run with: node test-api.js

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/v1/health',
  method: 'GET'
};

console.log('Testing ARC-FX API...');
console.log('Attempting to connect to http://localhost:4000/v1/health\n');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ API is running!');
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.log('❌ API is not running');
  console.log('Error:', error.message);
  console.log('\nTo start the API:');
  console.log('1. Switch to Node 18+ (you have v16):');
  console.log('   nvm use 22');
  console.log('2. Then run:');
  console.log('   npm run dev');
});

req.end();

