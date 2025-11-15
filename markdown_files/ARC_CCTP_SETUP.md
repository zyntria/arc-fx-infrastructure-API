# ARC Network CCTP Integration Setup

## Overview

This guide explains how to configure Circle's Cross-Chain Transfer Protocol (CCTP) for **ARC Network**.

Based on Circle's official documentation:
- [CCTP Overview](https://developers.circle.com/cctp)
- [Transfer USDC Tutorial](https://developers.circle.com/cctp/transfer-usdc-on-testnet-from-ethereum-to-avalanche)
- [EVM Smart Contracts](https://developers.circle.com/cctp/evm-smart-contracts)

---

## ⚠️ Important: ARC Network is New

**ARC Network** was recently launched by Circle and may not yet have official CCTP contract addresses published. You need to:

1. **Contact Circle** to request ARC Network CCTP integration details
2. **Check ARC Documentation**: https://docs.arc.network
3. **Review Circle Announcements**: https://www.circle.com/pressroom/circle-launches-arc-public-testnet

---

## Required Information from Circle

### 1. TokenMessenger Contract Address

The `TokenMessenger` contract on **ARC Testnet** handles burning USDC for cross-chain transfers.

**Update in**: `src/services/cctp.ts`

```typescript
const TOKEN_MESSENGER_ADDRESSES: Record<string, string> = {
  // ...
  ARC: "0x__REPLACE_WITH_ACTUAL_ADDRESS__", // ⚠️ Currently placeholder
}
```

**Example from other chains:**
- Ethereum Sepolia: `0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa`
- Avalanche Fuji: `0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0`

### 2. CCTP Domain ID

Each blockchain has a unique **domain identifier** for CCTP routing.

**Update in**: `src/services/cctp.ts`

```typescript
const CCTP_DOMAINS: Record<CCTPChain, number> = {
  [CCTPChain.ETHEREUM]: 0,
  [CCTPChain.AVALANCHE]: 1,
  [CCTPChain.OPTIMISM]: 2,
  [CCTPChain.ARBITRUM]: 3,
  [CCTPChain.SOLANA]: 5,
  [CCTPChain.BASE]: 6,
  [CCTPChain.POLYGON]: 7,
  [CCTPChain.ARC]: 99, // ⚠️ Placeholder - get actual domain from Circle
}
```

### 3. USDC Token Address

The official **USDC token contract** on ARC Testnet.

**Current assumption:**
```typescript
ARC: "0x3600000000000000000000000000000000000000"
```

**Verify this address** with ARC Network documentation or Circle.

### 4. MessageTransmitter Address (for receiving)

On the **destination chain**, the `MessageTransmitter` contract processes attestations and mints USDC.

This is needed for **receiving** USDC on ARC from other chains.

---

## How CCTP Works

Based on [Circle's official guide](https://developers.circle.com/cctp/transfer-usdc-on-testnet-from-ethereum-to-avalanche):

### Transfer Flow (ARC → Other Chain)

```
1. User initiates transfer on ARC
   ↓
2. Approve TokenMessenger to spend USDC
   ↓
3. Call depositForBurn() on TokenMessenger (ARC)
   - Burns USDC on ARC
   - Emits MessageSent event
   ↓
4. Wait 10-30 minutes for Circle attestation
   ↓
5. Circle's attestation service signs the burn
   ↓
6. User (or relayer) calls receiveMessage() on destination chain
   ↓
7. USDC is minted on destination chain
```

### CCTP V2 Parameters

The `depositForBurn` function signature:

```solidity
function depositForBurn(
    uint256 amount,                  // Amount to burn (in token decimals)
    uint32 destinationDomain,        // Target chain domain ID
    bytes32 mintRecipient,           // Recipient address (bytes32)
    address burnToken,               // USDC token address
    bytes32 destinationCaller,       // Who can call receiveMessage (0x0 = anyone)
    uint256 maxFee,                  // Max fee for fast transfer (e.g., 0.0005 USDC)
    uint32 minFinalityThreshold      // Finality blocks (≤1000 for fast transfer)
) external;
```

---

## Circle Attestation API

### Testnet (Sandbox)
```
https://iris-api-sandbox.circle.com/v2/messages/{sourceDomain}?transactionHash={txHash}
```

### Mainnet (Production)
```
https://iris-api.circle.com/v2/messages/{sourceDomain}?transactionHash={txHash}
```

**Response format:**
```json
{
  "messages": [{
    "status": "complete",
    "attestation": "0x...",
    "message": "0x..."
  }]
}
```

**Status values:**
- `pending` - Waiting for finality
- `complete` - Attestation ready

---

## Testing Checklist

Before going live with CCTP:

- [ ] Obtain official TokenMessenger address from Circle for ARC Network
- [ ] Obtain official CCTP domain ID from Circle for ARC Network
- [ ] Verify USDC token address on ARC testnet
- [ ] Test ARC → Ethereum transfer
- [ ] Test ARC → Avalanche transfer
- [ ] Test ARC → Solana transfer (requires Solana SDK)
- [ ] Verify attestation retrieval from Circle API
- [ ] Test receiving USDC on destination chains

---

## Configuration Steps

Once you have the official addresses:

### 1. Update `src/services/cctp.ts`

```typescript
// Replace placeholders with real addresses
const TOKEN_MESSENGER_ADDRESSES: Record<string, string> = {
  ARC: "0xREAL_ADDRESS_HERE",
}

const CCTP_DOMAINS: Record<CCTPChain, number> = {
  [CCTPChain.ARC]: REAL_DOMAIN_ID_HERE,
}

const USDC_ADDRESSES: Record<string, string> = {
  ARC: "0xREAL_USDC_ADDRESS_HERE",
}
```

### 2. Test with Small Amount

```bash
curl -X POST http://localhost:4000/v1/payouts \
  -H "Content-Type: application/json" \
  -d '{
    "funding_currency": "USDC",
    "funding_wallet": "0xYourWallet",
    "payouts": [{
      "to_wallet": "0xDestinationWallet",
      "currency": "USDC",
      "amount": 1,
      "destination_chain": "ETHEREUM",
      "metadata": "Test CCTP transfer"
    }],
    "require_compliance": false
  }'
```

### 3. Monitor Attestation

```bash
# Check status (use burnTxHash from response)
curl http://localhost:4000/v1/cctp/status/0xTRANSACTION_HASH
```

---

## Resources

- **Circle CCTP Docs**: https://developers.circle.com/cctp
- **ARC Network Docs**: https://docs.arc.network
- **Supported Chains**: https://developers.circle.com/cctp/cctp-supported-blockchains
- **EVM Contracts**: https://developers.circle.com/cctp/evm-smart-contracts
- **Solana Programs**: https://developers.circle.com/cctp/solana-programs

---

## Getting Help

If you need the official ARC Network CCTP addresses:

1. **Circle Developer Support**: https://developers.circle.com
2. **ARC Network Team**: Check their Discord or docs
3. **GitHub Issues**: Circle's CCTP repository may have updates

---

## ✅ Official ARC Network CCTP Addresses (Domain 26)

**TokenMessengerV2**: `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA`
**MessageTransmitterV2**: `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275`
**TokenMinterV2**: `0xb43db544E2c27092c107639Ad201b3dEfAbcF192`
**MessageV2**: `0xbaC0179bB358A8936169a63408C8481D582390C4`

**Gateway Contracts**:
- GatewayWallet: `0x0077777d7EBA4688BDeF3E311b846F25870A19B9`
- GatewayMinter: `0x0022222ABE238Cc2C7Bb1f21003F0a260052475B`

**Domain ID**: `26`

---

## Current Status

✅ **Fully Operational:**
- CCTP V2 API integration with official ARC Network contracts
- Multi-chain support (Ethereum, Avalanche, Optimism, Arbitrum, Base, Polygon, Solana, ARC)
- Address validation (EVM and Solana)
- Attestation retrieval from Circle's Iris API
- Cross-chain payout routing (ARC → other chains)
- Same-chain payouts (ARC → ARC)

🧪 **Ready for Testing:**
- Cross-chain USDC transfers from ARC to all supported chains

