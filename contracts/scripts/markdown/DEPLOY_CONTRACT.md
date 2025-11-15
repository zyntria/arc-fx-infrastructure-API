# Deploy NFT Contract to Arc Testnet

## 🔴 ISSUE: Foundry keeps doing "dry run" even with --broadcast

This is a known Foundry issue on some Mac systems. Try the solutions below.

## ✅ Solution 1: Run in Your Mac Terminal (Recommended)

**Open your Mac Terminal app** (not Cursor's terminal) and run:

```bash
cd /Users/iamreechi/Downloads/arcpay-demo-starter/ARC-FX-Infrastructure-API/contracts

forge create ARCYieldBondNFT.sol:ARCYieldBondNFT \
  --rpc-url https://rpc.testnet.arc.network \
  --private-key 0x9c044c21c2014967cae82a7b95e1d37a578e32287da524eee2cfe2a45985aca7 \
  --constructor-args "ARC Yield Bond Certificate" "ARCBOND" "http://localhost:4000/v1/nft" \
  --broadcast
```

## ✅ Solution 2: Try with --unlocked

If Solution 1 doesn't work, try:

```bash
forge create ARCYieldBondNFT.sol:ARCYieldBondNFT \
  --rpc-url https://rpc.testnet.arc.network \
  --private-key 0x9c044c21c2014967cae82a7b95e1d37a578e32287da524eee2cfe2a45985aca7 \
  --constructor-args "ARC Yield Bond Certificate" "ARCBOND" "http://localhost:4000/v1/nft" \
  --broadcast \
  --unlocked
```

## ✅ Solution 3: Use cast send (Alternative)

First, get the contract bytecode:

```bash
forge build
```

Then manually deploy using `cast`:

```bash
cast send --create \
  --rpc-url https://rpc.testnet.arc.network \
  --private-key 0x9c044c21c2014967cae82a7b95e1d37a578e32287da524eee2cfe2a45985aca7 \
  $(cat out/ARCYieldBondNFT.sol/ARCYieldBondNFT.json | jq -r '.bytecode.object')
```

## 📋 What to Look For

**Successful deployment will show:**

```
Deployer: 0x93175587C8F2d8120c82B03BD105ACe3248E2941
Deployed to: 0x...
Transaction hash: 0x...
```

**Save the "Deployed to:" address!**

## 🔍 Verify on Arc Explorer

After deployment, check your transaction:
https://testnet.arcscan.app

Paste your transaction hash to confirm.

## 💰 Your Wallet Info

- Address: `0x93175587C8F2d8120c82B03BD105ACe3248E2941`
- Balance: $18.65 USDC (should be plenty for gas)
- USDC is the native gas token on Arc Testnet ✅

## 🐛 If Still Having Issues

1. Check Foundry version: `forge --version`
2. Update Foundry: `foundryup`
3. Try without the backslashes (on one line)
4. Check if you have Java installed (some Foundry features need it)

---

**Once deployed, share the contract address and we'll update the backend to use it!**

