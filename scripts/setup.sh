#!/bin/bash

# Setup script for Zcash-Mina Bridge
# Installs dependencies and prepares the environment

set -e

echo "╔════════════════════════════════════════════╗"
echo "║   Zcash-Mina Bridge Setup                 ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Bun is installed
echo -e "${BLUE}Checking for Bun...${NC}"
if ! command -v bun &> /dev/null; then
    echo -e "${YELLOW}Bun not found. Installing...${NC}"
    curl -fsSL https://bun.sh/install | bash
    
    # Add to PATH
    export PATH="$HOME/.bun/bin:$PATH"
    
    echo -e "${GREEN}✅ Bun installed${NC}"
else
    echo -e "${GREEN}✅ Bun is already installed${NC}"
    bun --version
fi
echo ""

# Install root dependencies
echo -e "${BLUE}Installing root dependencies...${NC}"
bun install
echo -e "${GREEN}✅ Root dependencies installed${NC}"
echo ""

# Install zcash-sim dependencies
echo -e "${BLUE}Installing zcash-sim dependencies...${NC}"
cd zcash-sim
bun install
cd ..
echo -e "${GREEN}✅ zcash-sim dependencies installed${NC}"
echo ""

# Install relayer dependencies
echo -e "${BLUE}Installing relayer dependencies...${NC}"
cd relayer
bun install
cd ..
echo -e "${GREEN}✅ relayer dependencies installed${NC}"
echo ""

# Install mina-snark dependencies
echo -e "${BLUE}Installing mina-snark dependencies...${NC}"
cd mina-snark
bun install
cd ..
echo -e "${GREEN}✅ mina-snark dependencies installed${NC}"
echo ""

# Create .env files if they don't exist
echo -e "${BLUE}Setting up environment files...${NC}"

if [ ! -f zcash-sim/.env ]; then
    cp zcash-sim/.env.example zcash-sim/.env 2>/dev/null || echo "PORT=3000
MERKLE_DEPTH=32" > zcash-sim/.env
    echo -e "${GREEN}✅ Created zcash-sim/.env${NC}"
fi

if [ ! -f relayer/.env ]; then
    cp relayer/.env.example relayer/.env 2>/dev/null || echo "ZCASH_RPC_URL=http://localhost:3000
MINA_ENDPOINT=http://localhost:8080
POLL_INTERVAL=5000
BATCH_SIZE=10" > relayer/.env
    echo -e "${GREEN}✅ Created relayer/.env${NC}"
fi

echo ""

# Run tests
echo -e "${BLUE}Running tests...${NC}"
echo ""

echo "Testing zcash-sim..."
cd zcash-sim
bun test
cd ..
echo -e "${GREEN}✅ zcash-sim tests passed${NC}"
echo ""

echo "Testing relayer..."
cd relayer
bun test
cd ..
echo -e "${GREEN}✅ relayer tests passed${NC}"
echo ""

echo "Testing mina-snark..."
cd mina-snark
bun test
cd ..
echo -e "${GREEN}✅ mina-snark tests passed${NC}"
echo ""

# Make scripts executable
chmod +x scripts/*.sh

echo "════════════════════════════════════════════"
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo "════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo ""
echo "1. Start Zcash simulator:"
echo "   cd zcash-sim && bun run dev"
echo ""
echo "2. In another terminal, run the demo:"
echo "   ./scripts/demo.sh"
echo ""
echo "3. Or run the E2E test:"
echo "   bun run test:e2e"
echo ""
echo "4. Read the documentation:"
echo "   cat README.md"
echo "   cat QUICKSTART.md"
echo ""
echo "Happy bridging! 🌉"
echo ""

