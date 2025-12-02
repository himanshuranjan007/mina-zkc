# 🚀 FULL MAINNET DEPLOYMENT - Zcash + Mina

## ⚠️ REAL MONEY ON BOTH CHAINS

This guide deploys to:
- **Zcash MAINNET** (real ZEC)
- **Mina MAINNET** (real MINA)

---

## 💰 Budget Required

```
Item                          Amount          Cost (USD)
────────────────────────────────────────────────────────────
Mina deployment               ~20 MINA        ~$10-15
Mina test transactions        ~5 MINA         ~$2-3
Zcash test transactions       ~0.01 ZEC       ~$0.30
Zcash node (optional)         VPS             $50-100/month
────────────────────────────────────────────────────────────
Minimum to start              ~25 MINA + 0.01 ZEC    ~$15-20
```

**Where to buy**:
- **MINA**: Coinbase, Kraken, Binance, Gate.io
- **ZEC**: Coinbase, Kraken, Binance, Gemini

---

## 🎯 Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│  Zcash MAINNET  │────────▶│   Relayer    │────────▶│  Mina MAINNET   │
│  (Real ZEC)     │         │   (Local)    │         │  (Real MINA)    │
│                 │         │              │         │                 │
│  • Real network │  Watch  │  • Watcher   │  Submit │  • ZcashBridge  │
│  • Real money   │         │  • Prover    │         │    zkApp        │
│  • Shielded tx  │         │  • Submitter │         │  • Real txs     │
└─────────────────┘         └──────────────┘         └─────────────────┘
```

---

## 📋 Step-by-Step Deployment

### Phase 1: Deploy Mina Mainnet zkApp (30 min)

#### 1.1 Generate Mainnet Keys

```bash
cd mina-snark
bun run generate-keys:mainnet
```

Type `MAINNET` when prompted.

**Output**:
```
📝 DEPLOYER ADDRESS (send MINA here):
   B62qr...xyz

📝 ZKAPP ADDRESS (your contract):
   B62qs...abc
```

#### 1.2 Fund Deployer Address

1. **Buy ~25 MINA** from exchange (~$15)
2. **Withdraw to deployer address**: `B62qr...xyz`
3. **Wait for confirmation** (5-10 min)
4. **Verify**: https://minascan.io/mainnet/account/B62qr...xyz

#### 1.3 Deploy zkApp

```bash
bun run deploy:mainnet
```

Type `DEPLOY` when prompted.

**Save the zkApp address!**

---

### Phase 2: Setup Zcash Mainnet (1-2 hours)

#### 2.1 Option A: Run Your Own Node (Recommended)

```bash
# Download Zcash
wget https://z.cash/downloads/zcash-5.7.0-linux64.tar.gz
tar -xvf zcash-5.7.0-linux64.tar.gz
cd zcash-5.7.0

# Fetch parameters (first time only, takes 10-20 min)
./bin/zcash-fetch-params

# Create MAINNET config
mkdir -p ~/.zcash
cat > ~/.zcash/zcash.conf << 'EOF'
# Zcash MAINNET Configuration
mainnet=1
rpcuser=zcashbridge
rpcpassword=GENERATE_SECURE_PASSWORD_HERE
rpcallowip=127.0.0.1
rpcbind=127.0.0.1
server=1
txindex=1

# Performance
dbcache=4000
maxmempool=300

# Security - only local connections
listen=1
EOF

# Generate secure password
PASSWORD=$(openssl rand -hex 32)
sed -i "s/GENERATE_SECURE_PASSWORD_HERE/$PASSWORD/" ~/.zcash/zcash.conf
echo "Your RPC password: $PASSWORD"
echo "Save this password!"

# Start node
./bin/zcashd -daemon

# Check sync status (full sync takes 1-2 days!)
./bin/zcash-cli getblockchaininfo
```

**Sync Progress**:
```bash
# Check progress
watch -n 60 './bin/zcash-cli getblockchaininfo | grep -E "blocks|headers|verificationprogress"'

# Expected output when synced:
# "blocks": 2456789,
# "headers": 2456789,
# "verificationprogress": 0.9999999
```

#### 2.2 Option B: Use Zcash RPC Service

If you don't want to run a node, use a service:
- **Alchemy** (check if they support Zcash)
- **QuickNode** (check availability)
- **Self-hosted on VPS** (recommended)

#### 2.3 Create Zcash Wallet

```bash
# Create new z-address (shielded)
./bin/zcash-cli z_getnewaddress sapling

# Output: zs1...your_z_address

# Get transparent address for funding
./bin/zcash-cli getnewaddress

# Output: t1...your_t_address
```

#### 2.4 Fund Your Zcash Wallet

1. **Buy ~0.1 ZEC** from exchange (~$3)
2. **Send to your t-address**: `t1...`
3. **Wait for confirmations** (10-20 min, 6 confirmations)
4. **Shield the funds**:

```bash
# Move funds to shielded address
./bin/zcash-cli z_sendmany "t1...your_t_address" '[{"address":"zs1...your_z_address","amount":0.09}]'

