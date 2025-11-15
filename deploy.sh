#!/bin/bash

# ARC-FX Smart Contract Deployment Script
# This script deploys ARCfxSettlement and ARCfxPayouts to ARC Network

set -e  # Exit on error

echo "🚀 ARC-FX Smart Contract Deployment"
echo "===================================="
echo ""

# Load environment variables from .env
if [ -f .env ]; then
    echo "📄 Loading .env file..."
    export $(cat .env | grep -v '^#' | grep -v '^\s*$' | xargs)
else
    echo "❌ Error: .env file not found!"
    echo "Please copy env.example to .env and configure it."
    exit 1
fi

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env file"
    echo ""
    echo "To deploy contracts, you need:"
    echo "1. A wallet private key (with 0x prefix)"
    echo "2. Testnet funds on ARC Network"
    echo ""
    echo "Add to your .env file:"
    echo "PRIVATE_KEY=0xyour_private_key_here"
    echo ""
    exit 1
fi

# Check if ARC_RPC_URL is set
if [ -z "$ARC_RPC_URL" ]; then
    echo "⚠️  ARC_RPC_URL not set, using default..."
    export ARC_RPC_URL="https://rpc.testnet.arc.network"
fi

echo "📡 RPC URL: $ARC_RPC_URL"
echo "🔑 Private key found"
echo ""

# Compile contracts first
echo "🔨 Compiling contracts..."
forge build

if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

echo "✅ Compilation successful"
echo ""

# Deploy contracts
echo "🚀 Deploying contracts to ARC Network..."
echo ""

# Use --private-key flag directly (recommended by ARC docs)
forge script script/Deploy.s.sol \
    --rpc-url $ARC_RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --legacy

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "Common issues:"
    echo "1. Insufficient funds in your wallet"
    echo "2. Invalid private key"
    echo "3. RPC URL not accessible"
    echo ""
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the contract addresses from the output above"
echo "2. Update your .env file with:"
echo "   CONTRACT_SETTLEMENT=0x..."
echo "   CONTRACT_PAYOUTS=0x..."
echo "3. Restart your API server: npm run dev"
echo ""

