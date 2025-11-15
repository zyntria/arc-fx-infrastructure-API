# How to Get ARC Testnet Funds

## Current Issue
Your deployment is failing with:
```
insufficient funds for gas * price + value: have 0 want 164076825000000000
```

**Translation**: Your wallet needs ~0.28 ETH on ARC testnet (Chain ID: 5042002)

## Solutions

### Option 1: ARC Testnet Faucet (Recommended)

1. **Get your wallet address** from your private key
   - You can check it in MetaMask or any wallet tool
   - Or calculate it from your private key using a tool like ethers.js

2. **Find the ARC Testnet Faucet**
   - Check ARC Network documentation: https://docs.arc.network (or similar)
   - Look for their Discord/Telegram for faucet bot
   - Search for "ARC testnet faucet" on their website

3. **Request testnet funds**
   - Submit your wallet address to the faucet
   - Usually instant or takes a few minutes

### Option 2: Contact ARC Support

If there's no public faucet:
- Join ARC's Discord or Telegram community
- Ask in the developer channel for testnet funds
- Provide your wallet address

### Option 3: Check Your Wallet Address

Let me help you find your wallet address from the private key:

```bash
# Install cast (part of Foundry) if not already installed
# Then run:
cast wallet address --private-key $PRIVATE_KEY
```

This will show you the wallet address that needs funding.

### Option 4: Use a Test Deployment (Development Only)

For development/testing without deploying to testnet, you can:

1. **Use a local Anvil node**:
```bash
# Start local node
anvil

# Deploy to local node
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast
```

2. **Skip contract deployment entirely**
   - The API works without contracts (uses mock data)
   - All endpoints are functional
   - Deploy contracts only when you need on-chain features

## What You Need

- **Network**: ARC Testnet
- **Chain ID**: 5042002
- **RPC**: https://rpc.testnet.arc.network
- **Amount needed**: ~0.28 ETH (for deployment)
- **Your wallet address**: [Get it using cast wallet address]

## After Getting Funds

Once you have testnet funds, run:
```bash
./deploy.sh
```

The deployment should succeed and show:
```
ARCfxSettlement deployed to: 0x...
ARCfxPayouts deployed to: 0x...
```

## Important Notes

- Testnet ETH has no real value
- It's free and only for testing
- You don't need contracts deployed to use the API
- The API currently works with mock data

## Verifying Your Balance

Check if your wallet has funds:
```bash
# Get your wallet address
WALLET=$(cast wallet address --private-key $PRIVATE_KEY)

# Check balance
cast balance $WALLET --rpc-url $ARC_RPC_URL
```

Should show something like: `280353810000000000` (0.28 ETH in wei)

## Still Need Help?

If you can't find the ARC faucet or need assistance:
1. Check ARC Network's official documentation
2. Join their community channels (Discord/Telegram)
3. Look for announcements about testnet access
4. Contact their developer relations team

Remember: **You can use the full API without deploying contracts!** They're only needed for on-chain logging and batch payouts.

