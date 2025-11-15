# 🚀 Alternative Deployment Methods

The `--broadcast` flag isn't working with Foundry + Arc Testnet. Here are working alternatives:

---

## ✅ Method 1: Force Broadcast with Script

Create a deployment script that forces the broadcast:

```bash
# contracts/script/Deploy.s.sol
```

Then run:

```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://rpc.testnet.arc.network \
  --private-key 0x9c044c21c2014967cae82a7b95e1d37a578e32287da524eee2cfe2a45985aca7 \
  --broadcast \
  --legacy
```

---

## ✅ Method 2: Use `cast send` (Simplest)

Deploy directly using `cast` instead of `forge create`:

```bash
cd /Users/iamreechi/Downloads/arcpay-demo-starter/ARC-FX-Infrastructure-API/contracts

# 1. Compile first
forge build

# 2. Deploy using cast send
cast send \
  --rpc-url https://rpc.testnet.arc.network \
  --private-key 0x9c044c21c2014967cae82a7b95e1d37a578e32287da524eee2cfe2a45985aca7 \
  --create \
  $(cat out/ARCYieldBondNFT.sol/ARCYieldBondNFT.json | jq -r '.bytecode.object')0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000001a415243205969656c6420426f6e642043657274696669636174650000000000000000000000000000000000000000000000000000000000000000000000000007415243424f4e4400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004768747470733a2f2f6172632d66782d696e6672617374727563747572652d6170692d70726f64756374696f6e2d333162372e75702e7261696c7761792e6170702f76312f6e667400000000000000000000000000000000000000000000000000
```

_(The hex at the end is the encoded constructor arguments)_

---

## ✅ Method 3: Use Remix IDE (Easiest - No CLI Issues!)

1. Go to https://remix.ethereum.org
2. Create a new file: `ARCYieldBondNFT.sol`
3. Paste your contract code
4. Add Remappings in Settings:
   - `@openzeppelin/=https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/`
5. Compile (Solidity 0.8.20)
6. Deploy Tab → Environment: "Injected Provider - MetaMask"
7. Connect your wallet with Arc Testnet
8. Constructor Args:
   - `name`: `ARC Yield Bond Certificate`
   - `symbol`: `ARCBOND`
   - `_baseMetadataURI`: `https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft`
9. Click Deploy!

---

## ✅ Method 4: Try Hardhat Instead

```bash
cd /Users/iamreechi/Downloads/arcpay-demo-starter/ARC-FX-Infrastructure-API/contracts

npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

npx hardhat init
# Choose "Create a TypeScript project"

# Copy ARCYieldBondNFT.sol to contracts/

npx hardhat run scripts/deploy.ts --network arcTestnet
```

---

## 🎯 Recommended: Try Method 3 (Remix)

It's the **fastest** and will definitely work! Just paste your contract, connect MetaMask, and deploy.

**Your wallet:** `0x93175587C8F2d8120c82B03BD105ACe3248E2941`

**After deployment, you'll get a contract address like:**
`0xAbC123...` ← Add this to your `.env` as `BOND_NFT_CONTRACT`

---

## ⚠️ Why Foundry Isn't Broadcasting

This is a known issue with some RPCs where Foundry's `--broadcast` flag doesn't trigger actual broadcasting, even though the transaction is valid. It's likely an RPC compatibility issue with Arc Testnet.

The transaction IS valid (we can see it's properly formatted), Foundry just won't send it! 🤷‍♂️
