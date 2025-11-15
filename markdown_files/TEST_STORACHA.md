# Testing Storacha Integration

## ✅ Prerequisites

Make sure you have:
1. **OPENAI_API_KEY** - Set in `.env` file
2. **STORACHA_PRIVATE_KEY** - From `storacha key create`
3. **STORACHA_PROOF** - From `storacha delegation create <your_did> --base64`

## 🚀 Quick Test with Node Script

Since the media routes are being registered but not responding (likely due to a Fastify prefix issue), let's test the Storacha integration directly:

### 1. Create a test file

```bash
cat > /tmp/test-storacha.js << 'EOF'
const path = require('path');
require('dotenv').config({ path: '/Users/iamreechi/Downloads/arcpay-demo-starter/ARC-FX-Infrastructure-API/.env' });

async function test() {
  // Import the storage module
  const { uploadImageToIPFS, uploadMetadataToIPFS, getStorageStatus } = await import('/Users/iamreechi/Downloads/arcpay-demo-starter/ARC-FX-Infrastructure-API/src/services/storage.ts');
  
  console.log('\n🔍 Checking Storacha Configuration...\n');
  const status = await getStorageStatus();
  console.log('Storage Status:', JSON.stringify(status, null, 2));
  
  // Test with a simple image buffer
  console.log('\n⏳ Uploading test image to IPFS...\n');
  const testBuffer = Buffer.from('PNG test data');
  const result = await uploadImageToIPFS({
    bondId: 'test_bond_001',
    buffer: testBuffer,
    filename: 'test-image.png'
  });
  console.log('Upload Result:', JSON.stringify(result, null, 2));
  
  // Test metadata upload
  console.log('\n⏳ Uploading test metadata to IPFS...\n');
  const metadata = {
    name: 'Test Bond Certificate',
    description: 'A test NFT bond certificate',
    image: result.ipfs_url,
    attributes: [
      { trait_type: 'Test', value: 'Success' }
    ]
  };
  const metadataResult = await uploadMetadataToIPFS({
    metadata,
    filename: 'test-metadata.json'
  });
  console.log('Metadata Upload Result:', JSON.stringify(metadataResult, null, 2));
}

test().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
EOF
```

### 2. Run the test

```bash
cd /Users/iamreechi/Downloads/arcpay-demo-starter/ARC-FX-Infrastructure-API && npx tsx /tmp/test-storacha.js
```

## 📋 Expected Output

**If Storacha is properly configured:**
```json
{
  "configured": true,
  "provider": "Storacha (Web3.Storage)",
  "message": "IPFS storage is configured and ready",
  "space_did": "did:key:z6MkiQGSTCU1Ctm8AEqfv32U8E7dUspwe48ncSyBJaa6i19E",
  "working": true
}
```

**Upload Result with real IPFS:**
```json
{
  "cid": "bafybeihash123...",
  "ipfs_url": "ipfs://bafybeihash123...",
  "gateway_url": "https://w3s.link/ipfs/bafybeihash123...",
  "storage_type": "ipfs"
}
```

**If Storacha is not configured (mock mode):**
```json
{
  "cid": "bafybei...",
  "ipfs_url": "ipfs://bafybei...",
  "gateway_url": "https://w3s.link/ipfs/bafybei...",
  "storage_type": "mock"
}
```

## 🔧 Troubleshooting Storacha

###  Check Storacha CLI Access

```bash
# List available spaces
storacha space ls

# Check current space
storacha space show

# Verify delegation
storacha delegation ls
```

### Verify Environment Variables

```bash
echo "Private Key set: $([ -z $STORACHA_PRIVATE_KEY ] && echo 'NO ❌' || echo 'YES ✅')"
echo "Proof set: $([ -z $STORACHA_PROOF ] && echo 'NO ❌' || echo 'YES ✅')"
```

### Test with Storacha CLI directly

```bash
# Create a test file
echo "test" > /tmp/test.txt

# Upload with storacha CLI
storacha upload /tmp/test.txt

# You should get back a CID
```

## 🔍 Understanding Storage Fallback

The system has automatic fallback behavior:

1. **Storacha Available** → Uploads to real IPFS via Storacha
   - `storage_type: "ipfs"`
   - Real CIDs from IPFS network
   
2. **Storacha Unavailable** → Uses mock storage
   - `storage_type: "mock"`
   - Deterministic "CIDs" for testing
   - Allows full flow testing without Storacha

## 🌐 Accessing IPFS Content

Once you have a gateway URL, you can access it:

```bash
# Open in browser
open "https://w3s.link/ipfs/bafybeihash..."

# Or download with curl
curl -o output.png "https://w3s.link/ipfs/bafybeihash..."
```

## 📊 Testing Without Storacha

Even without Storacha configured, you can:
1. ✅ Test the full NFT image generation flow
2. ✅ Verify OpenAI integration works
3. ✅ Get mock IPFS CIDs for testing contracts
4. ✅ Validate data structures

Just set `storage_type` to `"mock"` in responses.

##  Next Steps

After verifying Storacha works:

### 1. Test Full Image Generation Flow

Once the media routes are working on the API:

```bash
curl -X POST http://localhost:4000/v1/media/nft-image \
  -H "Content-Type: application/json" \
  -d '{
    "context": "bond_certificate",
    "style": "institutional",
    "bond_id": "bond_test_001",
    "fields": {
      "title": "ARC Yield Bond",
      "series_label": "Q4 2025",
      "principal_label": "1000 USDC",
      "coupon_label": "5%",
      "tenor_label": "90 Days",
      "issuer_display_name": "TestCorp",
      "transferability": "Soulbound"
    }
  }'
```

### 2. Integrate with Bond NFT Endpoints

- `POST /v1/yield/bonds/{bond_id}/nft-generate` → Uses the media service
- `GET /v1/nft/bonds/{bond_id}/metadata.json` → Returns NFT metadata

### 3. Deploy to Production

- Create production Storacha space
- Update `STORACHA_PROOF` with production delegation
- Deploy contracts with production image URLs

---

## 📚 References

- [Storacha Documentation](https://docs.storacha.network/)
- [OpenAI Image API](https://platform.openai.com/docs/guides/images)
- [IPFS Specifications](https://ipfs.io/)
- [Web3.Storage](https://web3.storage/)
