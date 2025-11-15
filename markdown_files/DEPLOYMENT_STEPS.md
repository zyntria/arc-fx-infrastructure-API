# Quick Deployment Steps

## Current Status
✅ API is working  
✅ Rates endpoint fixed  
❌ Smart contracts need deployment  

## To Deploy Contracts

### Step 1: Get Your Private Key
You need a wallet private key with testnet funds on ARC Network.

**⚠️ IMPORTANT**: Never share or commit your private key!

### Step 2: Add Private Key to .env
Edit your `.env` file and add:

```bash
# Add 0x prefix to your private key (even if it starts with a number like 9)
PRIVATE_KEY=0x9abc123...
```

Example:
```bash
# If your private key is: 9abc1234567890...
# Add it as:
PRIVATE_KEY=0x9abc1234567890...
```

**Note**: Private keys are 64-character hex strings. When using Foundry, always prefix with `0x`.

### Step 3: Run Deployment Script

```bash
cd ARC-FX-Infrastructure-API
./deploy.sh
```

Or manually:

```bash
cd ARC-FX-Infrastructure-API

# Load environment variables
source .env

# Compile contracts
forge build

# Deploy
forge script script/Deploy.s.sol \
  --rpc-url $ARC_RPC_URL \
  --broadcast \
  --legacy
```

### Step 4: Update .env with Deployed Addresses

After deployment, you'll see output like:
```
ARCfxSettlement deployed to: 0xABCD...
ARCfxPayouts deployed to: 0x1234...
```

Update your `.env`:
```bash
CONTRACT_SETTLEMENT=0xABCD...
CONTRACT_PAYOUTS=0x1234...
```

### Step 5: Restart API Server

```bash
npm run dev
```

## Troubleshooting

### "PRIVATE_KEY not set"
- Make sure you added it to `.env` without the `0x` prefix
- Make sure there are no spaces around the `=`

### "Insufficient funds"
- You need testnet funds on ARC Network
- Contact ARC support or use their faucet

### Forge crashes/panics
- Try adding `--legacy` flag for legacy transaction format
- Try running outside the sandbox with full permissions

### Can't connect to RPC
- Check if `https://rpc.testnet.arc.network` is accessible
- Try a different RPC endpoint if available

## Do I Need to Deploy?

**No!** The API works without deployed contracts:
- ✅ Rates endpoint returns mock data
- ✅ Quote generation works
- ✅ All read-only endpoints work

**You only need contracts for:**
- Logging settlements on-chain
- Executing batch payouts
- Creating audit trails
- Compliance tracking

## Testing Without Deployment

You can test the full API without deploying:

```bash
# Get rates
curl http://localhost:4000/v1/rates?base=USDC

# Get quote
curl http://localhost:4000/v1/quote?from_currency=USDC&to_currency=EURC&amount=1000

# List currencies
curl http://localhost:4000/v1/currencies

# API documentation
open http://localhost:4000/docs
```

All these endpoints work with mock data!

