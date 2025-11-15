# How to Make Certificate Images Show on ARCScan

## 🎯 The Problem You're Seeing

When you look at ARCScan, you see:
```
✅ NFT minted
✅ Transfer event
❌ No certificate image showing
```

**Why?** ARCScan needs your NFT contract to have a proper `tokenURI()` function that returns the metadata with the certificate image.

---

## ✅ Solution Steps

### Step 1: Deploy the NFT Contract

```bash
# Install dependencies
cd ARC-FX-Infrastructure-API
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Create hardhat config
npx hardhat init
```

**hardhat.config.js:**
```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    arcTestnet: {
      url: "https://rpc.testnet.arc.network",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 12345
    }
  }
};
```

**deploy.js:**
```javascript
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const ARCYieldBondNFT = await ethers.getContractFactory("ARCYieldBondNFT");
  
  // Deploy with your API URL as base
  const nft = await ARCYieldBondNFT.deploy(
    "ARC Yield Bond Certificate",
    "ARCBOND",
    "https://api.arcfx.finance/v1/nft" // Your API base URL
  );

  await nft.waitForDeployment();
  const address = await nft.getAddress();
  
  console.log("NFT Contract deployed to:", address);
  console.log("Save this address to your .env file!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

**Deploy:**
```bash
# Add to .env
DEPLOYER_PRIVATE_KEY=your_private_key

# Deploy
npx hardhat run scripts/deploy.js --network arcTestnet

# Output:
# NFT Contract deployed to: 0x1234...
```

---

### Step 2: Ensure Your API Metadata Endpoint Works

**Test your metadata endpoint:**

```bash
# Should return proper NFT metadata
curl https://api.arcfx.finance/v1/nft/bonds/bond_123/metadata.json
```

**Expected response:**
```json
{
  "name": "ARC Finance Bond — Q4 2025",
  "description": "A 90-day ARC bond...",
  "image": "ipfs://bafybeidxyauh3kc3n64f75jrzs5nqw6ucoj5zlbaqitbs3bfg3ci3mhooy",
  "external_url": "https://app.arcfx.finance/bonds/bond_123",
  "attributes": [
    {
      "trait_type": "Principal",
      "value": "1000 USDC"
    },
    {
      "trait_type": "Coupon Rate",
      "value": "5%"
    }
  ]
}
```

**Make sure your endpoint is working:**

```typescript
// src/routes/nft.ts - Already exists!
server.get("/v1/nft/bonds/:bond_id/metadata.json", async (request, reply) => {
  const { bond_id } = request.params
  
  // Fetch bond details from database
  const bond = await db.bonds.findOne({ id: bond_id })
  const nftImage = await db.bond_nft_images.findOne({ bond_id })
  
  return reply.send({
    name: `${bond.issuer_name} Bond — ${bond.series_name}`,
    description: `A ${bond.tenor_days}-day ARC bond...`,
    image: nftImage.ipfs_url, // ipfs://bafybei...
    external_url: `https://app.arcfx.finance/bonds/${bond_id}`,
    attributes: [
      { trait_type: "Bond ID", value: bond_id },
      { trait_type: "Principal", value: `${bond.principal} ${bond.currency}` },
      { trait_type: "Coupon Rate", value: `${bond.coupon_rate}%` },
      // ... more attributes
    ]
  })
})
```

---

### Step 3: Mint NFT with Proper Metadata Link

**When user subscribes to a bond:**

```typescript
// In your bond subscription handler
async function handleBondSubscription(bondId: string, userWallet: string, units: number) {
  // 1. Generate certificate image (you already have this!)
  const image = await generateCertificateImage({
    style: 'institutional',
    bond_id: bondId,
    fields: { /* bond details */ }
  })
  
  // 2. Upload to IPFS (you already have this!)
  const imageResult = await uploadImageToIPFS({
    bondId,
    buffer: Buffer.from(image.image_base64, 'base64'),
    filename: `${bondId}-certificate.png`
  })
  
  // 3. Upload metadata to IPFS (you already have this!)
  const metadata = {
    name: `Bond Certificate`,
    image: imageResult.ipfs_url,
    attributes: [/* ... */]
  }
  
  const metadataResult = await uploadMetadataToIPFS({
    metadata,
    filename: `${bondId}-metadata.json`
  })
  
  // 4. Save to database
  await db.bond_nft_images.insert({
    bond_id: bondId,
    image_cid: imageResult.cid,
    image_ipfs_url: imageResult.ipfs_url,
    metadata_cid: metadataResult.cid,
    metadata_ipfs_url: metadataResult.ipfs_url
  })
  
  // 5. Mint NFT to user
  const nftContract = new ethers.Contract(
    process.env.NFT_CONTRACT_ADDRESS,
    NFT_ABI,
    signer
  )
  
  // Option A: Use API endpoint (ARCScan will fetch from your API)
  const tx = await nftContract.mintCertificate(
    userWallet,
    bondId,
    units
  )
  await tx.wait()
  
  // Option B: Use direct IPFS link (more decentralized)
  const tokenId = await nftContract.nextTokenId() - 1n
  await nftContract.setTokenURI(tokenId, metadataResult.ipfs_url)
  
  console.log('NFT minted! ARCScan will show certificate image.')
}
```

---

### Step 4: Verify on ARCScan

**After minting, ARCScan will:**

1. **Detect the NFT mint** ✅ (You already see this!)
2. **Call `tokenURI(tokenId)`** on your contract
3. **Fetch metadata from the URL returned**
4. **Read the `image` field**
5. **Display the certificate image** 🎨

**To check if it's working:**

```bash
# 1. Get the token ID from the transaction
# 2. Call tokenURI directly
cast call $NFT_CONTRACT_ADDRESS "tokenURI(uint256)(string)" $TOKEN_ID --rpc-url https://rpc.testnet.arc.network

