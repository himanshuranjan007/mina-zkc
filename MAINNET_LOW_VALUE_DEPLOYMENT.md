# 🚀 Mina Mainnet + Zcash Testnet Deployment

## Your Plan

- **Mina**: MAINNET (real MINA, low amounts)
- **Zcash**: TESTNET (free test ZEC)
- **Goal**: Demonstrate real mainnet transfers with minimal risk

---

## ⚠️ Safety Measures

Since we're using mainnet with real money:

1. **Very low amounts** - Max 1-5 MINA per test
2. **Daily limits** - Cap at 10 MINA/day
3. **Manual verification** - Check each transaction
4. **Quick testing** - Prove it works, then stop

---

## 💰 Budget Needed

```
Item                    Amount          Cost (approx)
────────────────────────────────────────────────────────
Deployment fee          ~0.1 MINA       ~$0.05
Test transactions       5-10 MINA       ~$2-5
Reserve                 10 MINA         ~$5
────────────────────────────────────────────────────────
Total                   ~20 MINA        ~$10-15 USD
```

**Where to buy MINA**:
- Coinbase
- Kraken
- Binance
- Gate.io

---

## 🎯 Step-by-Step Deployment

### Phase 1: Prepare Mina Mainnet (20 minutes)

#### Step 1.1: Generate Mainnet Keys

```bash
cd mina-snark
bun run src/generate-keys-mainnet.ts
```

This will create `keys.mainnet.json` with:
- Deployer address (fund this)
- zkApp address (your contract)

#### Step 1.2: Buy & Send MINA

1. **Buy 20 MINA** (~$10-15) from exchange
2. **Withdraw to your deployer address**
3. **Wait for confirmation** (5-10 minutes)

**Verify balance**:
```bash
# Check on explorer
https://minascan.io/mainnet/account/YOUR_DEPLOYER_ADDRESS
```

#### Step 1.3: Deploy to Mainnet

```bash
bun run src/deploy-mainnet.ts
```

**Expected output**:
```
🚀 MAINNET DEPLOYMENT
⚠️  DEPLOYING TO MAINNET - REAL MONEY!

🔑 Loading keys...
   ✅ Keys loaded

🌐 Connected to Mina MAINNET
📍 zkApp Address: B62q...

💰 Balance: 20 MINA

🔧 Compiling contract...
   ✅ Compiled (45s)

📤 Deploying...
   ✅ DEPLOYED TO MAINNET!

🔍 View: https://minascan.io/mainnet/account/B62q...
```

**Save the zkApp address!**

---

### Phase 2: Setup Zcash Testnet (15 minutes)

We'll use Zcash **testnet** (free coins) to bridge to Mina **mainnet**.

#### Step 2.1: Configure Relayer

Create `relayer/.env`:

```bash
# Zcash TESTNET (free coins)
ZCASH_RPC_URL=http://127.0.0.1:18232
ZCASH_RPC_USER=zcashbridge
ZCASH_RPC_PASSWORD=your_password
ZCASH_NETWORK=testnet

# Mina MAINNET (real MINA)
MINA_ENDPOINT=https://api.minascan.io/node/mainnet/v1/graphql
MINA_ARCHIVE=https://api.minascan.io/archive/mainnet/v1/graphql
MINA_NETWORK=mainnet
ZKAPP_ADDRESS=B62q...  # Your deployed mainnet zkApp
DEPLOYER_KEY=EKE...    # From keys.mainnet.json

# Safety Limits
MAX_AMOUNT_PER_TX=1000000000     # 1 MINA max per tx
DAILY_LIMIT=10000000000          # 10 MINA daily max
REQUIRE_CONFIRMATION=true

# Relayer
POLL_INTERVAL=60000
LOG_LEVEL=info
```

#### Step 2.2: Setup Zcash Testnet Access

**Option A: Public RPC** (Easiest)
```bash
# No setup needed, use public endpoint
ZCASH_RPC_URL=https://testnet.z.cash/rpc
```

**Option B: Run Your Own Node**
```bash
# Download and configure for testnet
wget https://z.cash/downloads/zcash-5.7.0-linux64.tar.gz
tar -xvf zcash-5.7.0-linux64.tar.gz

mkdir -p ~/.zcash
cat > ~/.zcash/zcash.conf << EOF
testnet=1
rpcuser=zcashbridge
rpcpassword=$(openssl rand -hex 32)
server=1
EOF

./zcash-5.7.0/bin/zcashd -daemon
```

---

### Phase 3: Test Locally (30 minutes)

#### Step 3.1: Start Relayer

```bash
cd relayer
bun run dev
```

**Expected output**:
```
╔════════════════════════════════════════════╗
║   Bridge Relayer - Zcash ↔ Mina           ║
╚════════════════════════════════════════════╝

⚠️  MAINNET MODE - Real MINA!
Safety limits enabled:
  Max per tx: 1 MINA
  Daily limit: 10 MINA

Configuration:
  Zcash: TESTNET (http://...)
  Mina: MAINNET (https://api.minascan.io/node/mainnet)
  zkApp: B62q...

✅ Relayer is running!
Monitoring Zcash testnet for deposits...
```

#### Step 3.2: Create Test Transaction

**Get testnet ZEC**:
1. Download Zecwallet Lite: https://www.zecwallet.co/
2. Switch to testnet mode
3. Get free ZEC from faucet: https://faucet.testnet.z.cash/

