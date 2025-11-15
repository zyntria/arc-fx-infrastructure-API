# 🎯 Storacha (Web3.Storage) Setup Guide

## ✅ You're using Storacha - Perfect choice!

Your Space DID: `did:key:z6MkiQGSTCU1Ctm8AEqfv32U8E7dUspwe48ncSyBJaa6i19E`

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Storacha CLI

```bash
npm install -g @storacha/cli
```

### Step 2: Generate Agent Key & Delegation

From your terminal (where you have Storacha CLI configured):

```bash
# 1. Create a new agent key for your backend
storacha key create

# Output example:
# did:key:z6MkrZ1r...Xyz123
# MgCZT5J...your-private-key

# ❗ IMPORTANT: Copy the private key (starting with "MgCZT5...")
# Store it as STORACHA_PRIVATE_KEY in your .env
```

```bash
# 2. Make sure you're using your Space
storacha space use did:key:z6MkiQGSTCU1Ctm8AEqfv32U8E7dUspwe48ncSyBJaa6i19E

# 3. Create delegation for your backend agent
# Replace <DID_FROM_STEP_1> with the did:key you got above
storacha delegation create <DID_FROM_STEP_1> \
  --can space/blob/add \
  --can space/index/add \
  --can filecoin/offer \
  --can upload/add \
  --base64

# Output: long base64 string starting with "uEiCBw..."
# ❗ IMPORTANT: Copy this entire output
# Store it as STORACHA_PROOF in your .env
```

### Step 3: Configure Environment Variables

Add to your `.env`:

```bash
# Backend agent private key
STORACHA_PRIVATE_KEY=MgCZT5J...your-full-private-key

# Delegation proof (base64)
STORACHA_PROOF=uEiCBwKPqjD...your-full-proof-base64
```

### Step 4: Test It!

```bash
cd ARC-FX-Infrastructure-API
npm install  # Installs @web3-storage/w3up-client
npm run dev

# Then test:
curl http://localhost:4000/v1/media/nft-image/status
```

**Expected response:**
```json
{
  "image_generation": {
    "enabled": true,
    "message": "OpenAI image generation is available"
  },
  "storage": {
    "configured": true,
    "provider": "Storacha (Web3.Storage)",
    "message": "IPFS storage is configured and ready",
    "space_did": "did:key:z6MkiQGSTCU1Ctm8AEqfv32U8E7dUspwe48ncSyBJaa6i19E"
  },
  "overall_status": "ready"
}
```

---

## 🧪 Generate Your First Certificate!

```bash
curl -X POST http://localhost:4000/v1/media/nft-image \
  -H "Content-Type: application/json" \
  -d '{
    "context": "bond_certificate",
    "style": "institutional",
    "bond_id": "test_storacha_001",
    "fields": {
      "title": "ARC Yield — Bond Certificate",
      "series_label": "Storacha Demo 2025",
      "principal_label": "1,000 USDC",
      "coupon_label": "6.5%",
      "tenor_label": "90 Days",
      "issuer_display_name": "Your Company",
      "transferability": "Soulbound"
    },
    "quality": "high"
  }'
```

**Response will include:**
```json
{
  "image_cid": "bafybeihkq3...",
  "image_url": "ipfs://bafybeihkq3...",
  "gateway_url": "https://w3s.link/ipfs/bafybeihkq3...",
  "storage_type": "ipfs"
}
```

Open the `gateway_url` to see your certificate! 🎨

---

## 📊 Your Storacha Dashboard

View all uploads: [https://console.storacha.network/space/did:key:z6MkiQGSTCU1Ctm8AEqfv32U8E7dUspwe48ncSyBJaa6i19E](https://console.storacha.network/space/did:key:z6MkiQGSTCU1Ctm8AEqfv32U8E7dUspwe48ncSyBJaa6i19E)

---

## 💰 Cost Comparison

| Service | Storage | Cost |
|---------|---------|------|
| Storacha | Unlimited | **FREE** 🎉 |
| IPFS Pinning | Included | **FREE** 🎉 |
| Filecoin Backup | Automatic | **FREE** 🎉 |
| OpenAI Images | Per image | ~$0.04 |

**Total:** ~$0.04 per certificate (just OpenAI)

---

## 🔄 Architecture

```
1. Generate certificate with OpenAI (ChatGPT)
   ↓
2. Upload PNG to Storacha Space
   → Returns: bafybei...CID
   ↓
3. IPFS Gateway URL
   → https://w3s.link/ipfs/bafybei...
   ↓
4. Store in NFT metadata
   → Wallets display the certificate!
```

---

## 🌐 IPFS Gateways

Your images will be available on multiple gateways:

- **Primary:** https://w3s.link/ipfs/{CID}
- **IPFS.io:** https://ipfs.io/ipfs/{CID}  
- **Dweb:** https://dweb.link/ipfs/{CID}

All point to the same content!

---

## 🎯 NFT Contract Setup

Use your deployed API URL:

```solidity
// Option A: Railway URL (works immediately)
string public apiBase = "https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft/bonds/";

// Option B: Custom domain (for production)
string public apiBase = "https://api.arcfx.finance/v1/nft/bonds/";
```

**tokenURI returns:**
```
https://your-api/v1/nft/bonds/123/metadata.json
```

Which includes:
```json
{
  "image": "ipfs://bafybei...",
  "name": "ARC Yield Bond — Series Q4 2025",
  ...
}
```

---

## 🚨 Troubleshooting

### "Using mock storage"
- ✅ Run `storacha key create` to get private key
- ✅ Run `storacha delegation create <did> --base64` to get proof
- ✅ Add both to `.env`
- ✅ Restart server

### "Failed to initialize Storacha client"
- ✅ Check private key format (starts with "MgC...")
- ✅ Check proof is complete base64 string
- ✅ Verify Space DID is correct
- ✅ Run `storacha space ls` to see your spaces

### "Upload failed"
- ✅ Check delegation has required permissions:
  - `space/blob/add`
  - `space/index/add`
  - `filecoin/offer`
  - `upload/add`
- ✅ Run `storacha delegation ls` to verify

---

## 📚 Resources

- [Storacha Docs](https://docs.storacha.network)
- [Your Space Console](https://console.storacha.network/space/did:key:z6MkiQGSTCU1Ctm8AEqfv32U8E7dUspwe48ncSyBJaa6i19E)
- [IPFS Documentation](https://docs.ipfs.tech)

---

## ✅ Summary

You now have:
- ✅ **Real IPFS storage** via Storacha
- ✅ **AI-generated certificates** with ChatGPT  
- ✅ **Free unlimited storage** (Storacha)
- ✅ **Automatic Filecoin backup**
- ✅ **Your specific Space DID** configured
- ✅ **Multiple IPFS gateways** for redundancy

**Cost per certificate:** ~$0.04 (just OpenAI)  
**Storage:** FREE forever! 🎉

---

Built for ARC-Yield with ❤️