# Output should be:
# https://api.arcfx.finance/v1/nft/bonds/bond_123/metadata.json
# or
# ipfs://bafybeicbqcxooajckted75kayku5lmkk2adjic2ygdqncdl7abq6wvsqfq
```

---

## 🚀 Quick Fix for Your Current NFT

If your NFT is already minted but doesn't show the image:

### Option 1: Add `setTokenURI` to Your Contract

```solidity
function setTokenURI(uint256 tokenId, string memory uri) external onlyOwner {
    _tokenURIs[tokenId] = uri;
}
```

Then call it:
```typescript
await nftContract.setTokenURI(
  tokenId,
  "ipfs://bafybeicbqcxooajckted75kayku5lmkk2adjic2ygdqncdl7abq6wvsqfq"
)
```

### Option 2: Update `tokenURI` Function

Redeploy with proper `tokenURI` that returns metadata URL:

```solidity
function tokenURI(uint256 tokenId) public view override returns (string memory) {
    // Return your API endpoint or IPFS link
    return string(abi.encodePacked(
        baseMetadataURI,
        "/bonds/",
        positions[tokenId].bondId,
        "/metadata.json"
    ));
}
```

---

## 🎨 What ARCScan Needs

ARCScan displays NFT images if your contract has:

```solidity
// ✅ REQUIRED: tokenURI function
function tokenURI(uint256 tokenId) public view returns (string memory) {
    return "https://api.arcfx.finance/v1/nft/bonds/bond_123/metadata.json";
    // or
    return "ipfs://bafybeicbqcxooajckted75kayku5lmkk2adjic2ygdqncdl7abq6wvsqfq";
}
```

That URL must return JSON with:
```json
{
  "image": "ipfs://bafybeidxyauh3kc3n64f75jrzs5nqw6ucoj5zlbaqitbs3bfg3ci3mhooy",
  "name": "Bond Certificate",
  "attributes": [...]
}
```

---

## 📱 Testing the Complete Flow

```bash
# 1. Deploy NFT contract
npx hardhat run scripts/deploy.js --network arcTestnet

# 2. Test metadata endpoint
curl https://api.arcfx.finance/v1/nft/bonds/bond_123/metadata.json

# 3. Mint an NFT
# (Your subscription code does this)

# 4. Check on ARCScan
# Go to: https://testnet.arcscan.app/address/YOUR_WALLET
# Click on the NFT
# You should see the certificate image! 🎨
```

---

## 🎯 Expected Result on ARCScan

Once properly configured, ARCScan will show:

```
[Certificate Image Preview]

ARC Finance Bond — Q4 2025
Token ID: #123
Contract: 0x1234...

Attributes:
- Principal: 1000 USDC
- Coupon Rate: 5%
- Tenor: 90 Days
- Issuer: ARC Finance

[View Metadata] [View on IPFS]
```

---

## ✅ Checklist

To make certificates show on ARCScan:

- [ ] NFT contract deployed with `tokenURI()` function
- [ ] `tokenURI()` returns proper metadata URL or IPFS link
- [ ] Metadata endpoint returns JSON with `image` field
- [ ] `image` field contains IPFS URL of certificate
- [ ] IPFS URL is accessible via gateway
- [ ] Certificate image uploaded to Storacha
- [ ] Metadata uploaded to Storacha (optional)

**Once all checked, ARCScan will automatically display your certificate images!** 🎉

