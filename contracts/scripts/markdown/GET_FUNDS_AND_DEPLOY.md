# 🚀 Get Testnet USDC & Deploy Contract

## Step 1: Get Testnet USDC (Required!)

Your wallet needs USDC to pay gas fees on Arc Testnet.

### Your Wallet Address:
```
0x93175587C8F2d8120c82B03BD105ACe3248E2941
```

### Get Free Testnet USDC:

1. **Go to Circle Faucet:** https://faucet.circle.com

2. **Fill out the form:**
   - Select: **Arc Testnet**
   - Wallet Address: `0x93175587C8F2d8120c82B03BD105ACe3248E2941`
   - Click "Get Test Tokens"

3. **Wait 10-30 seconds** for the USDC to arrive

---

## Step 2: Verify You Have Funds

Run this in your terminal:

```bash
curl -X POST https://rpc.testnet.arc.network \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_getBalance",
    "params": ["0x93175587C8F2d8120c82B03BD105ACe3248E2941", "latest"],
    "id": 1
  }' | jq
```

You should see a non-zero `result` value.

---

## Step 3: Deploy the Contract

Once you have funds, run this:

```bash
cd /Users/iamreechi/Downloads/arcpay-demo-starter/ARC-FX-Infrastructure-API/contracts && \
forge create ARCYieldBondNFT.sol:ARCYieldBondNFT \
  --rpc-url https://rpc.testnet.arc.network \
  --private-key 0x9c044c21c2014967cae82a7b95e1d37a578e32287da524eee2cfe2a45985aca7 \
  --constructor-args "ARC Yield Bond Certificate" "ARCBOND" "https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft" \
  --legacy
```

(Note: Removed `--broadcast` and `NO_PROXY=*` - they were causing issues)

---

## Expected Output

When successful, you'll see:

```
Deployer: 0x93175587C8F2d8120c82B03BD105ACe3248E2941
Deployed to: 0xYOUR_CONTRACT_ADDRESS
Transaction hash: 0x...
```

**Save the "Deployed to" address!**

---

## Step 4: Save Contract Address

Add to your backend `.env`:

```bash
NFT_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS_HERE
```

---

## Step 5: Verify Deployment

Check on ARCScan:
```
https://testnet.arcscan.app/address/YOUR_CONTRACT_ADDRESS
```

Test the contract:
```bash
cast call YOUR_CONTRACT_ADDRESS "name()(string)" \
  --rpc-url https://rpc.testnet.arc.network
```

Should return: `"ARC Yield Bond Certificate"`

---

## 🆘 Troubleshooting

### "insufficient funds" error
- You need more testnet USDC from the faucet
- Wait a minute after requesting and try again

### "nonce too high" error
- Just wait 30 seconds and try again

### "connection refused" error
- Check your internet connection
- Try again in a minute

---

## Quick Summary:

1. ✅ Get testnet USDC: https://faucet.circle.com
2. ✅ Wait 30 seconds
3. ✅ Run the deploy command above
4. ✅ Save the contract address
5. ✅ View on ARCScan

**Ready? Get testnet USDC first, then run the deploy command!** 🚀

