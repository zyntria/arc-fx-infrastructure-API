# 🎨 NFT Certificate Image Generation System

## Overview

Complete implementation of AI-generated bond certificate NFT images using **OpenAI GPT Image** (gpt-image-1 model). This system powers the visual certificates for ARC-Yield bonds and can be extended for other NFT use cases.

---

## ✅ Verification: OpenAI Image API Implementation

The code has been **verified against official OpenAI documentation** ([platform.openai.com/docs/guides/images](https://platform.openai.com/docs/guides/images)):

### Correct Implementation

```typescript
const result = await openai.images.generate({
  model: "gpt-image-1",  // ✅ Correct model name
  prompt,                 // ✅ Correct parameter
  size: "1024x1024",      // ✅ Optional (defaults to 1024x1024)
  quality: "high",        // ✅ Optional (low, medium, high, auto)
  background: "opaque",   // ✅ Optional (transparent, opaque, auto)
  n: 1,                   // ✅ Number of images
});

const imageBase64 = result.data[0].b64_json;  // ✅ Correct data access
```

**All parameters match OpenAI's official API specification!** 🎯

---

## Architecture

### Services

1. **`nft-image.ts`** - Core image generation service
   - OpenAI API integration
   - Prompt building for different styles
   - Cost estimation

2. **`storage.ts`** - Image upload service
   - IPFS uploads (mock/real)
   - S3/CDN uploads
   - Thumbnail generation

3. **`nft.ts`** - NFT minting service (existing)
   - On-chain certificate minting
   - Metadata management

### API Endpoints

#### **1. POST `/v1/media/nft-image`**
Generate NFT certificate image using ChatGPT.

**Request:**
```json
{
  "context": "bond_certificate",
  "style": "institutional",
  "bond_id": "bond_93f2a1",
  "fields": {
    "title": "ARC Yield — Bond Certificate",
    "series_label": "Q4 2025",
    "principal_label": "1000 USDC",
    "coupon_label": "5%",
    "tenor_label": "90 Days",
    "issuer_display_name": "SampleCorp Ltd.",
    "transferability": "Soulbound"
  },
  "size": "1024x1024",
  "quality": "high",
  "regenerate": false
}
```

**Response:**
```json
{
  "image_id": "img_7fd3c1",
  "bond_id": "bond_93f2a1",
  "style": "institutional",
  "prompt_used": "Create a high-resolution institutional-grade...",
  "image_url": "ipfs://Qm.../bond_93f2a1.png",
  "thumbnail_url": "https://cdn.arcfx.app/nft/bond_93f2a1_thumb.png",
  "image_base64": "iVBORw0KGgoAAAANS...",
  "status": "completed",
  "generated_at": "2025-11-15T11:02:33Z"
}
```

#### **2. GET `/v1/media/nft-image/status`**
Check if image generation is available.

**Response:**
```json
{
  "enabled": true,
  "message": "Image generation is available"
}
```

#### **3. POST `/v1/media/nft-image/estimate`**
Estimate cost for image generation.

**Request:**
```json
{
  "size": "1024x1024",
  "quality": "high"
}
```

**Response:**
```json
{
  "size": "1024x1024",
  "quality": "high",
  "tokens": 4160,
  "estimated_cost": "$0.0416",
  "note": "Actual cost may vary based on prompt complexity"
}
```

#### **4. GET `/v1/media/styles`**
Get available certificate styles.

**Response:**
```json
{
  "styles": [
    {
      "id": "institutional",
      "name": "Institutional",
      "description": "Premium corporate with deep navy and gold/silver accents...",
      "best_for": ["Traditional finance", "Institutional investors"]
    },
    {
      "id": "fintech",
      "name": "Fintech/DeFi",
      "description": "Futuristic digital design with neon accents...",
      "best_for": ["Web3/Crypto", "DeFi protocols"]
    },
    {
      "id": "ghibli",
      "name": "Studio Ghibli",
      "description": "Artistic illustrated style with watercolor textures...",
      "best_for": ["Creative projects", "Unique collectibles"]
    }
  ]
}
```

---

## Certificate Styles

### 1. **Institutional** 🏛️
- **Visual:** Deep navy (#1a2332) with gold/silver accents
- **Features:** Ornamental borders, guilloche patterns, serif fonts
- **Feel:** Traditional stock certificate / sovereign bond
- **Best for:** Banks, institutional investors, high-value bonds

### 2. **Fintech/DeFi** ⚡
- **Visual:** Dark mode (#0a0e1a) with neon teal (#00e5cc) and electric blue
- **Features:** Circuit patterns, holographic effects, QR codes
- **Feel:** Web3, futuristic, digitally native
- **Best for:** Crypto projects, DeFi protocols, tech investors

### 3. **Studio Ghibli** 🌸
- **Visual:** Warm earthy colors, watercolor textures, hand-painted aesthetic
- **Features:** Nature motifs, floating petals, soft gradients
- **Feel:** Enchanting, artistic, nostalgic yet professional
- **Best for:** Creative projects, collector bonds, artistic ventures

---

## Setup

### 1. Install Dependencies

```bash
npm install openai
# or
pnpm add openai
```

### 2. Configure Environment Variables

Add to `.env`:

```bash
# Required
OPENAI_API_KEY=sk-proj-your-key-here

# Optional: Storage
IPFS_API_URL=https://ipfs.infura.io:5001
AWS_S3_BUCKET=arc-nft-images
AWS_REGION=us-east-1

# Optional: NFT Contract
BOND_NFT_CONTRACT=0x...
PRIVATE_KEY=0x...
```

### 3. API Organization Verification

⚠️ **Important:** To use `gpt-image-1`, you may need to complete [API Organization Verification](https://help.openai.com/en/articles/10910291-api-organization-verification) from your [developer console](https://platform.openai.com/settings/organization/general).

---

## Usage Examples

### Generate Institutional Certificate

```bash
curl -X POST http://localhost:4000/v1/media/nft-image \
  -H "Content-Type: application/json" \
  -d '{
    "context": "bond_certificate",
    "style": "institutional",
    "bond_id": "bond_001",
    "fields": {
      "title": "ARC Yield — Bond Certificate",
      "series_label": "Series A 2025",
      "principal_label": "10,000 USDC",
      "coupon_label": "6.5%",
      "tenor_label": "180 Days",
      "issuer_display_name": "Acme Corp",
      "transferability": "Restricted"
    },
    "quality": "high"
  }'
```

### Generate DeFi-Style Certificate

```bash
curl -X POST http://localhost:4000/v1/media/nft-image \
  -H "Content-Type: application/json" \
  -d '{
    "context": "bond_certificate",
    "style": "fintech",
    "bond_id": "bond_defi_001",
    "fields": {
      "title": "DeFi Yield Bond",
      "series_label": "Liquidity Mining Q4",
      "principal_label": "5,000 USDC",
      "coupon_label": "12% APY",
      "tenor_label": "90 Days",
      "issuer_display_name": "YieldProtocol DAO",
      "transferability": "Freely Transferable"
    },
    "quality": "high"
  }'
```

### Check Status

```bash
curl http://localhost:4000/v1/media/nft-image/status
```

---

## Cost Estimation

Based on OpenAI pricing:

| Size | Quality | Tokens | Est. Cost |
|------|---------|--------|-----------|
| 1024×1024 (square) | low | 272 | ~$0.003 |
| 1024×1024 (square) | medium | 1,056 | ~$0.011 |
| 1024×1024 (square) | **high** | 4,160 | **~$0.042** |
| 1024×1536 (portrait) | high | 6,240 | ~$0.062 |
| 1536×1024 (landscape) | high | 6,208 | ~$0.062 |

*Prices approximate at $0.01 per 1000 tokens. Check [OpenAI pricing](https://openai.com/api/pricing/) for current rates.*

---

## Integration with Yield Routes

The media endpoints are designed to be called from your yield/bond endpoints:

### Flow:

1. **Issuer creates bond template**
   ```
   POST /v1/yield/bonds/{bond_id}/nft-template
   ```
   - Chooses style (institutional/fintech/ghibli)
   - Sets certificate fields

2. **Generate certificate image**
   ```
   POST /v1/media/nft-image
   ```
   - Calls OpenAI API
   - Returns image_url and base64

3. **Investor subscribes to bond**
   ```
   POST /v1/yield/bonds/{bond_id}/subscribe
   ```
   - Mints NFT on-chain
   - Uses generated image_url in metadata

4. **View certificate**
   ```
   GET /v1/nft/bonds/{bond_id}/metadata.json
   ```
   - Returns NFT metadata
   - Image displays in wallets/ARCScan

---

## Advanced Features

### Streaming (Future)
OpenAI supports streaming partial images for better UX:

```typescript
const stream = await openai.images.generate({
  model: "gpt-image-1",
  prompt,
  stream: true,
  partial_images: 2, // Show 2 partial images before final
});

for await (const event of stream) {
  if (event.type === "image_generation.partial_image") {
    // Show progress to user
  }
}
```

### Transparency Support
For logos or sprites:

```typescript
{
  background: "transparent",
  quality: "high"
}
```

### High Input Fidelity
Preserve faces/logos from input images:

```typescript
{
  input_fidelity: "high"
}
```

---

## Files Created

```
ARC-FX-Infrastructure-API/
├── src/
│   ├── services/
│   │   ├── nft-image.ts        ✅ OpenAI image generation
│   │   ├── storage.ts          ✅ IPFS/S3 uploads
│   │   └── nft.ts              ✅ NFT minting (existing)
│   └── routes/
│       ├── media.ts            ✅ Media API endpoints
│       └── index.ts            ✅ Updated with media routes
└── env.example                 ✅ Updated with OPENAI_API_KEY
```

---

## Testing

### 1. Check if service is available
```bash
curl http://localhost:4000/v1/media/nft-image/status
```

### 2. Get available styles
```bash
curl http://localhost:4000/v1/media/styles
```

### 3. Generate a certificate
```bash
curl -X POST http://localhost:4000/v1/media/nft-image \
  -H "Content-Type: application/json" \
  -d @test-certificate.json
```

---

## Next Steps

1. ✅ **OpenAI API Integration** - Complete!
2. ✅ **Three Certificate Styles** - Complete!
3. ✅ **Storage Service** - Complete!
4. ✅ **API Endpoints** - Complete!
5. 🔄 **Database Schema** - Add table for storing generated images
6. 🔄 **IPFS Upload** - Implement real IPFS client
7. 🔄 **Yield Route Integration** - Wire up to bond subscription flow
8. 🔄 **UI Integration** - Add certificate preview to frontend

---

## References

- [OpenAI Images API Docs](https://platform.openai.com/docs/guides/images)
- [GPT Image Model](https://platform.openai.com/docs/models#gpt-image)
- [OpenAI API Pricing](https://openai.com/api/pricing/)
- [Circle IPFS Guide](https://developers.circle.com/w3s/docs/ipfs)

---

Built with ❤️ by the ARC-FX team

