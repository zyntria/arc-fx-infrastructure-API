# Storacha Integration - Quick Start

## 🚀 30-Second Setup

```bash
# 1. Ensure Storacha credentials are in .env
cat >> .env << 'EOF'
OPENAI_API_KEY=sk-proj-...
STORACHA_PRIVATE_KEY=MgCZT5J...
STORACHA_PROOF=uEiCBwKPqjD...
EOF

# 2. Start the server
npm run dev

# 3. Test storage directly
npx tsx << 'TEST'
import { getStorageStatus } from './src/services/storage.js';
const status = await getStorageStatus();
console.log('✅ Storacha Status:', status.working ? 'Ready' : 'Fallback');
TEST
```

## 📋 Quick Reference

### Generate NFT Certificate Image
```typescript
import { uploadImageToIPFS } from './src/services/storage.js';
import { generateCertificateImage } from './src/services/nft-image.js';

// 1. Generate image with OpenAI
const image = await generateCertificateImage({
  context: 'bond_certificate',
  style: 'institutional',
  bond_id: 'bond_123',
  fields: { title: 'Bond', principal_label: '1000 USDC', ... }
});

// 2. Upload to IPFS
const result = await uploadImageToIPFS({
  bondId: 'bond_123',
  buffer: Buffer.from(image.image_base64, 'base64'),
  filename: 'bond_123_certificate.png'
});

// 3. Get IPFS URLs
console.log(result.ipfs_url);        // ipfs://Qm...
console.log(result.gateway_url);     // https://w3s.link/ipfs/Qm...
```

### Available Certificate Styles
```
- institutional  → Premium corporate design
- fintech        → Futuristic digital design  
- ghibli         → Studio Ghibli inspired
```

### Available Certificate Fields
```javascript
{
  title: "ARC Yield — Bond Certificate",
  series_label: "Q4 2025",
  principal_label: "1000 USDC",
  coupon_label: "5%",
  tenor_label: "90 Days",
  issuer_display_name: "SampleCorp Ltd.",
  transferability: "Soulbound",
  issue_date: "2025-11-15",        // optional
  maturity_date: "2026-02-13"      // optional
}
```

## 🔍 Check Status

```bash
# Verify Storacha is working
curl http://localhost:4000/v1/media/nft-image/status | jq '.storage'

# Expected output if working:
# {
#   "configured": true,
#   "provider": "Storacha (Web3.Storage)",
#   "working": true
# }
```

## ⚙️ Configuration

```env
# Required
OPENAI_API_KEY=your-openai-api-key
STORACHA_PRIVATE_KEY=your-storacha-private-key
STORACHA_PROOF=your-storacha-delegation-proof

# Automatic fallback if not set
# (uses mock storage for testing)
```

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| `space not found` | Run `storacha login email@example.com` |
| `STORACHA_PROOF invalid` | Regenerate with `storacha delegation create <did> --base64` |
| `Mock storage active` | Storacha unavailable - check credentials |
| `OpenAI error` | Verify `OPENAI_API_KEY` is set |

## 📊 Response Format

### Success (Real IPFS)
```json
{
  "image_cid": "bafybei...",
  "image_url": "ipfs://bafybei...",
  "gateway_url": "https://w3s.link/ipfs/bafybei...",
  "storage_type": "ipfs"
}
```

### Fallback (Mock Storage)
```json
{
  "image_cid": "bafybei...",
  "image_url": "ipfs://bafybei...",
  "gateway_url": "https://w3s.link/ipfs/bafybei...",
  "storage_type": "mock"
}
```

## 🔗 Important Files

- **Storage Service**: `src/services/storage.ts`
- **Image Generator**: `src/services/nft-image.ts`
- **API Routes**: `src/routes/media.ts`
- **Config**: `.env` file
- **Docs**: `markdown_files/TEST_STORACHA.md`

## ✅ Verification Checklist

- [ ] `OPENAI_API_KEY` set in `.env`
- [ ] `STORACHA_PRIVATE_KEY` set in `.env`
- [ ] `STORACHA_PROOF` set in `.env`
- [ ] Server running: `npm run dev`
- [ ] Status check returns `configured: true`
- [ ] Can upload image: returns real/mock CID

## 🚀 Next: Integration

Once verified, integrate with bond endpoints:

```typescript
// In /v1/yield/bonds/{bond_id}/nft-generate
const { uploadImageToIPFS } = await import('./services/storage.js');
const imageResult = await uploadImageToIPFS({
  bondId: bond_id,
  buffer: imageBuffer,
  filename: `${bond_id}.png`
});
// Save imageResult.ipfs_url to database
```

---

**Version**: 1.0
**Last Updated**: Nov 15, 2025
