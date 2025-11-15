// Explicitly load env vars
import 'dotenv/config'
import { uploadImageToIPFS, getStorageStatus } from './src/services/storage'

async function test() {
  console.log('\n🔍 Testing Storacha Integration with ENV...\n');
  console.log('ENV Status:');
  console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('- STORACHA_PRIVATE_KEY:', process.env.STORACHA_PRIVATE_KEY ? '✅ Set' : '❌ Not set');
  console.log('- STORACHA_PROOF:', process.env.STORACHA_PROOF ? '✅ Set' : '❌ Not set');

  // Test 1: Check status
  console.log('\n📊 1. Checking Storage Status...');
  const status = await getStorageStatus();
  console.log('Storage Status:', JSON.stringify(status, null, 2));

  // Test 2: Upload test image
  console.log('\n📤 2. Uploading Test Image...');
  const testBuffer = Buffer.from('test image data');
  const result = await uploadImageToIPFS({
    bondId: 'test_bond_001',
    buffer: testBuffer,
    filename: 'test-certificate.png',
    contentType: 'image/png'
  });
  console.log('Upload Result:', JSON.stringify(result, null, 2));

  console.log('\n✅ Test Complete!\n');
}

test().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
