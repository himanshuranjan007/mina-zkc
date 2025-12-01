# 🎯 Step-by-Step Deployment Plan

## Overview

We'll deploy in 3 phases:
1. **Phase 1**: Deploy contracts to testnets
2. **Phase 2**: Run relayer locally and test
3. **Phase 3**: Deploy relayer to Railway

---

## 📋 What Gets Deployed Where

### **Mina Testnet (Berkeley)**
✅ **Deploy**: `ZcashBridge` smart contract (zkApp)
- Verifies Merkle proofs
- Manages bridge state
- Mints wrapped tokens

### **Zcash Testnet**
❌ **No contract deployment needed!**
- Zcash doesn't use smart contracts
- We just watch the existing blockchain
- Monitor shielded transactions

### **Relayer**
🏠 **Runs locally first** (your computer)
- Watches Zcash testnet
- Generates proofs
- Submits to Mina zkApp

---

## 🚀 Phase 1: Deploy Contracts (30 minutes)

### Step 1.1: Deploy Mina zkApp Contract

#### Generate Keys
```bash
cd mina-snark
bun run generate-keys
```

**Output**:
```
🔑 Generating Mina keys for deployment...

✅ Keys saved to keys.json

═══════════════════════════════════════════════════════════
📝 DEPLOYER ADDRESS (fund this with testnet MINA):
   B62qr4QZ8kM9K7VVV... (example)

📝 ZKAPP ADDRESS (your bridge contract):
   B62qs9DKqP3nL8WW... (example)
═══════════════════════════════════════════════════════════

💰 Next steps:
   1. Go to: https://faucet.minaprotocol.com/
   2. Paste deployer address and request testnet MINA
   3. Wait for confirmation (~3 minutes)
   4. Run: bun run deploy
```

#### Get Testnet MINA
1. Copy the **DEPLOYER ADDRESS** from above
2. Visit: https://faucet.minaprotocol.com/
3. Paste your address
4. Click "Request Testnet MINA"
5. Wait 2-3 minutes

**Verify you received MINA**:
```bash
# Check balance on explorer
https://minascan.io/berkeley/account/YOUR_DEPLOYER_ADDRESS
```

#### Deploy the Contract
```bash
bun run deploy
```

**Expected output**:
```
🚀 Deploying ZcashBridge to Mina Berkeley Testnet

🔑 Loading keys...
   ✅ Keys loaded

🌐 Connecting to Berkeley testnet...
   ✅ Connected to Berkeley

📍 Addresses:
   Deployer: B62qr4QZ8kM9K7VVV...
   zkApp: B62qs9DKqP3nL8WW...

💰 Checking deployer balance...
   Balance: 10 MINA

🔧 Compiling ZcashBridge contract...
   (This may take 30-60 seconds)
   ✅ Compilation complete (45.2s)

📤 Creating deployment transaction...
   🔐 Generating proof...
   ✅ Proof generated (12.3s)
   ✍️  Signing transaction...
   ✅ Transaction sent!

⏳ Waiting for confirmation...
   Transaction hash: 5JuE7...

✅ Deployment info saved to deployment.json

═══════════════════════════════════════════════════════════
🎉 DEPLOYMENT SUCCESSFUL!
═══════════════════════════════════════════════════════════

📍 Contract Address:
   B62qs9DKqP3nL8WW...

🔍 View on Explorer:
   https://minascan.io/berkeley/account/B62qs9DKqP3nL8WW...
```

**Save this info**:
- Copy the **zkApp address**
- Save `deployment.json` file
- Bookmark the explorer link

✅ **Mina contract deployed!**

### Step 1.2: Zcash Testnet Setup

**No contract deployment needed!** Zcash doesn't use smart contracts.

Instead, we'll:
1. Use public Zcash testnet RPC
2. Watch existing blockchain
3. Monitor for shielded transactions

**Setup Zcash access**:

