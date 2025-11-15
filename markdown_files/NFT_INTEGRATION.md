# 🎫 Bond Certificate NFT Integration

## Overview

Real ERC721 NFT certificates are now minted for every bond subscription, serving as proof of ownership and enabling features like:
- Soulbound bonds (non-transferable)
- Restricted transfers (issuer approval required)
- Freely transferable bonds
- On-chain verification of ownership
- Coupon distribution to NFT holders
- Redemption at maturity

## Smart Contract

**Contract:** `BondCertificateNFT.sol`  
**Standard:** ERC721 + ERC721Enumerable + ERC721URIStorage

### Key Features

1. **Transferability Modes**
   - `SOULBOUND`: Cannot be transferred (retirement accounts, etc.)
   - `RESTRICTED`: Requires issuer approval for each transfer
   - `FREELY`: Fully transferable like regular NFTs

2. **Certificate Metadata**
   Each NFT stores:
   - Bond ID and series name
   - Investor address
   - Number of units owned
   - Principal per unit
   - Coupon rate (basis points)
   - Issue and maturity dates
   - Currency
   - Redemption status

3. **Batch Minting**
   Efficiently mint multiple NFTs in one transaction for gas savings.

4. **Redemption**
   At maturity, NFTs are burned and principal + final coupon returned.

## Deployment

### 1. Install Dependencies

```bash
cd ARC-FX-Infrastructure-API
forge install OpenZeppelin/openzeppelin-contracts
```

### 2. Deploy to Arc Testnet

```bash
# Make sure .env has PRIVATE_KEY and ARC_RPC_URL
forge script script/DeployBondNFT.s.sol \
  --rpc-url $ARC_RPC_URL \
  --broadcast \
  --verify
```

### 3. Update API Configuration

Add to `.env`:
```
BOND_NFT_CONTRACT=0x...  # Deployed contract address
```

## API Integration

### Current State (MOCK)

```typescript
// ❌ Currently: Just generates fake IDs
const nftTokenIds = Array.from({ length: body.units }, (_, i) => 
  `${100000 + subscriptions.length * 100 + i}`
)
```

### After Integration (REAL)

```typescript
// ✅ Real NFT minting via smart contract
import { ethers } from "ethers"

const nftContract = new ethers.Contract(
  process.env.BOND_NFT_CONTRACT!,
  bondNFTAbi,
  wallet
)

const tx = await nftContract.mintCertificate(
  investorWallet,      // to
  bondId,              // bondId
  seriesName,          // seriesName
  units,               // units
  principalPerUnit,    // principalPerUnit
  couponRateBps,       // couponRateBps
  maturityDate,        // maturityDate
  currency,            // currency
  transferability,     // 0=SOULBOUND, 1=RESTRICTED, 2=FREELY
  tokenURI             // metadata URI
)

const receipt = await tx.wait()
const tokenId = receipt.events[0].args.tokenId
```

## Metadata Structure

Each NFT has JSON metadata stored on IPFS or on-chain:

```json
{
  "name": "Q2 2025 Corporate Bond #100001",
  "description": "Certificate of ownership for 10 units of Q2 2025 bond series",
  "image": "ipfs://Qm.../certificate.png",
  "attributes": [
    {
      "trait_type": "Bond Series",
      "value": "Q2 2025"
    },
    {
      "trait_type": "Units",
      "value": 10,
      "display_type": "number"
    },
    {
      "trait_type": "Coupon Rate",
      "value": "5.00%"
    },
    {
      "trait_type": "Maturity Date",
      "value": "2026-11-17",
      "display_type": "date"
    },
    {
      "trait_type": "Currency",
      "value": "USDC"
    },
    {
      "trait_type": "Transferability",
      "value": "Freely Transferable"
    },
    {
      "trait_type": "Status",
      "value": "Active"
    }
  ]
}
```

## Frontend Integration

### Display NFT in Wallet

```typescript
import { useAccount, useContractRead } from 'wagmi'

function BondNFTs() {
  const { address } = useAccount()
  
  const { data: tokenIds } = useContractRead({
    address: BOND_NFT_CONTRACT,
    abi: bondNFTAbi,
    functionName: 'getCertificatesByInvestor',
    args: [address],
  })

  // Display NFTs with metadata
}
```

### Redeem at Maturity

```typescript
const { write: redeem } = useContractWrite({
  address: BOND_NFT_CONTRACT,
  abi: bondNFTAbi,
  functionName: 'redeemCertificate',
  args: [tokenId],
})
```

## Benefits

1. **Proof of Ownership**: On-chain verification
2. **Composability**: Can be used in other DeFi protocols
3. **Regulatory Compliance**: Soulbound mode for restricted investors
4. **Secondary Market**: Freely mode enables trading
5. **Coupon Distribution**: Iterate through NFT holders
6. **Portfolio Management**: Easy to track all positions
7. **Metadata**: Rich information directly on NFT

## Next Steps

1. ✅ Create NFT contract
2. ⏳ Deploy to Arc testnet
3. ⏳ Generate and upload metadata templates
4. ⏳ Integrate ethers.js in API
5. ⏳ Update subscription endpoint to mint real NFTs
6. ⏳ Add NFT display in frontend
7. ⏳ Add redemption functionality
8. ⏳ Test full flow end-to-end

## Security Considerations

- Only contract owner (API backend wallet) can mint NFTs
- Transferability enforced at smart contract level
- Redemption only possible after maturity date
- NFTs are burned on redemption (not just marked)
- Use safe mint to prevent loss to non-ERC721 receivers

## Gas Optimization

- Batch minting saves gas when many investors subscribe
- Use ERC721Enumerable for efficient queries
- Minimal on-chain storage (metadata in IPFS)
- Events for off-chain indexing

## Testing

```bash
# Run contract tests
forge test --match-contract BondCertificateNFT -vvv

# Test subscription with real NFT minting
curl -X POST http://localhost:4000/v1/yield/bonds/bond_123/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "investor_wallet": "0x...",
    "units": 5,
    "payment_currency": "USDC"
  }'
```


