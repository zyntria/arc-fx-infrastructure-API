# 🚀 Deploy Your NFT Contract NOW

## ✅ Everything is Ready!

Your wallet: `0x93175587C8F2d8120c82B03BD105ACe3248E2941`  
Contract compiled: ✅  
OpenZeppelin installed: ✅  

---

## 📋 Run This Command in Your Terminal

**Copy and paste this into your terminal:**

```bash
cd /Users/iamreechi/Downloads/arcpay-demo-starter/ARC-FX-Infrastructure-API/contracts && \
NO_PROXY=* forge create ARCYieldBondNFT.sol:ARCYieldBondNFT \
  --rpc-url https://rpc.testnet.arc.network \
  --private-key 0x9c044c21c2014967cae82a7b95e1d37a578e32287da524eee2cfe2a45985aca7 \
  --constructor-args "ARC Yield Bond Certificate" "ARCBOND" "https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft" \
  --broadcast \
  --legacy
```

---

## ⏳ What Will Happen

1. **Connecting to Arc Testnet...**
2. **Deploying contract...**
3. **✅ Success! You'll see:**
   ```
   Deployed to: 0xYOUR_CONTRACT_ADDRESS
   Transaction hash: 0x...
   ```

---

## 💾 Save Your Contract Address

After deployment, copy the "Deployed to:" address.

Then add it to your backend `.env`:
```bash
# In ARC-FX-Infrastructure-API/.env
NFT_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS_HERE
```

---

## 🔍 View on ARCScan

Once deployed, visit:
```
https://testnet.arcscan.app/address/YOUR_CONTRACT_ADDRESS
```

---

## ✅ Verify Deployment

Test the contract:
```bash
# Check name
cast call YOUR_CONTRACT_ADDRESS "name()(string)" --rpc-url https://rpc.testnet.arc.network

# Should return: "ARC Yield Bond Certificate"
```

---

## 🎉 Next Steps

After deployment:

1. ✅ Add contract address to backend `.env`
2. ✅ Your backend can now mint NFTs
3. ✅ Certificates will show on ARCScan
4. ✅ Users will see certificates in wallets

---

**Ready? Run the command above now!** 🚀

---

## 🆘 If You Get Errors

### Error: "insufficient funds"
- Get testnet USDC: https://faucet.circle.com
- Select "Arc Testnet"
- Enter: `0x93175587C8F2d8120c82B03BD105ACe3248E2941`

### Error: "nonce too high"
- Just try again

### Error: "execution reverted"
- Check RPC URL is correct
- Try adding `--legacy` flag

---

## 📱 Contact Info

**Your Wallet**: `0x93175587C8F2d8120c82B03BD105ACe3248E2941`  
**Network**: Arc Testnet  
**Explorer**: https://testnet.arcscan.app  
**Faucet**: https://faucet.circle.com

Everything is ready - just run the command! 🎊

