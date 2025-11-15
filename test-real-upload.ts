/**
 * Real Storacha Upload Test
 * This will actually upload to your Storacha space
 */

import 'dotenv/config'
import { uploadImageToIPFS, getStorageStatus } from './src/services/storage'

async function testRealUpload() {
  console.log('\n🚀 Testing REAL Storacha Upload...\n')

  // Check status
  console.log('1️⃣  Checking Storage Status...')
  const status = await getStorageStatus()
  console.log('   Provider:', status.provider)
  console.log('   Configured:', status.configured)
  console.log('   Working:', status.working ? '✅ YES' : '❌ NO')
  
  if (!status.working) {
    console.log('\n❌ Storacha not working. Check:')
    console.log('   - STORACHA_PRIVATE_KEY is set')
    console.log('   - STORACHA_PROOF is set')
    console.log('   - node-fetch is installed')
    return
  }

  console.log('\n2️⃣  Creating Test Image...')
  const testImage = Buffer.from('Test certificate image from ARC-FX NFT system - ' + new Date().toISOString())
  console.log('   Size:', testImage.length, 'bytes')

  console.log('\n3️⃣  Uploading to Storacha...')
  const result = await uploadImageToIPFS({
    bondId: 'real_test_' + Date.now(),
    buffer: testImage,
    filename: 'test-real-upload.txt',
    contentType: 'text/plain'
  })

  console.log('\n✅ UPLOAD COMPLETE!\n')
  console.log('   Storage Type:', result.storage_type)
  console.log('   CID:', result.cid)
  console.log('   IPFS URL:', result.ipfs_url)
  console.log('   Gateway URL:', result.gateway_url)

  if (result.storage_type === 'ipfs') {
    console.log('\n🎉 SUCCESS! Check your Storacha console:')
    console.log('   https://console.storacha.network/space/' + status.space_did)
    console.log('\n   View your upload:')
    console.log('   ' + result.gateway_url)
  } else {
    console.log('\n⚠️  Still using mock storage. Check configuration.')
  }

  console.log('\n')
}

testRealUpload().catch(err => {
  console.error('❌ Error:', err.message)
  console.error(err)
  process.exit(1)
})