**Send test transaction**:
- Amount: 0.01 ZEC (very small)
- To: Bridge z-address
- Wait for confirmation

#### Step 3.3: Watch Bridge Process

In relayer terminal:
```
📬 New deposit detected!
   Commitment: 0x1234...
   Amount: 0.01 ZEC

⚠️  MAINNET: Verifying safety limits...
   ✅ Amount OK (below 1 MINA limit)
   ✅ Daily limit OK (0.01/10 MINA)

🔐 Generating proof...
   ✅ Proof generated (7.2s)

📤 Submitting to Mina MAINNET...
   ✅ Submitted!
   Tx: 5Jt8...

🎉 Bridge operation completed!
```

#### Step 3.4: Verify on Mainnet

Check Mina mainnet explorer:
```
https://minascan.io/mainnet/tx/5Jt8...
https://minascan.io/mainnet/account/YOUR_ZKAPP
```

You should see:
- ✅ Transaction confirmed
- ✅ zkApp state updated
- ✅ Real mainnet transfer!

---

## 📋 Quick Commands

```bash
# 1. Generate mainnet keys
cd mina-snark
bun run src/generate-keys-mainnet.ts

# 2. Fund deployer address (buy ~20 MINA)

# 3. Deploy to mainnet
bun run src/deploy-mainnet.ts

# 4. Setup relayer
cd ../relayer
cp .env.example .env
nano .env  # Add your mainnet config

# 5. Run relayer
bun run dev

# 6. Create Zcash testnet transaction

# 7. Verify on Mina mainnet explorer
```

---

## 🛡️ Safety Features

The relayer includes safety limits:

```typescript
// Safety checks before processing
if (amount > MAX_AMOUNT_PER_TX) {
  console.log('❌ Amount exceeds per-tx limit');
  return;
}

if (dailyTotal + amount > DAILY_LIMIT) {
  console.log('❌ Daily limit exceeded');
  return;
}

// Manual confirmation for mainnet
if (REQUIRE_CONFIRMATION) {
  console.log('⚠️  MAINNET TX - Confirm? (y/n)');
  // Wait for confirmation
}
```

---

## 🎬 Demo Flow

### What You'll Show:

1. **Zcash testnet transaction**
   - Show on Zcash testnet explorer
   - "Here's a shielded transaction"

2. **Relayer processing**
   - Show live logs
   - "The relayer detects and generates proof"

3. **Mina MAINNET verification**
   - Show on minascan.io/mainnet
   - "This is REAL mainnet - see the transaction!"

4. **Proof of concept**
   - "Privacy preserved"
   - "Cross-chain working"
   - "Real mainnet transfer!"

---

## ✅ Deployment Checklist

### Before Starting:
- [ ] Buy ~20 MINA (~$10-15)
- [ ] Have Zcash testnet access
- [ ] Understand this uses real money

### Phase 1 - Mina Mainnet:
- [ ] Generate mainnet keys
- [ ] Send MINA to deployer address
- [ ] Wait for balance confirmation
- [ ] Deploy zkApp to mainnet
- [ ] Verify on explorer
- [ ] Save zkApp address

### Phase 2 - Zcash Testnet:
- [ ] Setup Zcash testnet access
- [ ] Get free testnet ZEC
- [ ] Configure relayer .env

### Phase 3 - Testing:
- [ ] Start relayer locally
- [ ] Create small test transaction
- [ ] Watch relayer process it
- [ ] Verify on Mina mainnet explorer
- [ ] Celebrate! 🎉

---

## 💰 Cost Summary

```
Action                  MINA Cost       USD Cost
────────────────────────────────────────────────────
Deploy zkApp            ~0.1 MINA       ~$0.05
Test transaction 1      ~0.5 MINA       ~$0.25
Test transaction 2      ~0.5 MINA       ~$0.25
Test transaction 3      ~0.5 MINA       ~$0.25
Reserve                 ~18 MINA        ~$9
────────────────────────────────────────────────────
Total                   ~20 MINA        ~$10-15
```

---

## 🚨 Important Notes

### What's Real:
- ✅ Mina transactions (real MINA)
- ✅ Mina explorer verification
- ✅ zkApp state changes

### What's Testnet:
- ⚠️ Zcash transactions (testnet ZEC)
- ⚠️ Zcash explorer (testnet)

### For Full Production:
Would need:
- Zcash mainnet (real ZEC)
- Security audit
- Multi-sig setup
- Insurance

**But for PoC demo, this hybrid approach works great!**

---

## 🎯 Expected Results

After deployment:

1. **Mina Mainnet zkApp**
   - Address: `B62q...`
   - View: minascan.io/mainnet/account/...
   - Real mainnet contract!

2. **Working Bridge**
   - Zcash testnet → Mina mainnet
   - Real cross-chain transfers
   - Privacy preserved

3. **Demo Capability**
   - Show real mainnet transactions
   - Prove concept works
   - Professional presentation

---

## 🚀 Ready to Deploy?

```bash
# Start here
cd mina-snark
bun run src/generate-keys-mainnet.ts

# Then buy MINA and follow the steps above!
```

**Budget**: ~$10-15 USD
**Time**: ~1 hour
**Result**: Real mainnet demo! 🎉

