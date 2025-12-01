#!/bin/bash

# Demo script for Zcash-Mina Bridge
# Shows the complete bridge flow

set -e

echo "╔════════════════════════════════════════════╗"
echo "║   Zcash-Mina Bridge Demo                  ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Zcash simulator is running
echo -e "${BLUE}Checking Zcash simulator...${NC}"
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${YELLOW}⚠️  Zcash simulator not running!${NC}"
    echo "Please start it in another terminal:"
    echo "  cd zcash-sim && bun run dev"
    exit 1
fi
echo -e "${GREEN}✅ Zcash simulator is running${NC}"
echo ""

# Generate random commitment
COMMITMENT="0x$(openssl rand -hex 32)"

echo -e "${BLUE}Step 1: Creating Zcash deposit${NC}"
echo "Commitment: $COMMITMENT"
echo ""

# Create deposit
DEPOSIT_RESPONSE=$(curl -s -X POST http://localhost:3000/deposit \
  -H "Content-Type: application/json" \
  -d "{\"commitment\": \"$COMMITMENT\"}")

echo "Response:"
echo "$DEPOSIT_RESPONSE" | jq '.'
echo ""

# Extract data
INDEX=$(echo "$DEPOSIT_RESPONSE" | jq -r '.index')
ROOT=$(echo "$DEPOSIT_RESPONSE" | jq -r '.root')

echo -e "${GREEN}✅ Deposit created at index $INDEX${NC}"
echo ""

sleep 1

echo -e "${BLUE}Step 2: Fetching Merkle proof${NC}"
PROOF_RESPONSE=$(curl -s "http://localhost:3000/merkle-proof/$COMMITMENT")

echo "Proof received:"
echo "$PROOF_RESPONSE" | jq '.proof | {leaf, index, root, pathLength: (.path | length)}'
echo ""

echo -e "${GREEN}✅ Merkle proof generated${NC}"
echo ""

sleep 1

echo -e "${BLUE}Step 3: Verifying proof locally${NC}"
VERIFY_RESPONSE=$(curl -s -X POST http://localhost:3000/verify-proof \
  -H "Content-Type: application/json" \
  -d "{\"proof\": $(echo "$PROOF_RESPONSE" | jq '.proof')}")

echo "Verification result:"
echo "$VERIFY_RESPONSE" | jq '.'
echo ""

if [ "$(echo "$VERIFY_RESPONSE" | jq -r '.valid')" = "true" ]; then
    echo -e "${GREEN}✅ Proof verified successfully${NC}"
else
    echo -e "${YELLOW}❌ Proof verification failed${NC}"
    exit 1
fi
echo ""

sleep 1

echo -e "${BLUE}Step 4: Simulating recursive SNARK generation${NC}"
echo "In production: MerkleProofProgram.verifyProof()"
sleep 2
echo -e "${GREEN}✅ Recursive SNARK generated (simulated)${NC}"
echo ""

sleep 1

echo -e "${BLUE}Step 5: Simulating Mina submission${NC}"
echo "In production: zkApp.verifyAndMint()"
sleep 2
MOCK_TX_HASH="0x$(openssl rand -hex 32)"
echo "Transaction hash: $MOCK_TX_HASH"
echo -e "${GREEN}✅ Proof submitted to Mina (simulated)${NC}"
echo ""

sleep 1

echo -e "${BLUE}Step 6: Getting tree info${NC}"
TREE_INFO=$(curl -s http://localhost:3000/tree-info)
echo "$TREE_INFO" | jq '.'
echo ""

echo "════════════════════════════════════════════"
echo -e "${GREEN}🎉 Demo completed successfully!${NC}"
echo "════════════════════════════════════════════"
echo ""
echo "Summary:"
echo "  • Created deposit with commitment"
echo "  • Generated Merkle inclusion proof"
echo "  • Verified proof locally"
echo "  • Generated recursive zkSNARK"
echo "  • Submitted to Mina zkApp"
echo ""
echo "Next steps:"
echo "  • Run: bun run test:e2e"
echo "  • Start relayer: cd relayer && bun run dev"
echo "  • Read docs: cat README.md"
echo ""

