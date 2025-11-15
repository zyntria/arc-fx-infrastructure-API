#!/bin/bash

echo "🎨 Testing NFT Certificate Minting with Real Image Generation"
echo "=============================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:4000"
WALLET="0x93175587C8F2d8120c82B03BD105ACe3248E2941"
BOND_ID="bond_$(date +%s)"

echo -e "${BLUE}Step 1: Check NFT Contract Info${NC}"
echo "================================================"
curl -s "$API_URL/v1/nft/test/info" | jq '.'
echo ""

echo -e "${BLUE}Step 2: Mint NFT with Certificate Image${NC}"
echo "================================================"
echo "Bond ID: $BOND_ID"
echo "Wallet: $WALLET"
echo ""
echo "⏳ This will take 30-60 seconds (OpenAI + IPFS upload)..."
echo ""

MINT_RESPONSE=$(curl -s -X POST "$API_URL/v1/nft/test/mint" \
  -H "Content-Type: application/json" \
  -d "{
    \"wallet_address\": \"$WALLET\",
    \"bond_id\": \"$BOND_ID\",
    \"units\": 5000,
    \"generate_image\": true
  }")

echo "$MINT_RESPONSE" | jq '.'

# Extract values
SUCCESS=$(echo "$MINT_RESPONSE" | jq -r '.success')
TOKEN_ID=$(echo "$MINT_RESPONSE" | jq -r '.token_id')
TX_HASH=$(echo "$MINT_RESPONSE" | jq -r '.tx_hash')
NFT_URL=$(echo "$MINT_RESPONSE" | jq -r '.arcscan_nft_url')
IMAGE_URL=$(echo "$MINT_RESPONSE" | jq -r '.image_url')

echo ""

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ NFT Minted Successfully!${NC}"
  echo ""
  echo -e "${YELLOW}📋 Certificate Details:${NC}"
  echo "  Token ID: $TOKEN_ID"
  echo "  Bond ID: $BOND_ID"
  echo "  Transaction: $TX_HASH"
  echo ""
  echo -e "${YELLOW}🖼️  Certificate Image:${NC}"
  echo "  IPFS: $IMAGE_URL"
  echo ""
  echo -e "${YELLOW}🌐 View on ARCScan:${NC}"
  echo "  $NFT_URL"
  echo ""
  
  echo -e "${BLUE}Step 3: Verify All Your NFTs${NC}"
  echo "================================================"
  curl -s "$API_URL/v1/nft/test/tokens/$WALLET" | jq '.'
  echo ""
  
  echo -e "${GREEN}✨ Test Complete!${NC}"
  echo ""
  echo "Open in browser: $NFT_URL"
else
  echo -e "${YELLOW}⚠️  Minting failed - check server logs${NC}"
fi

