# ⚡ Quick Deploy Guide - Get Live in 2 Hours

## 🎯 Goal
Deploy your PoC to **real testnets** for a live demo.

---

## 📋 Prerequisites

- ✅ Bun installed
- ✅ Git repository
- ✅ 2-3 hours of time
- ✅ $0-12/month budget

---

## 🚀 Step-by-Step Deployment

### **Step 1: Deploy Mina zkApp** (30 minutes)

#### 1.1 Generate Keys
```bash
cd mina-snark
bun run generate-keys
```

Output:
```
📝 DEPLOYER ADDRESS: B62qr...xyz
📝 ZKAPP ADDRESS: B62qs...abc
```

#### 1.2 Get Testnet MINA
1. Copy the **deployer address**
2. Go to: https://faucet.minaprotocol.com/
3. Paste address and click "Request"
4. Wait 2-3 minutes for confirmation

#### 1.3 Deploy Contract
```bash
bun run deploy
```

Wait 3-5 minutes. You'll see:
```
🎉 DEPLOYMENT SUCCESSFUL!
📍 Contract Address: B62qs...abc
🔍 View: https://minascan.io/berkeley/account/B62qs...abc
```

✅ **Mina zkApp deployed!**

---

### **Step 2: Setup Zcash Access** (15 minutes)

#### Option A: Use Public Testnet RPC (Easiest)

Create `relayer/.env`:
```bash
# Zcash Configuration
ZCASH_RPC_URL=https://testnet.z.cash/rpc
ZCASH_RPC_USER=public
ZCASH_RPC_PASSWORD=public
ZCASH_NETWORK=testnet

# Mina Configuration  
MINA_ENDPOINT=https://api.minascan.io/node/berkeley/v1/graphql
MINA_ARCHIVE=https://api.minascan.io/archive/berkeley/v1/graphql
ZKAPP_ADDRESS=<your-zkapp-address-from-step-1>
DEPLOYER_KEY=<your-deployer-private-key>

# Relayer Configuration
POLL_INTERVAL=60000
BATCH_SIZE=10
```

#### Option B: Run Your Own Node (More Control)

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

# Start (takes 2-4 hours to sync)
./zcash-5.7.0/bin/zcashd -daemon
```

✅ **Zcash access configured!**

---

### **Step 3: Deploy Relayer** (45 minutes)

#### Option A: Deploy to Railway.app (Recommended)

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
railway login
```

2. **Initialize Project**:
```bash
cd relayer
railway init
```

3. **Add Environment Variables**:
```bash
# Copy from relayer/.env
railway variables set ZCASH_RPC_URL=...
railway variables set MINA_ENDPOINT=...
railway variables set ZKAPP_ADDRESS=...
# ... add all variables
```

4. **Deploy**:
```bash
railway up
```

5. **View Logs**:
```bash
railway logs
```

#### Option B: Deploy to DigitalOcean

1. **Create Droplet**:
   - Ubuntu 22.04
   - 2GB RAM ($12/month)
   - SSH key authentication

2. **Setup Server**:
```bash
ssh root@your-droplet-ip

# Install Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Clone repo
git clone <your-repo-url>
cd zypherpunk/relayer

# Install dependencies
bun install

# Setup environment
nano .env  # Paste your config

# Install PM2
npm install -g pm2

# Start relayer
pm2 start "bun run src/index.ts" --name zcash-mina-bridge
pm2 save
pm2 startup

# View logs
pm2 logs zcash-mina-bridge
```

✅ **Relayer deployed!**

---

### **Step 4: Test End-to-End** (30 minutes)

#### 4.1 Create Test Transaction

**Option A: Using Zcash CLI** (if you have a node):
```bash
# Get testnet ZEC from faucet
# https://faucet.testnet.z.cash/

# Create shielded address
zcash-cli -testnet z_getnewaddress sapling

# Send to bridge address
zcash-cli -testnet z_sendmany \
  "your_z_address" \
  '[{"address":"bridge_z_address","amount":0.01}]'
```

**Option B: Using Zecwallet** (easier):
1. Download Zecwallet Lite: https://www.zecwallet.co/
2. Switch to testnet
3. Get testnet ZEC from faucet
4. Send to bridge address

#### 4.2 Monitor Relayer

```bash
# Railway
railway logs

# DigitalOcean
pm2 logs zcash-mina-bridge
```

You should see:
```
📬 New deposit detected!
   Commitment: 0x1234...
🔐 Generating proof...
✅ Proof generated
📤 Submitting to Mina...
✅ Submitted! Tx: ...
```

#### 4.3 Verify on Mina

Check your zkApp on explorer:
```
https://minascan.io/berkeley/account/<your-zkapp-address>
```

✅ **End-to-end test complete!**

---

