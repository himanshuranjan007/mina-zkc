# 🎯 Quick Reference - Deployment Commands

## 📋 What to Deploy Where

| Component | Where | What |
|-----------|-------|------|
| **Mina zkApp** | Mina Berkeley Testnet | `ZcashBridge` smart contract ✅ |
| **Zcash** | Zcash Testnet | Nothing (just watch) ❌ |
| **Relayer** | Local → Railway | Bridge service 🏠→☁️ |

---

## ⚡ Quick Commands

### Phase 1: Deploy Mina Contract

```bash
# Generate keys
cd mina-snark
bun run generate-keys

# Get testnet MINA
# Visit: https://faucet.minaprotocol.com/
# Paste deployer address

# Deploy contract
bun run deploy

# Save the zkApp address!
```

### Phase 2: Test Locally

```bash
# Setup Zcash access (no deployment needed)
cd relayer
cp .env.example .env
nano .env  # Add your zkApp address

# Run relayer locally
bun run dev

# In another terminal: Create test transaction
# Use Zecwallet or zcash-cli
```

### Phase 3: Deploy to Railway

```bash
# Install Railway
npm install -g @railway/cli
railway login

# Deploy
cd relayer
railway init
railway variables set ZKAPP_ADDRESS="B62qs..."
railway variables set DEPLOYER_KEY="EKE..."
# ... add all variables
railway up

# Monitor
railway logs --follow
```

---

## 🔑 Key Addresses You Need

After deployment, save these:

```
✅ Mina Deployer Address: B62qr... (from generate-keys)
✅ Mina zkApp Address: B62qs... (from deploy)
✅ Deployer Private Key: EKE... (from keys.json)

❌ Zcash: No contract address (just watch blockchain)
```

---

## 🌐 Important URLs

### Faucets:
- Mina testnet: https://faucet.minaprotocol.com/
- Zcash testnet: https://faucet.testnet.z.cash/

### Explorers:
- Mina: https://minascan.io/berkeley/account/YOUR_ADDRESS
- Zcash: https://explorer.testnet.z.cash/

### Deployment:
- Railway: https://railway.app/

---

## 📝 Environment Variables Needed

Create `relayer/.env`:

```bash
# Zcash (no contract, just RPC)
ZCASH_RPC_URL=http://127.0.0.1:18232
ZCASH_RPC_USER=zcashbridge
ZCASH_RPC_PASSWORD=your_password
ZCASH_NETWORK=testnet

# Mina (your deployed zkApp)
MINA_ENDPOINT=https://api.minascan.io/node/berkeley/v1/graphql
MINA_ARCHIVE=https://api.minascan.io/archive/berkeley/v1/graphql
ZKAPP_ADDRESS=B62qs9DKqP3nL8WW...  # FROM DEPLOYMENT
DEPLOYER_KEY=EKE...  # FROM keys.json

# Relayer
POLL_INTERVAL=60000
BATCH_SIZE=10
```

---

## ✅ Checklist

### Before Starting:
- [ ] Bun installed
- [ ] Git repo ready
- [ ] 2 hours available

### Phase 1 - Deploy Mina (30 min):
- [ ] `bun run generate-keys`
- [ ] Get testnet MINA from faucet
- [ ] `bun run deploy`
- [ ] Save zkApp address
- [ ] Verify on explorer

### Phase 2 - Test Local (1 hour):
- [ ] Create `relayer/.env`
- [ ] `bun run dev` (relayer)
- [ ] Create Zcash test transaction
- [ ] Watch relayer process it
- [ ] Verify on Mina explorer

### Phase 3 - Deploy Railway (30 min):
- [ ] `railway init`
- [ ] Add environment variables
- [ ] `railway up`
- [ ] Monitor logs
- [ ] Test with transaction

---

## 🚨 Common Issues

### "Insufficient balance"
```bash
# Get more testnet MINA
https://faucet.minaprotocol.com/
```

### "RPC connection failed"
```bash
# Check Zcash node is running
zcash-cli -testnet getblockchaininfo

# Or use public RPC
ZCASH_RPC_URL=https://testnet.z.cash/rpc
```

### "Proof generation timeout"
```bash
# Increase memory on Railway
railway settings
# Upgrade to 2GB+ RAM
```

---

## 📊 Timeline

```
Task                          Time
────────────────────────────────────
Generate keys                 2 min
Get testnet MINA             3 min
Deploy Mina zkApp            25 min
Setup Zcash access           10 min
Test locally                 50 min
Deploy to Railway            30 min
────────────────────────────────────
Total                        2 hours
```

---

## 💰 Cost

```
Component              Cost
─────────────────────────────
Mina testnet          FREE
Zcash testnet         FREE
Railway (free tier)   FREE
Railway (hobby)       $5/month
─────────────────────────────
Total                 $0-5/month
```

---

## 🎯 What You're Deploying

```
1. Mina zkApp Contract
   ├─ Verifies Merkle proofs
   ├─ Manages bridge state
   └─ Mints wrapped tokens

2. Zcash (Nothing!)
   └─ Just watch existing blockchain

3. Relayer Service
   ├─ Watches Zcash
   ├─ Generates proofs
   └─ Submits to Mina
```

---

## 🚀 Start Here

```bash
cd mina-snark && bun run generate-keys
```

Then follow: **[STEP_BY_STEP_DEPLOYMENT.md](./STEP_BY_STEP_DEPLOYMENT.md)**

---

**Questions?** Check the full guides:
- [STEP_BY_STEP_DEPLOYMENT.md](./STEP_BY_STEP_DEPLOYMENT.md) - Detailed walkthrough
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - Fast deployment
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete reference