Create `relayer/.env`:
```bash
# Zcash Testnet Configuration
ZCASH_RPC_URL=http://127.0.0.1:18232
ZCASH_RPC_USER=zcashbridge
ZCASH_RPC_PASSWORD=your_password_here
ZCASH_NETWORK=testnet

# Mina Configuration (from deployment)
MINA_ENDPOINT=https://api.minascan.io/node/berkeley/v1/graphql
MINA_ARCHIVE=https://api.minascan.io/archive/berkeley/v1/graphql
ZKAPP_ADDRESS=B62qs9DKqP3nL8WW...  # Your deployed zkApp address
DEPLOYER_KEY=EKE...  # From keys.json

# Relayer Configuration
POLL_INTERVAL=60000
BATCH_SIZE=10
LOG_LEVEL=info
```

**Option A: Use Public Testnet RPC** (Easiest)
```bash
# No setup needed! Just use public endpoints
# Update .env with:
ZCASH_RPC_URL=https://testnet.z.cash/rpc
ZCASH_RPC_USER=public
ZCASH_RPC_PASSWORD=public
```

**Option B: Run Your Own Node** (More control)
```bash
# Download Zcash
wget https://z.cash/downloads/zcash-5.7.0-linux64.tar.gz
tar -xvf zcash-5.7.0-linux64.tar.gz

# Configure
mkdir -p ~/.zcash
cat > ~/.zcash/zcash.conf << EOF
testnet=1
rpcuser=zcashbridge
rpcpassword=$(openssl rand -hex 32)
rpcallowip=127.0.0.1
server=1
txindex=1
EOF

# Start node
./zcash-5.7.0/bin/zcashd -daemon

# Check sync status (takes 2-4 hours)
./zcash-5.7.0/bin/zcash-cli -testnet getblockchaininfo
```

✅ **Zcash access configured!**

---

## 🧪 Phase 2: Test Locally (1 hour)

### Step 2.1: Update Relayer for Real Blockchains

The relayer needs to connect to real Zcash instead of simulator.

**Update `relayer/src/index.ts`**:

```typescript
// At the top, add:
import { createZcashClient } from './zcash-client';

// In BridgeRelayer class, replace simulator watcher with:
async initialize() {
  console.log('🚀 Initializing Bridge Relayer...\n');

  // Initialize Zcash client
  console.log('1️⃣ Connecting to Zcash testnet...');
  const zcashClient = createZcashClient();
  const isHealthy = await zcashClient.healthCheck();
  
  if (!isHealthy) {
    throw new Error('Zcash node not reachable');
  }
  
  const network = await zcashClient.getNetworkInfo();
  console.log(`✅ Connected to Zcash ${network}\n`);

  // Initialize proof generator
  console.log('2️⃣ Initializing proof generator...');
  await this.prover.initialize();
  console.log('✅ Proof generator ready\n');

  // Initialize Mina submitter
  console.log('3️⃣ Initializing Mina submitter...');
  await this.submitter.initialize();
  console.log('✅ Mina submitter ready\n');

  // Start watching Zcash
  console.log('4️⃣ Starting Zcash watcher...');
  await zcashClient.watchBlocks(async (blockHeight, commitments) => {
    for (const commitment of commitments) {
      await this.processCommitment(commitment);
    }
  });
}
```

### Step 2.2: Run Relayer Locally

```bash
cd relayer

# Install dependencies
bun install

# Check configuration
cat .env

# Start relayer
bun run dev
```

**Expected output**:
```
╔════════════════════════════════════════════╗
║   Bridge Relayer - Zcash ↔ Mina           ║
╚════════════════════════════════════════════╝

Configuration:
  Zcash RPC: http://127.0.0.1:18232
  Mina Endpoint: https://api.minascan.io/node/berkeley/v1/graphql
  zkApp: B62qs9DKqP3nL8WW...
  Poll Interval: 60000ms

🚀 Initializing Bridge Relayer...

1️⃣ Connecting to Zcash testnet...
✅ Connected to Zcash test

2️⃣ Initializing proof generator...
✅ Proof generator ready

3️⃣ Initializing Mina submitter...
✅ Connected to Mina Berkeley
✅ Mina submitter ready

4️⃣ Starting Zcash watcher...
👀 Watching Zcash test from block 2845123

✅ Relayer is running!

Monitoring Zcash for deposits...
Press Ctrl+C to stop
```