# Check balance
./bin/zcash-cli z_getbalance "zs1...your_z_address"
```

---

### Phase 3: Configure Relayer for Full Mainnet (15 min)

#### 3.1 Create Mainnet Configuration

```bash
cd relayer

# Create .env file
cat > .env << 'EOF'
# ═══════════════════════════════════════════════════════════
# FULL MAINNET CONFIGURATION
# ⚠️ REAL MONEY ON BOTH CHAINS!
# ═══════════════════════════════════════════════════════════

# Zcash MAINNET
ZCASH_RPC_URL=http://127.0.0.1:8232
ZCASH_RPC_USER=zcashbridge
ZCASH_RPC_PASSWORD=YOUR_ZCASH_RPC_PASSWORD
ZCASH_NETWORK=mainnet

# Mina MAINNET
MINA_ENDPOINT=https://api.minascan.io/node/mainnet/v1/graphql
MINA_ARCHIVE=https://api.minascan.io/archive/mainnet/v1/graphql
MINA_NETWORK=mainnet
ZKAPP_ADDRESS=YOUR_ZKAPP_ADDRESS
DEPLOYER_KEY=YOUR_DEPLOYER_PRIVATE_KEY

# Safety Limits (IMPORTANT!)
MAX_AMOUNT_PER_TX=1
DAILY_LIMIT=10
MIN_CONFIRMATIONS=6

# Relayer Settings
POLL_INTERVAL=60000
LOG_LEVEL=info
EOF
```

#### 3.2 Update with Your Values

```bash
nano .env

# Replace:
# - YOUR_ZCASH_RPC_PASSWORD (from ~/.zcash/zcash.conf)
# - YOUR_ZKAPP_ADDRESS (from deployment.mainnet.json)
# - YOUR_DEPLOYER_PRIVATE_KEY (from keys.mainnet.json)
```

---

### Phase 4: Test the Bridge (30 min)

#### 4.1 Start Relayer

```bash
cd relayer
bun run dev
```

**Expected output**:
```
╔════════════════════════════════════════════╗
║   Bridge Relayer - Zcash ↔ Mina           ║
╚════════════════════════════════════════════╝

⚠️ ⚠️ ⚠️  FULL MAINNET MODE  ⚠️ ⚠️ ⚠️
Real ZEC and MINA will be used!

Configuration:
════════════════════════════════════════════
Zcash:
  Network:    MAINNET
  RPC:        http://127.0.0.1:8232

Mina:
  Network:    MAINNET
  zkApp:      B62qs...

Safety Limits:
  Max per tx: 1 MINA
  Daily:      10 MINA
════════════════════════════════════════════

✅ Relayer is running!
Monitoring Zcash mainnet for deposits...
```

#### 4.2 Create Test Transaction

**Send small amount from your z-address**:

```bash
# Create bridge deposit (0.001 ZEC = very small test)
cd ~/zcash-5.7.0
./bin/zcash-cli z_sendmany "zs1...your_z_address" '[{"address":"zs1...bridge_z_address","amount":0.001,"memo":"bridge_test"}]'

# Check transaction status
./bin/zcash-cli z_getoperationstatus
```

#### 4.3 Watch Relayer Process

In relayer terminal:
```
📦 New block: 2456790

🔐 Found commitment in block 2456790
   Commitment: 0x1234...
   TxID: abc123...

⚠️  MAINNET TRANSACTION
   Amount: 0.001 ZEC → ~0.5 MINA

1️⃣ Fetching Merkle proof...
   ✅ Proof received

2️⃣ Generating zkSNARK...
   ✅ Proof generated (7.2s)

3️⃣ Submitting to Mina MAINNET...
   ✅ Submitted!
   Tx: 5Jt8...

🎉 Bridge operation completed!
   Zcash: https://explorer.zcha.in/transactions/abc123...
   Mina:  https://minascan.io/mainnet/tx/5Jt8...