## 📊 Architecture Overview

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│  Zcash Testnet  │         │   Railway    │         │ Mina Berkeley   │
│                 │         │   or VPS     │         │                 │
│  • Real network │────────▶│              │────────▶│  • zkApp        │
│  • Testnet ZEC  │  Watch  │  • Relayer   │  Submit │  • Verify       │
│  • Shielded tx  │         │  • Prover    │         │  • Mint         │
└─────────────────┘         └──────────────┘         └─────────────────┘
```

---

## 🎬 Demo Script

Create `demo-live.sh`:

```bash
#!/bin/bash

echo "🎬 Live Zcash-Mina Bridge Demo"
echo "=============================="
echo ""

# Show Zcash transaction
echo "1️⃣ Zcash Testnet Transaction:"
echo "   Explorer: https://explorer.testnet.z.cash/tx/<txid>"
echo ""

# Show relayer status
echo "2️⃣ Relayer Processing:"
curl https://your-relayer.railway.app/status
echo ""

# Show Mina verification
echo "3️⃣ Mina zkApp State:"
echo "   Explorer: https://minascan.io/berkeley/account/<zkapp>"
echo ""

echo "✅ Bridge is live and working!"
```

---

## 💰 Cost Breakdown

### **Testnet Deployment** (Recommended):

```
Service                Cost
─────────────────────────────
Zcash testnet         FREE
Mina testnet          FREE
Railway.app           FREE tier (or $5/month)
Domain (optional)     $10/year
─────────────────────────────
Total                 $0-5/month
```

### **With Your Own Zcash Node**:

```
Service                Cost
─────────────────────────────
DigitalOcean VPS      $12/month
Zcash node storage    Included
Mina testnet          FREE
─────────────────────────────
Total                 $12/month
```

---

## ✅ Deployment Checklist

- [ ] **Mina zkApp deployed** (30 min)
  - [ ] Keys generated
  - [ ] Testnet MINA received
  - [ ] Contract deployed
  - [ ] Verified on explorer

- [ ] **Zcash access configured** (15 min)
  - [ ] RPC endpoint working
  - [ ] Testnet access confirmed
  - [ ] Config saved

- [ ] **Relayer deployed** (45 min)
  - [ ] Service running
  - [ ] Environment configured
  - [ ] Logs visible
  - [ ] Health check passing

- [ ] **End-to-end test** (30 min)
  - [ ] Test transaction created
  - [ ] Relayer detected it
  - [ ] Proof generated
  - [ ] Submitted to Mina
  - [ ] Verified on explorer

---

## 🔍 Troubleshooting

### **Mina deployment fails**:
```bash
# Check balance
curl -X POST https://api.minascan.io/node/berkeley/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { account(publicKey: \"YOUR_ADDRESS\") { balance { total } } }"}'

# Request more MINA if needed
```

### **Relayer not detecting transactions**:
```bash
# Test Zcash connection
curl -u user:pass -X POST http://your-zcash-node:18232 \
  -d '{"jsonrpc":"1.0","id":"test","method":"getblockchaininfo","params":[]}'

# Check relayer logs
railway logs  # or pm2 logs
```

### **Proof generation fails**:
```bash
# Check memory
free -h  # Need at least 2GB

# Increase if needed
railway settings  # Upgrade plan
```

---

## 📚 Resources

### **Zcash**:
- Testnet faucet: https://faucet.testnet.z.cash/
- Explorer: https://explorer.testnet.z.cash/
- Zecwallet: https://www.zecwallet.co/

### **Mina**:
- Testnet faucet: https://faucet.minaprotocol.com/
- Explorer: https://minascan.io/berkeley
- Docs: https://docs.minaprotocol.com/

### **Deployment**:
- Railway: https://railway.app/
- DigitalOcean: https://www.digitalocean.com/
- PM2: https://pm2.keymetrics.io/

---

## 🎯 Timeline Summary

```
Task                          Time
────────────────────────────────────
1. Deploy Mina zkApp          30 min
2. Setup Zcash access         15 min
3. Deploy relayer             45 min
4. Test end-to-end            30 min
────────────────────────────────────
Total                         2 hours
```

---

## 🎉 Success!

Once deployed, you have:

✅ **Real blockchain integration** (testnets)
✅ **Live demonstration capability**
✅ **Working cross-chain bridge**
✅ **Professional PoC**

**Ready to show investors, demos, or presentations!**

---

## 📞 Need Help?

**Stuck?** Check:
1. Railway logs: `railway logs`
2. PM2 logs: `pm2 logs`
3. Mina explorer: Check transaction status
4. Zcash explorer: Verify transaction

**Common Issues**:
- "Insufficient balance" → Get more testnet MINA
- "RPC connection failed" → Check Zcash node/RPC
- "Proof generation timeout" → Increase memory

---

## 🚀 Ready to Deploy?

```bash
# Start here:
cd mina-snark
bun run generate-keys

# Then follow the steps above!
```

**Good luck with your deployment! 🎉**

