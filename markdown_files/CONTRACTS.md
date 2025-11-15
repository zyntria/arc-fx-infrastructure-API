# 📜 ARC-FX Smart Contracts Guide

Complete guide to deploying and using the ARC-FX smart contracts on ARC Network.

## 📦 Contracts Overview

### 1. ARCfxSettlement.sol
**Purpose:** Audit trail and event logging for all FX operations

**Key Features:**
- ✅ Logs all swaps and settlements on-chain
- ✅ Compliance check logging
- ✅ Immutable audit trail
- ✅ Deterministic finality tracking

**Events:**
```solidity
event SettlementLogged(
    address indexed fromToken,
    address indexed toToken,
    uint256 amountIn,
    uint256 amountOut,
    address fromWallet,
    address toWallet,
    string reference,
    uint256 timestamp
);
```

### 2. ARCfxPayouts.sol
**Purpose:** Multi-recipient batch payouts with automatic FX conversion

**Key Features:**
- ✅ Batch up to 100 recipients per transaction
- ✅ Automatic currency conversion
- ✅ Gas-efficient execution
- ✅ Failure handling (partial success support)

**Events:**
```solidity
event PayoutExecuted(
    address indexed to,
    address indexed token,
    uint256 amount,
    string metadata,
    uint256 timestamp
);

event BatchPayoutExecuted(
    bytes32 indexed batchId,
    uint256 recipientCount,
    address indexed fundingToken,
    uint256 totalFunding,
    uint256 timestamp
);
```

## 🛠️ Setup

### Prerequisites

1. **Install Foundry** (Solidity development framework)

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. **Verify Installation**

```bash
forge --version
# Should output: forge 0.2.0 or higher
```

### Project Structure

```
ARC-FX-Infrastructure-API/
├── contracts/
│   ├── ARCfxSettlement.sol
│   └── ARCfxPayouts.sol
├── script/
│   └── Deploy.s.sol
├── test/
│   ├── ARCfxSettlement.t.sol
│   └── ARCfxPayouts.t.sol
└── foundry.toml
```

## 🧪 Testing

### Run All Tests

```bash
forge test
```

### Run Specific Test

```bash
forge test --match-contract ARCfxSettlementTest
forge test --match-contract ARCfxPayoutsTest
```

### Run with Verbosity

```bash
forge test -vvv
```

### Gas Report

```bash
forge test --gas-report
```

### Expected Output

```
Running 10 tests for test/ARCfxSettlement.t.sol:ARCfxSettlementTest
[PASS] test_LogSettlement() (gas: 98234)
[PASS] test_RevertInvalidTokens() (gas: 12456)
[PASS] test_LogComplianceCheck() (gas: 45123)
[PASS] test_MultipleSettlements() (gas: 156789)

Running 6 tests for test/ARCfxPayouts.t.sol:ARCfxPayoutsTest
[PASS] test_ExecuteSinglePayout() (gas: 123456)
[PASS] test_ExecuteBatchPayouts() (gas: 234567)
[PASS] test_RevertEmptyPayouts() (gas: 8901)
[PASS] test_MaxRecipientsAllowed() (gas: 4567890)

Test result: ok. 10 passed;
```

## 🚀 Deployment

### Step 1: Set Environment Variables

Create/update your `.env` file:

```bash
# ARC Network
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_CHAIN_ID=12345

# Deployer wallet (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# Optional: For contract verification
ARCSCAN_API_KEY=your_arcscan_api_key
```

⚠️ **IMPORTANT:** Never commit your `.env` file!

### Step 2: Get Testnet Funds

Get ARC testnet tokens for gas fees:
1. Visit: https://faucet.arc.network
2. Enter your wallet address
3. Request testnet tokens

### Step 3: Deploy to ARC Testnet

```bash
# Compile contracts first
forge build

# Deploy
forge script script/Deploy.s.sol \
  --rpc-url $ARC_RPC_URL \
  --broadcast \
  --verify
```

### Step 4: Save Contract Addresses

The deployment will output addresses like:

```
ARCfxSettlement: 0x1234567890AbcdEF1234567890aBcdef12345678
ARCfxPayouts: 0xAbCdEf1234567890aBcDeF1234567890AbCdEf12
```

**Add them to your `.env` file:**

```bash
CONTRACT_SETTLEMENT=0x1234567890AbcdEF1234567890aBcdef12345678
CONTRACT_PAYOUTS=0xAbCdEf1234567890aBcDeF1234567890AbCdEf12
```

