# 🧪 NFT Certificate Testing Guide

Your NFT contract is deployed! Here's how to test it.

---

## 📋 Prerequisites

1. ✅ Contract deployed: `0x035667589f3eac34089dc0e4155a768b9b448ee7`
2. ✅ Backend running on `localhost:4000`
3. ✅ `.env` file updated with:
   ```bash
   BOND_NFT_CONTRACT=0x035667589f3eac34089dc0e4155a768b9b448ee7
   PRIVATE_KEY=0x9c044c21c2014967cae82a7b95e1d37a578e32287da524eee2cfe2a45985aca7
   ```

---

## 🧪 Test 1: Check Contract Info

```bash
curl http://localhost:4000/v1/nft/test/info
```

**Expected Response:**
```json
{
  "contract_address": "0x035667589f3eac34089dc0e4155a768b9b448ee7",
  "network": "Arc Testnet",
  "chain_id": 5042002,
  "arcscan_url": "https://testnet.arcscan.app/address/0x035667589f3eac34089dc0e4155a768b9b448ee7",
  "name": "ARC Yield Bond Certificate",
  "symbol": "ARCBOND"
}
```

---

## 🧪 Test 2: Mint an NFT Certificate (Simple)

```bash
curl -X POST http://localhost:4000/v1/nft/test/mint \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "0x93175587C8F2d8120c82B03BD105ACe3248E2941",
    "bond_id": "test_bond_001",
    "units": 1000
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "NFT certificate minted successfully!",
  "token_id": "1",
  "tx_hash": "0x...",
  "token_uri": "https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft/bonds/test_bond_001.json",
  "arcscan_url": "https://testnet.arcscan.app/tx/0x...",
  "nft_url": "https://testnet.arcscan.app/token/0x035667589f3eac34089dc0e4155a768b9b448ee7?a=1"
}
```

---

## 🧪 Test 3: Mint NFT with AI-Generated Image

This will:
1. Generate a certificate image using OpenAI
2. Upload it to Storacha (IPFS)
3. Mint the NFT

```bash
curl -X POST http://localhost:4000/v1/nft/test/mint \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "0x93175587C8F2d8120c82B03BD105ACe3248E2941",
    "bond_id": "test_bond_002",
    "units": 5000,
    "generate_image": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "NFT certificate minted successfully!",
  "token_id": "2",
  "tx_hash": "0x...",
  "token_uri": "https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft/bonds/test_bond_002.json",
  "image_url": "ipfs://bafybeihash...",
  "arcscan_url": "https://testnet.arcscan.app/tx/0x...",
  "nft_url": "https://testnet.arcscan.app/token/0x035667589f3eac34089dc0e4155a768b9b448ee7?a=2"
}
```

---

## 🧪 Test 4: View Your NFTs

Check all NFTs owned by your wallet:

```bash
curl http://localhost:4000/v1/nft/test/tokens/0x93175587C8F2d8120c82B03BD105ACe3248E2941
```

**Expected Response:**
```json
{
  "address": "0x93175587C8F2d8120c82B03BD105ACe3248E2941",
  "token_count": 2,
  "tokens": [
    {
      "token_id": "1",
      "bond_id": "test_bond_001",
      "units": "1000",
      "subscription_time": "1730000000",
      "token_uri": "https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft/bonds/test_bond_001.json",
      "arcscan_url": "https://testnet.arcscan.app/token/0x035667589f3eac34089dc0e4155a768b9b448ee7?a=1"
    },
    {
      "token_id": "2",
      "bond_id": "test_bond_002",
      "units": "5000",
      "subscription_time": "1730000100",
      "token_uri": "https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft/bonds/test_bond_002.json",
      "arcscan_url": "https://testnet.arcscan.app/token/0x035667589f3eac34089dc0e4155a768b9b448ee7?a=2"
    }
  ]
}
```

---

## 🌐 View on ARCScan

After minting, you can view your NFTs on ARCScan:

### Your Wallet's NFTs:
https://testnet.arcscan.app/address/0x93175587C8F2d8120c82B03BD105ACe3248E2941#tokentxnsErc721

### Contract Page:
https://testnet.arcscan.app/address/0x035667589f3eac34089dc0e4155a768b9b448ee7

### Specific NFT:
https://testnet.arcscan.app/token/0x035667589f3eac34089dc0e4155a768b9b448ee7?a=1

---

## 🎨 View Certificate Images

If you used `generate_image: true`, you can view the AI-generated certificate:

1. Get the `image_url` from the mint response (starts with `ipfs://`)
2. Replace `ipfs://` with `https://ipfs.io/ipfs/` to view in browser
3. Example: `ipfs://bafybei...` → `https://ipfs.io/ipfs/bafybei...`

---

## 🔗 Integration with Bond Subscriptions

To integrate NFT minting with bond subscriptions, update your bond subscription endpoint:

```typescript
// In src/routes/yield.ts or wherever you handle bond subscriptions

import { nftContractService } from "../services/nft-contract";

// After processing subscription payment:
const nftResult = await nftContractService.mintCertificate({
  toAddress: subscriberWallet,
  bondId: bond_id,
  units: subscriptionUnits,
});

if (nftResult.success) {
  // Store nft_token_id in your database
  console.log(`NFT minted: Token ID ${nftResult.tokenId}`);
}
```

---

## ⚠️ Troubleshooting

### "Contract not found" error
- Make sure `BOND_NFT_CONTRACT` is set in `.env`
- Restart your backend server after updating `.env`

### "Insufficient funds" error
- Make sure your wallet has USDC on Arc Testnet
- Get testnet USDC from: https://faucet.circle.com/

### "Transaction failed" error
- Check that `PRIVATE_KEY` is correct in `.env`
- Make sure the private key has permission to mint (is the contract owner)

### Image generation fails
- Check that `OPENAI_API_KEY` is set
- Check that `STORACHA_PRIVATE_KEY` and `STORACHA_PROOF` are set
- Try minting without `generate_image` first to isolate the issue

---

## 🎯 Next Steps

1. ✅ Test basic minting (Test 2)
2. ✅ Test with image generation (Test 3)
3. ✅ View NFTs on ARCScan
4. 🔄 Integrate with your bond subscription flow
5. 🎨 Create a UI page for viewing certificates
6. 📱 Add to your user dashboard

---

## 📚 Related Documentation

- [HOW_TO_SHOW_CERTIFICATES.md](./contracts/HOW_TO_SHOW_CERTIFICATES.md) - How users will see their certificates
- [PRODUCTION_STORAGE_OPTIONS.md](./markdown_files/PRODUCTION_STORAGE_OPTIONS.md) - IPFS storage options for production
- [NFT_IMAGE_GENERATION.md](./markdown_files/NFT_IMAGE_GENERATION.md) - Image generation system documentation

---

**Happy Testing!** 🚀

If you encounter any issues, check the backend logs for detailed error messages.

