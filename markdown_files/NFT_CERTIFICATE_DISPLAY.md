# How Bond Subscribers See Their NFT Certificates

## 📱 Complete User Experience Flow

### 1. **Bond Subscription & NFT Minting**

```typescript
// When user subscribes to a bond:
POST /v1/yield/bonds/{bond_id}/subscribe
{
  "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "amount": "1000"
}

// Backend:
// 1. Process payment
// 2. Mint NFT to user's wallet
// 3. NFT contract stores bond_id in token
```

### 2. **NFT Contract tokenURI Implementation**

```solidity
// ARCYieldBondNFT.sol
function tokenURI(uint256 tokenId) public view returns (string memory) {
    uint256 bondId = positions[tokenId].bondId;
    
    // Option A: Point to your API
    return string(abi.encodePacked(
        "https://api.arcfx.finance/v1/nft/bonds/",
        bondId.toString(),
        "/metadata.json"
    ));
    
    // Option B: Point directly to IPFS (more decentralized)
    // return bondIdToMetadataIPFS[bondId];
}
```

### 3. **Where Users See Their Certificates**

#### A. 🔍 **ARC Block Explorer (ARCScan)**

1. User goes to ARCScan
2. Searches their wallet address
3. Sees their NFTs listed
4. ARCScan calls `tokenURI()` from the contract
5. Fetches metadata from your API or IPFS
6. Displays the certificate image

**Example:**
```
https://testnet.arcscan.app/address/0x742d35Cc...
→ Shows "ARC Yield Bond NFT"
→ Thumbnail of certificate
→ Click to view full image
```

#### B. 💼 **Crypto Wallets (MetaMask, Trust Wallet, etc.)**

**How it works:**

1. **User adds NFT to wallet:**
   ```
   MetaMask → NFTs tab → Import NFT
   Contract Address: 0x...
   Token ID: 123
   ```

2. **Wallet automatically:**
   - Calls `tokenURI(123)` on your contract
   - Gets: `https://api.arcfx.finance/v1/nft/bonds/bond_123/metadata.json`
   - Fetches the metadata
   - Reads `image: "ipfs://bafybei..."`
   - Downloads image from IPFS gateway
   - **Displays certificate in wallet!**

3. **User sees:**
   ```
   [📜 Certificate Image]
   ARC Finance Bond — Q4 2025
   
   Details:
   - Principal: 1000 USDC
   - Coupon: 5%
   - Tenor: 90 Days
   ```

#### C. 🌐 **Your ARC-FX Dashboard**

**Best user experience - custom interface:**

```typescript
// In your frontend (arcfx-payments-ui)
// app/dashboard/bonds/[bondId]/page.tsx

export default function BondDetailPage({ params }) {
  const { bondId } = params
  const { data: bond } = useQuery(`/v1/yield/bonds/${bondId}`)
  const { data: nft } = useQuery(`/v1/nft/bonds/${bondId}/metadata.json`)
  
  return (
    <div>
      <h1>{bond.name}</h1>
      
      {/* Show certificate */}
      <div className="certificate-display">
        <img 
          src={nft.image.replace('ipfs://', 'https://w3s.link/ipfs/')} 
          alt="Bond Certificate"
        />
      </div>
      
      {/* Show bond details */}
      <BondDetails bond={bond} />
      
      {/* Download options */}
      <button onClick={() => downloadCertificate(nft.image)}>
        📥 Download Certificate
      </button>
    </div>
  )
}
```

#### D. 📧 **Email Delivery (Optional Premium UX)**

```typescript
// After NFT is minted, send email:
async function sendCertificateEmail(subscriber) {
  const nftData = await fetch(`/v1/nft/bonds/${bondId}/metadata.json`)
  const imageUrl = nftData.image.replace('ipfs://', 'https://w3s.link/ipfs/')
  
  await sendEmail({
    to: subscriber.email,
    subject: '🎉 Your ARC Bond Certificate',
    html: `
      <h1>Certificate Generated!</h1>
      <img src="${imageUrl}" width="600" />
      <p>Your bond certificate is stored on IPFS and minted as an NFT to your wallet.</p>
      <a href="https://app.arcfx.finance/bonds/${bondId}">View in Dashboard</a>
    `
  })
}
```

## 🎯 Recommended Display Strategy

### **For Hackathon/Demo:**
1. ✅ Show in your custom dashboard (easiest)
2. ✅ Test with MetaMask wallet
3. ✅ Link to IPFS gateway for direct viewing

### **For Production:**
1. ✅ Custom dashboard (best UX)
2. ✅ Wallet support (MetaMask, etc.)
3. ✅ ARCScan integration (automatic)
4. ✅ Email delivery (premium touch)
5. ✅ Download as PDF option

## 📱 Example Dashboard Component

```typescript
// components/BondCertificate.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'

export function BondCertificate({ bondId, metadata }) {
  const [loading, setLoading] = useState(true)
  
  // Convert IPFS URL to HTTP gateway
  const imageUrl = metadata.image.startsWith('ipfs://')
    ? metadata.image.replace('ipfs://', 'https://w3s.link/ipfs/')
    : metadata.image

  const handleDownload = async () => {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${bondId}-certificate.png`
    a.click()
  }

  return (
    <div className="certificate-card">
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}
        <Image
          src={imageUrl}
          alt={metadata.name}
          fill
          className="object-contain"
          onLoad={() => setLoading(false)}
        />
      </div>
      
      <div className="mt-4 space-y-2">
        <h3 className="text-xl font-bold">{metadata.name}</h3>
        <p className="text-gray-600">{metadata.description}</p>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDownload}
            className="btn btn-primary"
          >
            📥 Download Certificate
          </button>
          
          <a
            href={imageUrl}
            target="_blank"
            className="btn btn-secondary"
          >
            🔗 View on IPFS
          </a>
          
          <a
            href={`https://testnet.arcscan.app/token/${contractAddress}/${tokenId}`}
            target="_blank"
            className="btn btn-secondary"
          >
            🔍 View on ARCScan
          </a>
        </div>
      </div>
      
      {/* Attributes */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {metadata.attributes.map((attr) => (
          <div key={attr.trait_type} className="border rounded p-3">
            <div className="text-sm text-gray-500">{attr.trait_type}</div>
            <div className="font-semibold">{attr.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 🔐 Privacy Considerations

### Public IPFS
- ✅ Anyone with the CID can view the image
- ✅ Good for transparency
- ✅ Standard for NFTs

### Private Certificates (Optional)
If you need private certificates:

```typescript
// Option 1: Encrypt before IPFS upload
import { encrypt } from './crypto'

const encryptedImage = encrypt(imageBuffer, subscriber.publicKey)
await uploadToIPFS(encryptedImage)

// Option 2: Use private storage + access tokens
const privateUrl = await uploadToS3(imageBuffer)
// Store private URL in DB, only accessible with auth token
```

## 🚀 Quick Implementation Checklist

For subscribers to see certificates:

- [ ] NFT contract deployed with `tokenURI` pointing to your API
- [ ] API endpoint `/v1/nft/bonds/{bond_id}/metadata.json` working
- [ ] IPFS images accessible via gateway
- [ ] Dashboard component to display certificates
- [ ] (Optional) Email notification system
- [ ] (Optional) PDF download feature

---

**Bottom line:** Subscribers see their certificates in:
1. **Your dashboard** (best UX - you control everything)
2. **Their wallet** (MetaMask, etc. - automatic)
3. **ARCScan** (block explorer - automatic)
4. **Direct IPFS link** (permanent, decentralized)

