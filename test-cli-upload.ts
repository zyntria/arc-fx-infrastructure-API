/**
 * Test Real Upload using Storacha CLI
 * This bypasses the JavaScript client and uses the CLI directly
 */

import 'dotenv/config'
import { uploadImageToIPFS, uploadMetadataToIPFS, getStorageStatus } from './src/services/storage-simple'

async function testCLIUpload() {
  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║  🚀 Storacha CLI Upload Test                    ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  // Check status
  console.log('1️⃣  Checking Storacha CLI Status...')
  const status = await getStorageStatus()
  console.log('   Provider:', status.provider)
  console.log('   Configured:', status.configured ? '✅ Yes' : '❌ No')
  console.log('   Working:', status.working ? '✅ Yes' : '❌ No')
  console.log('   Message:', status.message)

  if (!status.working) {
    console.log('\n❌ Storacha CLI not available or not logged in')
    console.log('\nTo fix:')
    console.log('   1. Install: npm install -g @storacha/client')
    console.log('   2. Login: storacha login your-email@example.com')
    console.log('   3. Select space: storacha space use <space_did>')
    return
  }

  // Test upload
  console.log('\n2️⃣  Creating Test Image...')
  const timestamp = new Date().toISOString()
  const testImage = Buffer.from(`ARC-FX Test Certificate
Created: ${timestamp}
Bond ID: test_${Date.now()}
This is a test upload to verify Storacha integration works!`)
  
  console.log('   Size:', testImage.length, 'bytes')

  console.log('\n3️⃣  Uploading to Storacha via CLI...')
  console.log('   (This will appear in your Storacha console)')
  
  const imageResult = await uploadImageToIPFS({
    bondId: `test_${Date.now()}`,
    buffer: testImage,
    filename: 'arc-test-certificate.txt'
  })

  console.log('\n✅ UPLOAD COMPLETE!\n')
  console.log('   Storage Type:', imageResult.storage_type)
  console.log('   CID:', imageResult.cid)
  console.log('   IPFS URL:', imageResult.ipfs_url)
  console.log('   Gateway URL:', imageResult.gateway_url)

  if (imageResult.storage_type === 'ipfs') {
    console.log('\n🎉 SUCCESS!')
    console.log('   ✅ File uploaded to real IPFS')
    console.log('   ✅ Should appear in Storacha console')
    console.log('   ✅ View at:', imageResult.gateway_url)
    console.log('\n📱 Check your Storacha console:')
    console.log('   https://console.storacha.network/')
  } else {
    console.log('\n⚠️  Used mock storage fallback')
    console.log('   Check storacha CLI is working: storacha space ls')
  }

  // Test metadata upload
  console.log('\n4️⃣  Testing Metadata Upload...')
  const metadata = {
    name: 'ARC-FX Test NFT',
    description: 'Test NFT certificate from ARC Finance',
    image: imageResult.ipfs_url,
    attributes: [
      { trait_type: 'Test', value: 'Success' },
      { trait_type: 'Timestamp', value: timestamp }
    ]
  }

  const metadataResult = await uploadMetadataToIPFS({
    metadata,
    filename: 'test-metadata.json'
  })

  console.log('   ✅ Metadata uploaded!')
  console.log('   CID:', metadataResult.cid)
  console.log('   View:', metadataResult.gateway_url)

  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║  ✅ TEST COMPLETE                                ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  if (imageResult.storage_type === 'ipfs') {
    console.log('🎊 Your Storacha integration is WORKING!')
    console.log('   Check console.storacha.network to see your uploads\n')
  }
}

testCLIUpload().catch(err => {
  console.error('\n❌ Test Failed:', err.message)
  process.exit(1)
})