```

#### 4.4 Verify on Explorers

**Zcash Mainnet**:
```
https://explorer.zcha.in/transactions/YOUR_TX_ID
```

**Mina Mainnet**:
```
https://minascan.io/mainnet/tx/YOUR_MINA_TX
https://minascan.io/mainnet/account/YOUR_ZKAPP
```

---

## 🛡️ Safety Measures

### Built-in Limits:
- ✅ Max 1 MINA per transaction
- ✅ Max 10 MINA per day
- ✅ 6 Zcash confirmations required
- ✅ Clear mainnet warnings

### Recommendations:
1. **Start with tiny amounts** (0.001 ZEC)
2. **Monitor every transaction**
3. **Keep most funds in cold storage**
4. **Test multiple times before larger amounts**

---

## 📊 Cost Summary

### Initial Setup:
```
Item                          Cost
────────────────────────────────────────
MINA for deployment           ~$10-15
ZEC for testing               ~$3
VPS for Zcash node (optional) $50-100/month
────────────────────────────────────────
Total to start                ~$15-20
```

### Per Transaction:
```
Item                          Cost
────────────────────────────────────────
Zcash tx fee                  ~0.0001 ZEC (~$0.003)
Mina tx fee                   ~0.1 MINA (~$0.05)
────────────────────────────────────────
Per bridge operation          ~$0.05
```

---

## 🎬 Demo Flow

### What You'll Show:

1. **Zcash Mainnet Transaction**
   ```
   "Here's a real Zcash mainnet shielded transaction"
   → https://explorer.zcha.in/transactions/...
   ```

2. **Relayer Processing**
   ```
   "The relayer detects it and generates a zero-knowledge proof"
   → Show live logs
   ```

3. **Mina Mainnet Verification**
   ```
   "The proof is verified on Mina mainnet"
   → https://minascan.io/mainnet/tx/...
   ```

4. **Privacy Demonstration**
   ```
   "Notice: The amount and sender are hidden!"
   → Show commitment vs actual transaction
   ```

5. **Cross-Chain Proof**
   ```
   "Real mainnet to mainnet transfer, privacy preserved!"
   ```

---

## ✅ Deployment Checklist

### Phase 1: Mina Mainnet
- [ ] Generate mainnet keys
- [ ] Buy ~25 MINA
- [ ] Send to deployer address
- [ ] Verify balance on explorer
- [ ] Deploy zkApp
- [ ] Verify deployment on explorer
- [ ] Save zkApp address

### Phase 2: Zcash Mainnet
- [ ] Install Zcash node OR get RPC access
- [ ] Sync blockchain (1-2 days for full node)
- [ ] Create z-address
- [ ] Buy ~0.1 ZEC
- [ ] Fund wallet
- [ ] Shield funds to z-address

### Phase 3: Relayer
- [ ] Create .env with mainnet config
- [ ] Add Zcash RPC credentials
- [ ] Add Mina zkApp address
- [ ] Add deployer key
- [ ] Set safety limits
- [ ] Test locally

### Phase 4: Testing
- [ ] Start relayer
- [ ] Create tiny test transaction (0.001 ZEC)
- [ ] Watch relayer process
- [ ] Verify on Zcash explorer
- [ ] Verify on Mina explorer
- [ ] Celebrate! 🎉

---

## 🚨 Troubleshooting

### Zcash Node Not Syncing
```bash
# Check status
./bin/zcash-cli getblockchaininfo

# Check peers
./bin/zcash-cli getpeerinfo | grep addr

# Restart if stuck
./bin/zcash-cli stop
./bin/zcashd -daemon
```

### RPC Connection Failed
```bash
# Test RPC
curl --user zcashbridge:YOUR_PASSWORD \
  --data-binary '{"jsonrpc":"1.0","id":"test","method":"getblockchaininfo","params":[]}' \
  -H 'content-type:text/plain;' \
  http://127.0.0.1:8232/
```

### Mina Transaction Failed
```bash
# Check balance
# Visit: https://minascan.io/mainnet/account/YOUR_DEPLOYER

# Check zkApp
# Visit: https://minascan.io/mainnet/account/YOUR_ZKAPP
```

### Insufficient Funds
```bash
# Zcash
./bin/zcash-cli z_gettotalbalance

# Mina - check explorer
```

---

## 📚 Resources

### Zcash Mainnet
- Explorer: https://explorer.zcha.in/
- Docs: https://zcash.readthedocs.io/
- Download: https://z.cash/download/

### Mina Mainnet
- Explorer: https://minascan.io/mainnet
- Docs: https://docs.minaprotocol.com/
- API: https://api.minascan.io/

### Exchanges
- Coinbase: https://www.coinbase.com/
- Kraken: https://www.kraken.com/
- Binance: https://www.binance.com/

---

## 🎯 Summary

### What You're Deploying:

| Chain | Network | Contract | Cost |
|-------|---------|----------|------|
| **Mina** | MAINNET | ZcashBridge zkApp | ~$15 |
| **Zcash** | MAINNET | (no contract) | ~$3 |

### What You Get:

✅ Real mainnet-to-mainnet bridge
✅ Real ZEC → Real MINA transfers
✅ Privacy preserved (shielded transactions)
✅ Verifiable on both explorers
✅ Professional PoC demonstration

### Timeline:

```
Phase 1: Mina deployment        30 min
Phase 2: Zcash setup            1-2 hours (or 1-2 days with full node)
Phase 3: Relayer config         15 min
Phase 4: Testing                30 min
────────────────────────────────────────
Total                           2-3 hours (with RPC service)
                                1-2 days (with full node sync)
```

---

## 🚀 Ready to Deploy?

```bash
# Step 1: Deploy Mina
cd mina-snark
bun run generate-keys:mainnet
# Fund deployer, then:
bun run deploy:mainnet

# Step 2: Setup Zcash (see guide above)

# Step 3: Configure relayer
cd ../relayer
nano .env  # Add your config

# Step 4: Run and test
bun run dev
```

**Budget**: ~$15-20 USD
**Time**: 2-3 hours (or 1-2 days with full Zcash node)
**Result**: Real mainnet bridge demo! 🎉

---

## ⚠️ Final Reminder

**This is REAL MONEY on BOTH chains!**

- Start with tiny amounts (0.001 ZEC)
- Monitor every transaction
- Keep safety limits enabled
- Test thoroughly before larger amounts

**Good luck with your mainnet deployment! 🚀**

