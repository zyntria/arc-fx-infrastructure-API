# ARC-FX Deployment Guide

## Current Status

### ✅ What's Working
- API server is running on port 4000
- Health check endpoint is accessible
- Project structure is set up correctly

### ❌ Issues to Fix

#### 1. Empty Rates Response
**Problem**: The `/v1/rates` endpoint returns `{"rates": {}}`

**Solution**: Restart the dev server to reload the code.

```bash
# Stop the current server (Ctrl+C if running)
# Then restart:
npm run dev
```

**Expected Response After Fix**:
```json
{
  "base": "USDC",
  "rates": {
    "EURC": 0.9215,
    "USYC": 1.0145
  },
  "source": "arc-native-fx",
  "timestamp": "2025-11-09T22:36:35.246Z",
  "note": "Rates from ARC's deterministic FX oracle"
}
```

#### 2. Smart Contracts Not Deployed
**Problem**: The ARCfxSettlement and ARCfxPayouts contracts need to be deployed to ARC Network.

**Prerequisites**:
- You need a private key for deployment
- You need testnet funds on ARC Network

**Deployment Steps**:

1. **Add your private key to .env**:
```bash
# Edit .env and add (include the 0x prefix):
PRIVATE_KEY=0xyour_private_key_here
```

⚠️ **Security Note**: Never commit .env files with real private keys!

2. **Compile the contracts**:
```bash
forge build
```

3. **Deploy to ARC Testnet**:
```bash
forge script script/Deploy.s.sol \
  --rpc-url $ARC_RPC_URL \
  --broadcast
```

Or if you need to verify contracts:
```bash
forge script script/Deploy.s.sol \
  --rpc-url $ARC_RPC_URL \
  --broadcast \
  --verify
```

4. **Update .env with deployed addresses**:
After deployment, you'll see output like:
```
ARCfxSettlement deployed to: 0xABCD...
ARCfxPayouts deployed to: 0x1234...
```

Update your .env file:
```
CONTRACT_SETTLEMENT=0xABCD...
CONTRACT_PAYOUTS=0x1234...
```

5. **Restart the API server** to load the new contract addresses:
```bash
npm run dev
```

## Testing After Deployment

### 1. Test the Rates Endpoint
```bash
curl -X GET \
  'http://localhost:4000/v1/rates?base=USDC' \
  -H 'accept: application/json'
```

### 2. Test Currency Listing
```bash
curl -X GET \
  'http://localhost:4000/v1/currencies' \
  -H 'accept: application/json'
```

### 3. Test Quote Generation
```bash
curl -X GET \
  'http://localhost:4000/v1/quote?from_currency=USDC&to_currency=EURC&amount=1000' \
  -H 'accept: application/json'
```

### 4. View API Documentation
Open in browser: http://localhost:4000/docs

## What the Contracts Do

### ARCfxSettlement
- **Purpose**: Logs all FX swaps and settlements on-chain for audit trails
- **Not Used For**: The actual FX conversion (that's done by ARC's native services)
- **Use Case**: Compliance, auditing, and transaction tracking

### ARCfxPayouts
- **Purpose**: Handles batch payouts to multiple recipients with automatic FX conversion
- **Features**: 
  - Process up to 100 recipients per batch
  - Automatic currency conversion
  - Event logging for tracking
- **Cost**: ~$0.02 per batch on ARC testnet

## Notes

- The `/rates` endpoint returns **mock data** and doesn't require contracts to be deployed
- The contracts are for **logging and audit purposes** - the actual FX happens via ARC's native services
- You can test the API fully without deploying contracts
- Deploy contracts when you need to:
  - Log settlements on-chain
  - Execute batch payouts
  - Provide audit trails for compliance

## Troubleshooting

### "empty rates" issue persists
1. Check if tsx watch is actually reloading:
   - Look for "Restarting..." messages in the console
2. Try stopping and manually restarting:
   ```bash
   killall node
   npm run dev
   ```

### Contract deployment fails
1. Check you have testnet funds
2. Verify your PRIVATE_KEY is correct in .env
3. Ensure ARC_RPC_URL is accessible
4. Try with increased gas limit:
   ```bash
   forge script script/Deploy.s.sol \
     --rpc-url $ARC_RPC_URL \
     --broadcast \
     --gas-limit 3000000
   ```

### Need ARC testnet funds?
Contact ARC Network support or use their testnet faucet (check their documentation).

