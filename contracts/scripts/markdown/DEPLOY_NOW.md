# 🚀 Deploy NFT Contract to Arc Testnet - Quick Guide

## Step 1: Get Your Wallet Ready

### Generate a new wallet (or use existing):
```bash
cd /Users/iamreechi/Downloads/arcpay-demo-starter/ARC-FX-Infrastructure-API/contracts

# Generate new wallet
cast wallet new
```

**Save the output:**
- Address: `0x...`
- Private key: `0x...`

### Get testnet USDC (Arc's gas token):
1. Go to: https://faucet.circle.com
2. Select **Arc Testnet**
3. Paste your wallet address
4. Click "Get Test Tokens"
5. Wait ~10 seconds

---

## Step 2: Install OpenZeppelin (if not installed)

```bash
cd /Users/iamreechi/Downloads/arcpay-demo-starter/ARC-FX-Infrastructure-API/contracts

forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

---

## Step 3: Deploy the Contract

### Replace `YOUR_PRIVATE_KEY` with your actual private key:

```bash
cd /Users/iamreechi/Downloads/arcpay-demo-starter/ARC-FX-Infrastructure-API/contracts

forge create ARCYieldBondNFT.sol:ARCYieldBondNFT \
  --rpc-url https://rpc.testnet.arc.network \
  --private-key YOUR_PRIVATE_KEY \
  --constructor-args "ARC Yield Bond Certificate" "ARCBOND" "https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft"
```

**Example (with your key):**
```bash
forge create ARCYieldBondNFT.sol:ARCYieldBondNFT \
  --rpc-url https://rpc.testnet.arc.network \
  --private-key 0xYOUR_ACTUAL_PRIVATE_KEY_HERE \
  --constructor-args "ARC Yield Bond Certificate" "ARCBOND" "https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft"
```

---

## Step 4: Save the Contract Address

After deployment, you'll see:

```
Deployed to: 0x1234567890abcdef...
Transaction hash: 0xabcdef123456...
```

**Copy the "Deployed to" address!**

---

## Step 5: Add to Your Backend

Add this line to your backend's `.env` file:

```bash
NFT_CONTRACT_ADDRESS=0x1234567890abcdef...
```

---

## Step 6: Verify It Worked

### Check the contract on ARCScan:
```
https://testnet.arcscan.app/address/0xYOUR_CONTRACT_ADDRESS
```

### Call a function to test:
```bash
cast call 0xYOUR_CONTRACT_ADDRESS "name()(string)" --rpc-url https://rpc.testnet.arc.network
```

Should return: `"ARC Yield Bond Certificate"`

---

## Step 7: Set Up Contract Permissions

Your backend will mint NFTs, so give it permission:

```bash
# Replace YOUR_CONTRACT_ADDRESS and BACKEND_WALLET_ADDRESS
cast send 0xYOUR_CONTRACT_ADDRESS \
  "setBondContract(address)" \
  0xBACKEND_WALLET_ADDRESS \
  --private-key YOUR_PRIVATE_KEY \
  --rpc-url https://rpc.testnet.arc.network
```

---

## 🎉 Done!

Now when users subscribe to bonds:

1. Your backend generates certificate image (OpenAI) ✅
2. Uploads to IPFS (Storacha) ✅
3. Mints NFT to user's wallet ✅
4. User sees certificate in wallet/ARCScan ✅

---

## Quick Reference

| What | Value |
|------|-------|
| **Network** | Arc Testnet |
| **RPC URL** | https://rpc.testnet.arc.network |
| **Explorer** | https://testnet.arcscan.app |
| **Faucet** | https://faucet.circle.com |
| **Contract Name** | ARCYieldBondNFT |
| **Token Symbol** | ARCBOND |
| **Metadata Base** | https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft |

---

## Need Help?

### Check your balance:
```bash
cast balance YOUR_WALLET_ADDRESS --rpc-url https://rpc.testnet.arc.network
```

### Check if contract exists:
```bash
cast code YOUR_CONTRACT_ADDRESS --rpc-url https://rpc.testnet.arc.network
```

### Call contract functions:
```bash
# Get contract name
cast call YOUR_CONTRACT_ADDRESS "name()(string)" --rpc-url https://rpc.testnet.arc.network

# Get symbol
cast call YOUR_CONTRACT_ADDRESS "symbol()(string)" --rpc-url https://rpc.testnet.arc.network

# Get base URI
cast call YOUR_CONTRACT_ADDRESS "baseMetadataURI()(string)" --rpc-url https://rpc.testnet.arc.network
```

---

**Ready to deploy? Just copy-paste the commands above with your private key!** 🚀

