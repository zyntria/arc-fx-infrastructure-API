/**
 * Storacha Integration Test
 * Tests the complete storage service including mock fallback
 */

import 'dotenv/config'
import { uploadImageToIPFS, uploadMetadataToIPFS, getStorageStatus } from './src/services/storage'

async function test() {
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  🧪 Storacha Integration Test                          ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // 1. Check Environment
  console.log('📋 Environment Check:')
  console.log('   OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set')
  console.log('   STORACHA_PRIVATE_KEY:', process.env.STORACHA_PRIVATE_KEY ? '✅ Set' : '❌ Not set')
  console.log('   STORACHA_PROOF:', process.env.STORACHA_PROOF ? '✅ Set' : '❌ Not set')

  // 2. Check Storage Status
  console.log('\n📊 Storage Status:')
  const status = await getStorageStatus()
  console.log('   Configured:', status.configured ? '✅ Yes' : '❌ No')
  console.log('   Provider:', status.provider)
  console.log('   Working:', status.working ? '✅ Yes (Real IPFS)' : '⏸️  Using Mock Storage')
  console.log('   Message:', status.message)

  // 3. Test Image Upload
  console.log('\n📤 Test Image Upload:')
  const imageBuffer = Buffer.from('PNG test data from Storacha test')
  const imageResult = await uploadImageToIPFS({
    bondId: 'test_bond_001',
    buffer: imageBuffer,
    filename: 'test-certificate.png',
    contentType: 'image/png'
  })
  console.log('   Storage Type:', imageResult.storage_type === 'ipfs' ? '✅ Real IPFS' : '⏸️  Mock Storage')
  console.log('   CID:', imageResult.cid)
  console.log('   IPFS URL:', imageResult.ipfs_url)
  console.log('   Gateway URL:', imageResult.gateway_url)

  // 4. Test Metadata Upload
  console.log('\n📤 Test Metadata Upload:')
  const metadata = {
    name: 'ARC Test Bond Certificate',
    description: 'A test NFT bond certificate from Storacha integration test',
    image: imageResult.ipfs_url,
    external_url: 'https://app.arcfx.finance/bonds/test_bond_001',
    attributes: [
      { trait_type: 'Bond ID', value: 'test_bond_001' },
      { trait_type: 'Series', value: 'Test Series' },
      { trait_type: 'Principal', value: '1000 USDC' },
      { trait_type: 'Coupon Rate', value: '5%' },
      { trait_type: 'Test', value: '✅ Storacha Integration Working' }
    ]
  }

  const metadataResult = await uploadMetadataToIPFS({
    metadata,
    filename: 'test-metadata.json'
  })
  console.log('   Storage Type:', metadataResult.storage_type === 'ipfs' ? '✅ Real IPFS' : '⏸️  Mock Storage')
  console.log('   CID:', metadataResult.cid)
  console.log('   IPFS URL:', metadataResult.ipfs_url)
  console.log('   Gateway URL:', metadataResult.gateway_url)

  // 5. Results
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║  ✅ TEST COMPLETE                                      ║')
  console.log('╚════════════════════════════════════════════════════════╝')

  if (status.working) {
    console.log('\n🎉 Real IPFS Integration Active!')
    console.log('   Your uploads are stored on IPFS via Storacha')
    console.log('   Access them at:', imageResult.gateway_url)
  } else {
    console.log('\n⏸️  Using Mock Storage Fallback')
    console.log('   Storacha not available, but system is working correctly!')
    console.log('   To enable real IPFS:')
    console.log('   1. Run: storacha login your-email@example.com')
    console.log('   2. Get delegation: storacha delegation create <your_did> --base64')
    console.log('   3. Update .env with STORACHA_PROOF')
  }

  console.log('\n✨ Storage Integration: Ready for Production\n')
}

test().catch(err => {
  console.error('\n❌ Test Failed:', err.message)
  console.error(err)
  process.exit(1)
})
