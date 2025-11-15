#!/bin/bash

# Arc Network NFT Contract Deployment Script
# This script deploys the ARCYieldBondNFT contract to Arc Testnet

set -e  # Exit on error

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🚀 ARC Yield Bond NFT - Deployment Script              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Foundry is installed
if ! command -v forge &> /dev/null; then
    echo -e "${RED}❌ Foundry not found. Installing...${NC}"
    echo ""
    curl -L https://foundry.paradigm.xyz | bash
    source ~/.bashrc || source ~/.zshrc
    foundryup
    echo -e "${GREEN}✅ Foundry installed!${NC}"
    echo ""
fi

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo -e "${YELLOW}⚠️  No .env file found${NC}"
    echo ""
    echo "Creating .env file..."
    cat > .env << EOF
# Arc Network Configuration
ARC_TESTNET_RPC_URL="https://rpc.testnet.arc.network"

# Deployer wallet private key (get testnet USDC from https://faucet.circle.com)
PRIVATE_KEY=""

# Your API base URL for NFT metadata
BASE_METADATA_URI="https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft"

# After deployment, will be filled automatically
NFT_CONTRACT_ADDRESS=""
EOF
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo ""
fi

# Check if private key is set
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${YELLOW}⚠️  No private key found in .env${NC}"
    echo ""
    echo "Generating a new wallet..."
    cast wallet new
    echo ""
    echo -e "${YELLOW}📝 Please:${NC}"
    echo "1. Copy the Private Key above"
    echo "2. Add it to .env file as: PRIVATE_KEY=\"0x...\""
    echo "3. Get testnet USDC from: https://faucet.circle.com (select Arc Testnet)"
    echo "4. Run this script again"
    echo ""
    exit 0
fi

# Set default RPC URL if not set
if [ -z "$ARC_TESTNET_RPC_URL" ]; then
    ARC_TESTNET_RPC_URL="https://rpc.testnet.arc.network"
fi

# Set default base metadata URI if not set
if [ -z "$BASE_METADATA_URI" ]; then
    BASE_METADATA_URI="https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft"
fi

# Get deployer address
DEPLOYER=$(cast wallet address $PRIVATE_KEY)
echo -e "${GREEN}📝 Deployer Address:${NC} $DEPLOYER"

# Check balance
BALANCE=$(cast balance $DEPLOYER --rpc-url $ARC_TESTNET_RPC_URL)
BALANCE_USDC=$(cast --from-wei $BALANCE)
echo -e "${GREEN}💰 Balance:${NC} $BALANCE_USDC USDC"
echo ""

if [ "$BALANCE" = "0" ]; then
    echo -e "${RED}❌ No balance! Get testnet USDC from:${NC}"
    echo "   https://faucet.circle.com (select Arc Testnet)"
    echo "   Wallet: $DEPLOYER"
    echo ""
    exit 1
fi

# Install OpenZeppelin contracts if not installed
if [ ! -d "lib/openzeppelin-contracts" ]; then
    echo -e "${YELLOW}📦 Installing OpenZeppelin contracts...${NC}"
    forge install OpenZeppelin/openzeppelin-contracts --no-commit
    echo ""
fi

# Contract parameters
NAME="ARC Yield Bond Certificate"
SYMBOL="ARCBOND"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  📋 Contract Parameters                                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Name:              $NAME"
echo "Symbol:            $SYMBOL"
echo "Base Metadata URI: $BASE_METADATA_URI"
echo "Network:           Arc Testnet"
echo "RPC URL:           $ARC_TESTNET_RPC_URL"
echo ""

# Deploy the contract
echo -e "${YELLOW}⏳ Deploying contract...${NC}"
echo ""

DEPLOY_OUTPUT=$(forge create ARCYieldBondNFT.sol:ARCYieldBondNFT \
    --rpc-url $ARC_TESTNET_RPC_URL \
    --private-key $PRIVATE_KEY \
    --constructor-args "$NAME" "$SYMBOL" "$BASE_METADATA_URI" \
    2>&1)

echo "$DEPLOY_OUTPUT"

# Extract contract address
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
TX_HASH=$(echo "$DEPLOY_OUTPUT" | grep "Transaction hash:" | awk '{print $3}')

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOYMENT SUCCESSFUL!                               ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📍 Contract Address:${NC} $CONTRACT_ADDRESS"
echo -e "${GREEN}🔗 Transaction Hash:${NC} $TX_HASH"
echo ""

# Update .env file with contract address
if [ "$(uname)" = "Darwin" ]; then
    # macOS
    sed -i '' "s|NFT_CONTRACT_ADDRESS=\".*\"|NFT_CONTRACT_ADDRESS=\"$CONTRACT_ADDRESS\"|" .env
else
    # Linux
    sed -i "s|NFT_CONTRACT_ADDRESS=\".*\"|NFT_CONTRACT_ADDRESS=\"$CONTRACT_ADDRESS\"|" .env
fi

echo -e "${GREEN}✅ Updated .env with contract address${NC}"
echo ""

# Save deployment info
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
cat > deployment-info.json << EOF
{
  "network": "arc-testnet",
  "contractAddress": "$CONTRACT_ADDRESS",
  "transactionHash": "$TX_HASH",
  "deployer": "$DEPLOYER",
  "name": "$NAME",
  "symbol": "$SYMBOL",
  "baseMetadataURI": "$BASE_METADATA_URI",
  "deployedAt": "$TIMESTAMP"
}
EOF

echo -e "${GREEN}💾 Saved deployment info to deployment-info.json${NC}"
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🎯 Next Steps                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "1️⃣  Add to your backend .env:"
echo "   NFT_CONTRACT_ADDRESS=$CONTRACT_ADDRESS"
echo ""
echo "2️⃣  View on ARCScan:"
echo "   https://testnet.arcscan.app/address/$CONTRACT_ADDRESS"
echo ""
echo "3️⃣  View transaction:"
echo "   https://testnet.arcscan.app/tx/$TX_HASH"
echo ""
echo "4️⃣  Test the contract:"
echo "   cast call $CONTRACT_ADDRESS \"name()(string)\" --rpc-url $ARC_TESTNET_RPC_URL"
echo ""
echo "5️⃣  Set bond contract (that can mint NFTs):"
echo "   cast send $CONTRACT_ADDRESS \"setBondContract(address)\" YOUR_BOND_CONTRACT --private-key \$PRIVATE_KEY --rpc-url $ARC_TESTNET_RPC_URL"
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🎉 Your NFT contract is live on Arc Testnet!           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

