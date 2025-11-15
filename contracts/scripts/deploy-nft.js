const hre = require("hardhat");

async function main() {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║  🚀 Deploying ARC Yield Bond NFT Certificate Contract   ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Contract parameters
  const NAME = "ARC Yield Bond Certificate";
  const SYMBOL = "ARCBOND";
  
  // Your API base URL (change this to your actual URL)
  const BASE_METADATA_URI = process.env.BASE_METADATA_URI || 
    "https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft";
  
  console.log("📋 Contract Parameters:");
  console.log("   Name:", NAME);
  console.log("   Symbol:", SYMBOL);
  console.log("   Base Metadata URI:", BASE_METADATA_URI);
  console.log("");

  // Deploy the contract
  console.log("⏳ Deploying ARCYieldBondNFT contract...\n");
  
  const ARCYieldBondNFT = await hre.ethers.getContractFactory("ARCYieldBondNFT");
  const nft = await ARCYieldBondNFT.deploy(NAME, SYMBOL, BASE_METADATA_URI);

  await nft.waitForDeployment();
  const contractAddress = await nft.getAddress();
  
  console.log("✅ Contract deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployer.address,
    name: NAME,
    symbol: SYMBOL,
    baseMetadataURI: BASE_METADATA_URI,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║  📦 DEPLOYMENT COMPLETE                                  ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");
  
  console.log("🎯 Next Steps:");
  console.log("");
  console.log("1️⃣  Add to your .env file:");
  console.log(`   NFT_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("");
  console.log("2️⃣  Verify contract on ARCScan (optional):");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${contractAddress} "${NAME}" "${SYMBOL}" "${BASE_METADATA_URI}"`);
  console.log("");
  console.log("3️⃣  Set bond contract address (that can mint):");
  console.log(`   Call setBondContract(YOUR_BOND_CONTRACT_ADDRESS)`);
  console.log("");
  console.log("4️⃣  Test minting:");
  console.log(`   Call mintCertificate(USER_WALLET, "bond_123", 10)`);
  console.log("");
  console.log("5️⃣  View on ARCScan:");
  console.log(`   https://testnet.arcscan.app/address/${contractAddress}`);
  console.log("");
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║  ✅ Save this contract address to your backend!          ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  // Save to file for reference
  const fs = require('fs');
  const path = require('path');
  
  const deploymentPath = path.join(__dirname, '../deployments.json');
  let deployments = {};
  
  if (fs.existsSync(deploymentPath)) {
    deployments = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  }
  
  if (!deployments[hre.network.name]) {
    deployments[hre.network.name] = [];
  }
  
  deployments[hre.network.name].push(deploymentInfo);
  
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deployments, null, 2)
  );
  
  console.log("💾 Deployment info saved to contracts/deployments.json\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

