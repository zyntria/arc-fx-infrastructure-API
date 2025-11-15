# ⚡ Quick Deploy - Copy & Paste

## 🎯 Deploy Your NFT Contract in 3 Steps

### Step 1: Get Testnet USDC (if you don't have a funded wallet)

1. Generate a wallet:
```bash
cast wallet new
```

2. Get testnet USDC from https://faucet.circle.com
   - Select "Arc Testnet"
   - Paste your wallet address
   - Wait 10 seconds

### Step 2: Deploy Contract

**Replace `0xYOUR_PRIVATE_KEY` with your actual private key:**

```bash
cd /Users/iamreechi/Downloads/arcpay-demo-starter/ARC-FX-Infrastructure-API/contracts && \
forge create ARCYieldBondNFT.sol:ARCYieldBondNFT \
  --rpc-url https://rpc.testnet.arc.network \
  --private-key 0xYOUR_PRIVATE_KEY \
  --constructor-args "ARC Yield Bond Certificate" "ARCBOND" "https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft"
```

### Step 3: Save Contract Address

Copy the "Deployed to:" address from the output!

---

## ✅ Verify Deployment

Replace `0xCONTRACT_ADDRESS` with your deployed contract address:

```bash
# Check contract name
cast call 0xCONTRACT_ADDRESS "name()(string)" --rpc-url https://rpc.testnet.arc.network

# Check symbol
cast call 0xCONTRACT_ADDRESS "symbol()(string)" --rpc-url https://rpc.testnet.arc.network

# View on ARCScan
open https://testnet.arcscan.app/address/0xCONTRACT_ADDRESS
```

---

## 🎉 Done!

Now add to your backend `.env`:
```
NFT_CONTRACT_ADDRESS=0xCONTRACT_ADDRESS
```

And your certificates will show on ARCScan! 🎨

