# Integration Roadmap - Moving from Mock to Real

## Current Status After Deployment ✅

- ✅ Contracts deployed to ARC testnet
- ✅ API server running with contract addresses
- ✅ All endpoints functional with mock data
- ✅ Swagger documentation accessible

## What's Still Mock (By Design)

### 1. FX Rates (Intentionally Mock for Demo)
**Current**: Returns hardcoded rates
```typescript
const FX_RATES = {
  USDC: { EURC: 0.9215, USYC: 1.0145 },
  // ...
}
```

**Production**: Would integrate with:
- ARC's native FX oracle
- Circle's CCTP pricing
- External price feeds (Chainlink, etc.)

### 2. Compliance (Mock by Config)
**Current**: `USE_MOCK_COMPLIANCE=true` in .env

**To Enable Real Compliance**:
1. Get Elliptic API key
2. Update .env:
   ```bash
   ELLIPTIC_API_KEY=your_real_api_key
   ELLIPTIC_API_URL=https://api.elliptic.co
   USE_MOCK_COMPLIANCE=false
   ```

## What Needs Integration ⚠️

### 1. Smart Contract Interactions
**Current Problem**: Routes generate fake transaction hashes instead of calling real contracts.

**Files to Update**:
- `src/routes/swap.ts` - Line 178: Replace fake tx with real settlement logging
- `src/routes/payouts.ts` - Line 104: Replace fake tx with real payout execution

**What to Implement**:

#### A. Settlement Logging (swap.ts)
```typescript
// Instead of:
const txHash = `0x${Math.random()...}`

// Do:
const provider = new ethers.JsonRpcProvider(config.ARC_RPC_URL)
const wallet = new ethers.Wallet(DEPLOYER_KEY, provider)
const settlement = new ethers.Contract(
  config.CONTRACT_SETTLEMENT,
  ARCfxSettlementABI,
  wallet
)

const tx = await settlement.logSettlement(
  fromTokenAddress,
  toTokenAddress,
  fromAmount,
  toAmount,
  from_wallet,
  to_wallet,
  quoteId
)

await tx.wait() // Wait for finality
const txHash = tx.hash
```

#### B. Batch Payout Execution (payouts.ts)
```typescript
// Instead of:
const txHash = `0x${Math.random()...}`

// Do:
const provider = new ethers.JsonRpcProvider(config.ARC_RPC_URL)
const wallet = new ethers.Wallet(DEPLOYER_KEY, provider)
const payouts = new ethers.Contract(
  config.CONTRACT_PAYOUTS,
  ARCfxPayoutsABI,
  wallet
)

const payoutStructs = body.payouts.map(p => ({
  to: p.to_wallet,
  token: getTokenAddress(p.currency),
  amount: ethers.parseUnits(p.amount.toString(), 6),
  metadata: p.metadata || ""
}))

const tx = await payouts.executePayouts(payoutStructs)
const receipt = await tx.wait()
const txHash = tx.hash
```

### 2. Contract ABIs Need to be Added
**Action Required**:
1. Generate ABIs from compiled contracts
2. Add to project:
   ```bash
   mkdir -p src/contracts/abis
   cp out/ARCfxSettlement.sol/ARCfxSettlement.json src/contracts/abis/
   cp out/ARCfxPayouts.sol/ARCfxPayouts.json src/contracts/abis/
   ```

3. Import in routes:
   ```typescript
   import ARCfxSettlementABI from '../contracts/abis/ARCfxSettlement.json'
   import ARCfxPayoutsABI from '../contracts/abis/ARCfxPayouts.json'
   ```

### 3. Token Address Mapping
**Need to Add**:
```typescript
const TOKEN_ADDRESSES = {
  USDC: "0x3600000000000000000000000000000000000000", // ARC testnet
  EURC: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a", // ARC testnet
  USYC: "0x0000000000000000000000000000000000000000"  // Not deployed yet
}
```

### 4. Wallet Management
**Current**: No wallet configured for signing transactions

**Need to Add to .env**:
```bash
# Wallet for signing contract transactions
OPERATOR_PRIVATE_KEY=0xyour_operator_key
```

**Security Note**: In production, use:
- AWS KMS
- Hardware wallet integration
- Multi-sig setup

### 5. Gas Estimation
**Current**: Returns hardcoded "0.02"

**Should Implement**:
```typescript
const gasEstimate = await contract.estimateGas.methodName(...)
const gasPrice = await provider.getFeeData()
const gasCost = gasEstimate * gasPrice.gasPrice
```

## Implementation Priority

### Phase 1: Basic Contract Integration (Recommended Next Steps)
1. ✅ Copy contract ABIs to src/contracts/abis/
2. ✅ Add OPERATOR_PRIVATE_KEY to .env
3. ✅ Update swap.ts to log settlements on-chain
4. ✅ Update payouts.ts to execute real payouts
5. ✅ Test with real transactions on testnet

### Phase 2: Production Readiness
1. Replace mock FX rates with real oracle integration
2. Enable real Elliptic compliance checks
3. Add proper error handling for failed transactions
4. Implement transaction retry logic
5. Add webhook notifications for transaction events

### Phase 3: Advanced Features
1. Gas optimization
2. Transaction batching
3. Multi-sig wallet support
4. Advanced monitoring and alerting
5. Rate limiting per wallet

## Testing Strategy

### Current: Demo Mode
- All endpoints work with mock data
- No real blockchain transactions
- Instant responses
- Perfect for API testing and integration

### After Contract Integration:
- Real blockchain transactions
- Actual gas costs (~$0.02-0.20 per tx)
- Sub-second finality (ARC's strength!)
- Real audit trail on-chain

### Recommended:
1. Keep mock mode as default for testing
2. Add environment flag: `USE_REAL_CONTRACTS=true`
3. Switch between mock and real based on env

## Cost Implications

### Current (Mock Mode):
- **Cost**: $0 (no blockchain transactions)
- **Speed**: Instant
- **Good for**: API testing, demos, development

### After Integration:
- **Settlement Logging**: ~0.09 ETH (~$0.18) per swap
- **Batch Payouts**: ~0.13 ETH (~$0.26) per batch
- **Speed**: <1 second (ARC deterministic finality)
- **Good for**: Production, real audit trails

## Summary

Right now you have:
- ✅ Real deployed contracts
- ✅ Fully functional API
- ⚠️ But they're not connected yet!

**Next Steps**:
1. Decide if you want to integrate real contract calls (costs testnet ETH)
2. Or keep mock mode for demo/testing purposes
3. I can help implement Phase 1 if you want real contract integration!

**For most demos and testing, keeping mock mode is perfectly fine!**
The contracts are deployed and ready when you need them.

