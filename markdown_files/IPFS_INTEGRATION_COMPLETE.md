# 🚀 Complete IPFS + NFT Certificate System

## ✅ Full Implementation Complete!

You now have a **production-ready** NFT certificate system with **real IPFS storage** via NFT.Storage!

---

## 🎯 What's Been Built

### **1. NFT.Storage Integration** ✅
- Real IPFS uploads using NFT.Storage SDK
- Automatic fallback to mock storage if API key not configured
- Support for both images and metadata JSON

### **2. OpenAI GPT Image Generation** ✅
- ChatGPT-powered certificate creation
- 3 styles: Institutional, Fintech, Studio Ghibli
- Verified against official OpenAI docs

### **3. Complete API Stack** ✅
- Image generation endpoint
- IPFS storage service
- NFT metadata endpoint (for tokenURI)
- Status and health checks

---

## 📦 Installation

### 1. Install Dependencies

```bash
cd ARC-FX-Infrastructure-API
npm install
# or
pnpm install
```

New dependencies added:
- ✅ `openai@^4.77.0` - OpenAI SDK
- ✅ `nft.storage@^7.1.1` - NFT.Storage/IPFS client

### 2. Get API Keys

#### **OpenAI API Key**
1. Go to [platform.openai.com](https://platform.openai.com/api-keys)
2. Create new secret key
3. Copy `sk-proj-...`

#### **NFT.Storage API Key** (FREE!)
1. Go to [nft.storage](https://nft.storage)
2. Sign up (free)
3. Create new API key
4. Copy the token (`eyJhbGc...`)

### 3. Configure Environment

```bash
# Copy example
cp env.example .env

# Edit .env
nano .env
```

**Required:**
```bash
OPENAI_API_KEY=sk-proj-your-key-here
NFT_STORAGE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Optional (for NFT minting):**
```bash
BOND_NFT_CONTRACT=0x...
PRIVATE_KEY=0x...
```

---

## 🧪 Testing the System

### Step 1: Check Status

```bash
curl http://localhost:4000/v1/media/nft-image/status
```

**Expected Response:**
```json
{
  "image_generation": {
    "enabled": true,
    "message": "OpenAI image generation is available"
  },
  "storage": {
    "configured": true,
    "provider": "NFT.Storage",
    "message": "IPFS storage is configured and ready"
  },
  "overall_status": "ready"
}
```

### Step 2: Generate a Certificate

```bash
curl -X POST http://localhost:4000/v1/media/nft-image \
  -H "Content-Type: application/json" \
  -d '{
    "context": "bond_certificate",
    "style": "institutional",
    "bond_id": "bond_test_001",
    "fields": {
      "title": "ARC Yield — Bond Certificate",
      "series_label": "Hackathon Demo 2025",
      "principal_label": "1,000 USDC",
      "coupon_label": "6.5%",
      "tenor_label": "90 Days",
      "issuer_display_name": "YourCompany Ltd.",
      "transferability": "Soulbound"
    },
    "quality": "high"
  }'
```

**Response:**
```json
{
  "image_id": "img_7fd3c1a2...",
  "bond_id": "bond_test_001",
  "style": "institutional",
  "prompt_used": "Create a high-resolution institutional-grade...",
  "image_cid": "bafybeihkq3...",
  "image_url": "ipfs://bafybeihkq3...",
  "gateway_url": "https://nftstorage.link/ipfs/bafybeihkq3...",
  "thumbnail_url": "https://nftstorage.link/ipfs/bafybeihkq3...",
  "storage_type": "ipfs",
  "status": "completed",
  "generated_at": "2025-11-15T12:34:56Z"
}
```

### Step 3: View Your Image!

Open the `gateway_url` in your browser:
```
https://nftstorage.link/ipfs/bafybeihkq3...
```

You should see your beautiful AI-generated certificate! 🎨

### Step 4: Test Metadata Endpoint

```bash
curl http://localhost:4000/v1/nft/bonds/bond_test_001/metadata.json
```

**Response:**
```json
{
  "name": "ARC Yield Bond — Series Q4 2025",
  "description": "A 90-day ARC-Yield bond paying 5% coupon...",
  "image": "ipfs://bafybeihkq3...",
  "external_url": "https://app.arcfx.finance/bonds/bond_test_001",
  "attributes": [
    { "trait_type": "Series", "value": "Q4 2025" },
    { "trait_type": "Principal", "value": "1000 USDC" },
    ...
  ]
}
```

---

## 🏗️ Architecture

### Complete Flow

```
1. Issuer creates bond
   ↓
2. Configure NFT template (style + fields)
   ↓
3. Generate image via OpenAI
   POST /v1/media/nft-image
   ↓
4. Upload image to IPFS (NFT.Storage)
   → Returns: ipfs://CID
   ↓
5. Investor subscribes to bond
   → Mints NFT on-chain
   ↓
6. NFT contract's tokenURI points to:
   https://YOUR_API_URL/v1/nft/bonds/{bond_id}/metadata.json
   ↓
7. Wallets/Explorers fetch metadata
   → Display IPFS image
```

### File Structure

```
ARC-FX-Infrastructure-API/
├── src/
│   ├── services/
│   │   ├── nft-image.ts      ✅ OpenAI integration
│   │   ├── storage.ts         ✅ NFT.Storage/IPFS
│   │   └── nft.ts             ✅ NFT minting (existing)
│   └── routes/
│       ├── media.ts           ✅ Image generation API
│       ├── nft.ts             ✅ Metadata endpoints
│       └── index.ts           ✅ Route registration
├── package.json               ✅ Updated with dependencies
└── env.example                ✅ Updated with API keys
```

---

## 🌐 URL Setup for NFT Contract

### Option A: Railway URL (Fastest for Hackathon) ⚡

Use your Railway URL directly:

**In your NFT contract:**
```solidity
string public apiBase = "https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft/bonds/";
```

**tokenURI returns:**
```
https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft/bonds/123/metadata.json
```

✅ **Works immediately**  
✅ **No DNS setup needed**  
✅ **Perfect for hackathon/demo**

### Option B: Custom Domain (Production) 🎯

Point `api.arcfx.finance` to your Railway app:

1. **Add CNAME record:**
   ```
   api.arcfx.finance → arc-fx-infrastructure-api-production-31b7.up.railway.app
   ```

2. **Configure Railway:**
   - Add custom domain in Railway dashboard
   - Railway will provision SSL certificate

3. **Update NFT contract:**
   ```solidity
   string public apiBase = "https://api.arcfx.finance/v1/nft/bonds/";
   ```

4. **Add setApiBase function (optional):**
   ```solidity
   function setApiBase(string calldata _apiBase) external onlyOwner {
       apiBase = _apiBase;
   }
   ```
   This lets you update URL without redeploying!

---

## 📊 Cost Breakdown

### OpenAI GPT Image Costs

| Quality | Size | Tokens | Cost per Image |
|---------|------|--------|----------------|
| Low | 1024×1024 | 272 | ~$0.003 |
| Medium | 1024×1024 | 1,056 | ~$0.011 |
| **High** | 1024×1024 | **4,160** | **~$0.042** |
| High | 1024×1536 | 6,240 | ~$0.062 |

**Recommendation:** Use `high` quality for certificates ($0.04 each)

### NFT.Storage / IPFS Costs

| Service | Storage | Cost |
|---------|---------|------|
| NFT.Storage | Unlimited | **FREE** 🎉 |
| IPFS Pinning | Included | **FREE** 🎉 |
| Bandwidth | Unlimited | **FREE** 🎉 |

**Total cost per certificate:** ~$0.04 (just OpenAI)

---

## 🎨 Certificate Styles

### 1. Institutional 🏛️
```json
{
  "style": "institutional"
}
```
- Deep navy blue (#1a2332) + gold/silver
- Ornamental borders, guilloche patterns
- Serif fonts, traditional stock certificate aesthetic
- **Best for:** Banks, institutional investors, high-value bonds

### 2. Fintech/DeFi ⚡
```json
{
  "style": "fintech"
}
```
- Dark mode (#0a0e1a) + neon teal/electric blue
- Circuit patterns, holographic effects
- San-serif fonts, QR codes
- **Best for:** Crypto projects, DeFi protocols, tech investors

### 3. Studio Ghibli 🌸
```json
{
  "style": "ghibli"
}
```
- Warm colors, watercolor textures
- Nature motifs, hand-painted aesthetic
- Artistic script fonts, whimsical details
- **Best for:** Creative projects, collector bonds, artistic ventures

---

## 🔗 API Endpoints Reference

### Image Generation

#### **POST /v1/media/nft-image**
Generate certificate image with OpenAI + upload to IPFS.

**Request:**
```json
{
  "context": "bond_certificate",
  "style": "institutional" | "fintech" | "ghibli",
  "bond_id": "bond_001",
  "fields": {
    "title": "ARC Yield — Bond Certificate",
    "series_label": "Q4 2025",
    "principal_label": "1000 USDC",
    "coupon_label": "5%",
    "tenor_label": "90 Days",
    "issuer_display_name": "Company Ltd.",
    "transferability": "Soulbound"
  },
  "quality": "high",
  "size": "1024x1024"
}
```

**Response:**
```json
{
  "image_id": "img_...",
  "bond_id": "bond_001",
  "image_cid": "bafybei...",
  "image_url": "ipfs://bafybei...",
  "gateway_url": "https://nftstorage.link/ipfs/bafybei...",
  "storage_type": "ipfs",
  "status": "completed"
}
```

#### **GET /v1/media/nft-image/status**
Check if image generation and IPFS are configured.

#### **POST /v1/media/nft-image/estimate**
Estimate cost for image generation.

#### **GET /v1/media/styles**
List available certificate styles.

### NFT Metadata

#### **GET /v1/nft/bonds/{bond_id}/metadata.json** 🎯
NFT metadata endpoint for tokenURI.

**Response:**
```json
{
  "name": "ARC Yield Bond — Series Q4 2025",
  "description": "A 90-day ARC-Yield bond...",
  "image": "ipfs://bafybei...",
  "external_url": "https://app.arcfx.finance/bonds/bond_001",
  "attributes": [...]
}
```

#### **GET /v1/nft/tokens/{token_id}/metadata.json**
Alternative endpoint using token_id.

#### **GET /v1/nft/bonds/{bond_id}/image**
Direct image redirect to IPFS gateway.

---

## 🛠️ Next Steps

### For Hackathon (Immediate)

1. ✅ **Set up API keys** (OpenAI + NFT.Storage)
2. ✅ **Test image generation**
3. ✅ **Deploy to Railway** (if not already)
4. ✅ **Set `apiBase` in NFT contract** to Railway URL
5. ✅ **Mint a test NFT** and view in wallet!

### For Production (Later)

1. 🔄 **Add database** for storing image metadata
2. 🔄 **Custom domain** setup (api.arcfx.finance)
3. 🔄 **Implement caching** for metadata responses
4. 🔄 **Add image optimization** (thumbnails with sharp)
5. 🔄 **Monitoring** for IPFS availability

---

## 🚨 Troubleshooting

### "Image generation failed"
- ✅ Check `OPENAI_API_KEY` is set correctly
- ✅ Verify API key has credits
- ✅ Complete [Organization Verification](https://platform.openai.com/settings/organization/general) if required for gpt-image-1

### "Using mock storage"
- ✅ Set `NFT_STORAGE_API_KEY` in `.env`
- ✅ Get free API key from [nft.storage](https://nft.storage)
- ✅ Restart server after adding key

### "Metadata not loading"
- ✅ Check NFT contract `apiBase` matches your deployed URL
- ✅ Test endpoint directly in browser
- ✅ Check CORS settings if calling from frontend

### "IPFS image not loading"
- ✅ Try different gateway: `https://ipfs.io/ipfs/{CID}`
- ✅ IPFS can take 30-60 seconds for first pin
- ✅ Check `gateway_url` in API response

---

## 📚 References

- [OpenAI Images API](https://platform.openai.com/docs/guides/images)
- [NFT.Storage Docs](https://nft.storage/docs/)
- [NFT Metadata Standard](https://docs.opensea.io/docs/metadata-standards)
- [ERC-721 Specification](https://eips.ethereum.org/EIPS/eip-721)

---

## 🎉 Summary

You now have:
- ✅ **AI-generated certificates** with ChatGPT
- ✅ **Real IPFS storage** with NFT.Storage
- ✅ **Production-ready APIs** for NFT metadata
- ✅ **3 beautiful certificate styles**
- ✅ **Complete documentation**
- ✅ **Zero storage costs** (NFT.Storage is free!)

**Total setup time:** ~5 minutes  
**Cost per certificate:** ~$0.04  
**Coolness factor:** 🔥🔥🔥

---

Built with ❤️ for ARC-Yield by the ARC-FX team