✅ **Relayer running locally!**

### Step 2.3: Create Test Transaction

Now create a real Zcash testnet transaction to test the bridge.

#### Option A: Using Zecwallet Lite (Easiest)

1. **Download Zecwallet**:
   - Visit: https://www.zecwallet.co/
   - Download Zecwallet Lite
   - Install and open

2. **Switch to Testnet**:
   - Settings → Network → Testnet
   - Restart wallet

3. **Get Testnet ZEC**:
   - Copy your z-address (starts with `ztestsapling...`)
   - Visit: https://faucet.testnet.z.cash/
   - Paste address and request
   - Wait 2-3 minutes

4. **Send to Bridge**:
   - Click "Send"
   - To: `ztestsapling1...` (bridge address)
   - Amount: 0.01 ZEC
   - Memo: "Bridge test"
   - Send

#### Option B: Using Zcash CLI

```bash
# Create z-address
zcash-cli -testnet z_getnewaddress sapling

# Get testnet ZEC
# Visit: https://faucet.testnet.z.cash/

# Check balance
zcash-cli -testnet z_getbalance "your_z_address"

# Send to bridge
zcash-cli -testnet z_sendmany \
  "your_z_address" \
  '[{"address":"bridge_z_address","amount":0.01,"memo":"test"}]'
```

### Step 2.4: Watch Relayer Process Transaction

In your relayer terminal, you should see:

```
📦 New block detected: 2845124

🔐 Found 1 commitment(s) in block 2845124

📬 New deposit detected!
   Commitment: 0x1234567890abcdef...
   TxID: 5a7b3c2d...
   Block: 2845124

1️⃣ Fetching Merkle proof...
✅ Merkle proof received

2️⃣ Generating recursive zkSNARK...
   (This takes 5-10 seconds)
✅ Proof generated in 7234ms

3️⃣ Submitting to Mina zkApp...
📤 Submitting proof for 0x1234567890...
✅ Submitted! Tx: 5JuE7tQx...

🎉 Bridge operation completed successfully!

═══════════════════════════════════════════════════════════
📊 Relayer Status
═══════════════════════════════════════════════════════════
Uptime: 180s
Processed: 1
Submitted: 1
Failed: 0
Queue: 0
═══════════════════════════════════════════════════════════
```

### Step 2.5: Verify on Mina Explorer

1. Copy the Mina transaction hash from relayer logs
2. Visit: `https://minascan.io/berkeley/tx/5JuE7tQx...`
3. Check your zkApp: `https://minascan.io/berkeley/account/B62qs9DKqP3nL8WW...`

You should see:
- Transaction confirmed ✅
- zkApp state updated ✅
- Total bridged amount increased ✅

✅ **End-to-end test successful!**

---

## 🚂 Phase 3: Deploy Relayer to Railway (30 minutes)

Once local testing works, deploy to Railway for 24/7 operation.

### Step 3.1: Prepare for Deployment

```bash
cd relayer

# Create production environment file
cp .env .env.production

# Edit with your values
nano .env.production
```

### Step 3.2: Install Railway CLI

```bash
npm install -g @railway/cli

# Login
railway login
```

### Step 3.3: Initialize Railway Project

```bash
# In relayer directory
railway init

# Follow prompts:
# Project name: zcash-mina-bridge
# Environment: production
```

### Step 3.4: Add Environment Variables

```bash
# Add all variables from .env
railway variables set ZCASH_RPC_URL="http://your-zcash-node:18232"
railway variables set ZCASH_RPC_USER="zcashbridge"
railway variables set ZCASH_RPC_PASSWORD="your_password"
railway variables set ZCASH_NETWORK="testnet"
railway variables set MINA_ENDPOINT="https://api.minascan.io/node/berkeley/v1/graphql"
railway variables set MINA_ARCHIVE="https://api.minascan.io/archive/berkeley/v1/graphql"
railway variables set ZKAPP_ADDRESS="B62qs9DKqP3nL8WW..."
railway variables set DEPLOYER_KEY="EKE..."
railway variables set POLL_INTERVAL="60000"
railway variables set BATCH_SIZE="10"

# Or use Railway dashboard
railway open
# Go to Variables tab and add all
```

