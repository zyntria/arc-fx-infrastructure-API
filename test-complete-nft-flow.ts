/**
 * Complete NFT Certificate Generation Flow Test
 * Creates a bond and generates an actual certificate image using OpenAI
 */

import 'dotenv/config'
import { generateCertificateImage } from './src/services/nft-image'
import { uploadImageToIPFS, uploadMetadataToIPFS, getStorageStatus } from './src/services/storage'

// Mock bond data
const mockBond = {
  id: 'bond_arc_001',
  issuer: 'ARC Finance',
  series: 'Q4 2025',
  principal: '1000',
  currency: 'USDC',
  coupon: '5',
  tenor: '90',
  issueDate: '2025-11-15',
  maturityDate: '2026-02-13'
}

async function testCompleteFlow() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗')
  console.log('║  🎨 Complete NFT Certificate Generation Test              ║')
  console.log('╚═══════════════════════════════════════════════════════════╝\n')

  try {
    // Step 1: Check Storage Status
    console.log('📊 Step 1: Checking Storage Status...\n')
    const storageStatus = await getStorageStatus()
    console.log('   Provider:', storageStatus.provider)
    console.log('   Working:', storageStatus.working ? '✅ Real IPFS' : '⏸️  Mock Storage (fallback)')
    console.log('   Message:', storageStatus.message)

    // Step 2: Generate Certificate Image with OpenAI
    console.log('\n🎨 Step 2: Generating Certificate Image with OpenAI...')
    console.log('   Style: Institutional')
    console.log('   Context: Bond Certificate')
    console.log('   Bond ID:', mockBond.id)
    console.log('   ⏳ This may take 10-30 seconds...\n')

    const imageResult = await generateCertificateImage({
      context: 'bond_certificate',
      style: 'institutional',
      bond_id: mockBond.id,
      fields: {
        title: `${mockBond.issuer} — Bond Certificate`,
        series_label: mockBond.series,
        principal_label: `${mockBond.principal} ${mockBond.currency}`,
        coupon_label: `${mockBond.coupon}%`,
        tenor_label: `${mockBond.tenor} Days`,
        issuer_display_name: mockBond.issuer,
        transferability: 'Soulbound',
        issue_date: mockBond.issueDate,
        maturity_date: mockBond.maturityDate
      }
    })

    if (imageResult.status === 'failed') {
      console.log('   ❌ Image generation failed:', imageResult.error)
      return
    }

    console.log('   ✅ Image generated successfully!')
    console.log('   Image ID:', imageResult.image_id)
    console.log('   Size:', imageResult.image_base64.length, 'bytes')

    // Step 3: Upload Image to IPFS
    console.log('\n📤 Step 3: Uploading Image to IPFS via Storacha...')
    const imageBuffer = Buffer.from(imageResult.image_base64, 'base64')
    const ipfsImageResult = await uploadImageToIPFS({
      bondId: mockBond.id,
      buffer: imageBuffer,
      filename: `${mockBond.id}-certificate.png`,
      contentType: 'image/png'
    })

    console.log('   ✅ Image uploaded!')
    console.log('   Storage Type:', ipfsImageResult.storage_type)
    console.log('   CID:', ipfsImageResult.cid)
    console.log('   IPFS URL:', ipfsImageResult.ipfs_url)
    console.log('   Gateway URL:', ipfsImageResult.gateway_url)

    // Step 4: Create NFT Metadata
    console.log('\n📋 Step 4: Creating NFT Metadata...')
    const nftMetadata = {
      name: `${mockBond.issuer} Bond — ${mockBond.series}`,
      description: `A ${mockBond.tenor}-day ARC bond paying ${mockBond.coupon}% coupon, principal ${mockBond.principal} ${mockBond.currency}, settled on ARC Network. Soulbound certificate.`,
      image: ipfsImageResult.ipfs_url,
      external_url: `https://app.arcfx.finance/bonds/${mockBond.id}`,
      attributes: [
        {
          trait_type: 'Bond ID',
          value: mockBond.id
        },
        {
          trait_type: 'Series',
          value: mockBond.series
        },
        {
          trait_type: 'Principal',
          value: `${mockBond.principal} ${mockBond.currency}`
        },
        {
          trait_type: 'Currency',
          value: mockBond.currency
        },
        {
          trait_type: 'Coupon Rate',
          value: `${mockBond.coupon}%`
        },
        {
          trait_type: 'Tenor',
          value: `${mockBond.tenor} Days`
        },
        {
          trait_type: 'Issuer',
          value: mockBond.issuer
        },
        {
          trait_type: 'Transferability',
          value: 'Soulbound'
        },
        {
          trait_type: 'Issue Date',
          value: mockBond.issueDate,
          display_type: 'date'
        },
        {
          trait_type: 'Maturity Date',
          value: mockBond.maturityDate,
          display_type: 'date'
        },
        {
          trait_type: 'Network',
          value: 'ARC Testnet'
        }
      ]
    }

    console.log('   ✅ Metadata created')
    console.log('   Name:', nftMetadata.name)
    console.log('   Attributes:', nftMetadata.attributes.length)

    // Step 5: Upload Metadata to IPFS
    console.log('\n📤 Step 5: Uploading Metadata to IPFS...')
    const ipfsMetadataResult = await uploadMetadataToIPFS({
      metadata: nftMetadata,
      filename: `${mockBond.id}-metadata.json`
    })

    console.log('   ✅ Metadata uploaded!')
    console.log('   Storage Type:', ipfsMetadataResult.storage_type)
    console.log('   CID:', ipfsMetadataResult.cid)
    console.log('   IPFS URL:', ipfsMetadataResult.ipfs_url)
    console.log('   Gateway URL:', ipfsMetadataResult.gateway_url)

    // Step 6: Display Results
    console.log('\n╔═══════════════════════════════════════════════════════════╗')
    console.log('║  ✅ COMPLETE FLOW SUCCESS!                               ║')
    console.log('╚═══════════════════════════════════════════════════════════╝')

    console.log('\n📦 NFT Certificate Package:\n')
    console.log('   Bond ID:', mockBond.id)
    console.log('   Issuer:', mockBond.issuer)
    console.log('   Series:', mockBond.series)
    console.log('   Principal:', `${mockBond.principal} ${mockBond.currency}`)
    console.log('   Coupon:', `${mockBond.coupon}%`)
    console.log('   Tenor:', `${mockBond.tenor} Days`)

    console.log('\n🖼️  Certificate Image:\n')
    console.log('   CID:', ipfsImageResult.cid)
    console.log('   IPFS:', ipfsImageResult.ipfs_url)
    console.log('   View:', ipfsImageResult.gateway_url)

    console.log('\n📋 NFT Metadata:\n')
    console.log('   CID:', ipfsMetadataResult.cid)
    console.log('   IPFS:', ipfsMetadataResult.ipfs_url)
    console.log('   View:', ipfsMetadataResult.gateway_url)

    console.log('\n🔗 For Smart Contract:\n')
    console.log('   tokenURI should return:', ipfsMetadataResult.ipfs_url)
    console.log('   or:', ipfsMetadataResult.gateway_url)

    console.log('\n💾 Database Storage:\n')
    console.log(`   INSERT INTO bond_nft_images VALUES (`)
    console.log(`     '${mockBond.id}',`)
    console.log(`     'institutional',`)
    console.log(`     '${ipfsImageResult.cid}',`)
    console.log(`     '${ipfsImageResult.ipfs_url}',`)
    console.log(`     NOW()`)
    console.log(`   );\n`)

    console.log(`   INSERT INTO bond_nft_metadata VALUES (`)
    console.log(`     '${mockBond.id}',`)
    console.log(`     '${ipfsMetadataResult.cid}',`)
    console.log(`     '${ipfsMetadataResult.ipfs_url}',`)
    console.log(`     NOW()`)
    console.log(`   );\n`)

    console.log('✨ Ready for NFT Minting!\n')

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

testCompleteFlow()