### Step 5: Verify on ArcScan

View your contracts on the explorer:
- https://testnet.arcscan.app/address/YOUR_CONTRACT_ADDRESS

## 💻 Using the Contracts

### From the API

The API automatically uses the deployed contracts. Just restart the API server after deployment:

```bash
npm run dev
```

### Direct Interaction (Foundry Cast)

#### Log a Settlement

```bash
cast send $CONTRACT_SETTLEMENT \
  "logSettlement(address,address,uint256,uint256,address,address,string)" \
  0x3600000000000000000000000000000000000000 \
  0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a \
  100000000 \
  92000000 \
  0xYourFromWallet \
  0xYourToWallet \
  "quote_123" \
  --rpc-url $ARC_RPC_URL \
  --private-key $PRIVATE_KEY
```

#### Execute Batch Payout

```bash
# This requires encoding the Payout[] struct - easier via API or ethers.js
```

### From TypeScript/ethers.js

```typescript
import { ethers } from "ethers"

const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL)
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

const settlement = new ethers.Contract(
  process.env.CONTRACT_SETTLEMENT,
  SETTLEMENT_ABI,
  wallet
)

// Log a settlement
const tx = await settlement.logSettlement(
  "0x3600000000000000000000000000000000000000", // USDC
  "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a", // EURC
  ethers.parseUnits("100", 6),
  ethers.parseUnits("92", 6),
  fromWallet,
  toWallet,
  "quote_123"
)

await tx.wait()
console.log("Settlement logged:", tx.hash)
```

## 📊 Contract ABIs

Export ABIs for use in your application:

```bash
# Settlement ABI
cat out/ARCfxSettlement.sol/ARCfxSettlement.json | jq '.abi' > abis/ARCfxSettlement.json

# Payouts ABI
cat out/ARCfxPayouts.sol/ARCfxPayouts.json | jq '.abi' > abis/ARCfxPayouts.json
```

## 🔐 Security

### Best Practices

1. ✅ **Never commit private keys**
2. ✅ **Use hardware wallets for mainnet**
3. ✅ **Test thoroughly on testnet first**
4. ✅ **Verify contracts on explorer**
5. ✅ **Monitor gas costs**

### Audit Checklist

- [x] No reentrancy vulnerabilities
- [x] Input validation on all functions
- [x] Events for all state changes
- [x] Gas-optimized code
- [x] Comprehensive test coverage

## 🐛 Troubleshooting

### Deployment Fails with "Insufficient Funds"

Get more testnet tokens from the faucet:
```bash
https://faucet.arc.network
```

### "Failed to verify contract"

Check your ArcScan API key:
```bash
echo $ARCSCAN_API_KEY
```

### Gas Estimation Failed

Increase gas limit in foundry.toml:
```toml
gas_limit = 30000000
```

### Contract Already Deployed

If you need to redeploy:
1. Use a different deployer address
2. Or increment a salt value in Deploy.s.sol

## 📈 Gas Costs

Expected gas costs on ARC Network:

| Operation | Gas Used | Cost (@ $0.02/tx) |
|-----------|----------|-------------------|
| Deploy Settlement | ~500,000 | $0.02 |
| Deploy Payouts | ~800,000 | $0.02 |
| Log Settlement | ~80,000 | $0.02 |
| Execute 1 Payout | ~100,000 | $0.02 |
| Execute 10 Payouts | ~400,000 | $0.02 |
| Execute 100 Payouts | ~2,500,000 | $0.02 |

💡 **ARC Network uses USDC for gas**, making costs predictable!

## 🔄 Upgrading

To upgrade contracts:

1. Deploy new versions
2. Update CONTRACT_ addresses in `.env`
3. Restart API
4. Migrate data if needed

## 📞 Support

- **ARC Network Docs**: https://docs.arc.network
- **Foundry Docs**: https://book.getfoundry.sh
- **Issues**: Open a GitHub issue

## ✅ Checklist

Deployment checklist:

- [ ] Foundry installed
- [ ] Contracts compile (`forge build`)
- [ ] Tests pass (`forge test`)
- [ ] Private key in `.env`
- [ ] Testnet funds acquired
- [ ] Contracts deployed
- [ ] Addresses added to `.env`
- [ ] Contracts verified on ArcScan
- [ ] API restarted with new addresses
- [ ] Test API integration

---

**Your contracts are now live on ARC Network!** 🎉

Ready to power deterministic multi-currency settlements!