### Step 3.5: Create Railway Configuration

Create `relayer/railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "bun install"
  },
  "deploy": {
    "startCommand": "bun run src/index.ts",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 3.6: Deploy

```bash
# Deploy to Railway
railway up

# Watch deployment
railway logs --follow
```

**Expected output**:
```
🚀 Deploying to Railway...
📦 Building...
   Installing dependencies...
   ✅ Build complete

🌐 Deploying...
   ✅ Deployed successfully

🔗 Service URL: https://zcash-mina-bridge-production.up.railway.app

📊 View logs: railway logs
```

### Step 3.7: Monitor Deployment

```bash
# View live logs
railway logs --follow

# Check status
railway status

# Open dashboard
railway open
```

✅ **Relayer deployed to Railway!**

---

## 📊 Complete Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPLOYED SYSTEM                           │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  Zcash Testnet   │         │  Railway.app     │         │ Mina Berkeley    │
│                  │         │                  │         │                  │
│  • No contract   │────────▶│  • Relayer       │────────▶│  • ZcashBridge   │
│  • Just watch    │  Watch  │  • Watcher       │  Submit │    zkApp         │
│  • Shielded tx   │         │  • Prover        │         │  • Deployed ✅   │
│                  │         │  • Submitter     │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │   Monitoring     │
                             │  • Railway logs  │
                             │  • Mina explorer │
                             └──────────────────┘
```

---

## ✅ Deployment Checklist

### Phase 1: Deploy Contracts
- [ ] Generate Mina keys (`bun run generate-keys`)
- [ ] Get testnet MINA from faucet
- [ ] Deploy zkApp to Mina (`bun run deploy`)
- [ ] Save zkApp address
- [ ] Verify on Mina explorer
- [ ] Setup Zcash testnet access (no contract needed)
- [ ] Create relayer `.env` file

### Phase 2: Test Locally
- [ ] Update relayer code for real blockchains
- [ ] Start relayer locally (`bun run dev`)
- [ ] Verify Zcash connection
- [ ] Verify Mina connection
- [ ] Create test Zcash transaction
- [ ] Watch relayer process it
- [ ] Verify on Mina explorer
- [ ] Confirm end-to-end works

### Phase 3: Deploy Relayer
- [ ] Install Railway CLI
- [ ] Initialize Railway project
- [ ] Add environment variables
- [ ] Create railway.json
- [ ] Deploy (`railway up`)
- [ ] Monitor logs
- [ ] Test with real transaction
- [ ] Verify 24/7 operation

---

## 🎯 Summary

### What Gets Deployed:

1. **Mina Testnet**:
   - ✅ `ZcashBridge` zkApp contract
   - Location: Berkeley testnet
   - Purpose: Verify proofs, manage state

2. **Zcash Testnet**:
   - ❌ No contract (Zcash doesn't use smart contracts)
   - Just watch existing blockchain

3. **Relayer**:
   - 🏠 First: Run locally for testing
   - ☁️ Then: Deploy to Railway for production

### Timeline:

```
Phase 1: Deploy contracts      30 min
Phase 2: Test locally          1 hour
Phase 3: Deploy to Railway     30 min
─────────────────────────────────────
Total                          2 hours
```

### Cost:

```
Mina testnet        FREE
Zcash testnet       FREE
Railway.app         FREE tier (or $5/month)
─────────────────────────────────────
Total               $0-5/month
```

---

## 🚀 Ready to Start?

```bash
# Step 1: Deploy Mina contract
cd mina-snark
bun run generate-keys
# Get testnet MINA from faucet
bun run deploy

# Step 2: Test locally
cd ../relayer
# Setup .env file
bun run dev
# Create test transaction

# Step 3: Deploy to Railway
railway init
railway up
```

**Let's do this! 🎉**

