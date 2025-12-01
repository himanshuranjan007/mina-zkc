# 🚀 Deployment Guide - Moving to Real Blockchains

## 🎯 Overview

This guide shows you how to deploy the PoC to **real blockchains** for a live demonstration.

---

## 📋 Deployment Strategy

### **Phase 1: Testnets First** ⭐ **RECOMMENDED**
- Deploy to Zcash testnet + Mina testnet
- Test with fake coins (no real money)
- Safe for demos and testing
- **Timeline**: 1-2 days

### **Phase 2: Mainnet** ⚠️ **PRODUCTION**
- Deploy to real Zcash + Mina mainnet
- Requires security audit
- Real money at risk
- **Timeline**: 2-4 weeks + audit

**For your PoC demo, use Phase 1 (Testnets)!**

---

## 🌐 Phase 1: Testnet Deployment (RECOMMENDED)

### **What You'll Deploy**:

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│  Zcash Testnet  │────────▶│   Relayer    │────────▶│  Mina Testnet   │
│  (Real network) │         │  (Your VPS)  │         │  (Berkeley)     │
└─────────────────┘         └──────────────┘         └─────────────────┘
```

---

## 1️⃣ **Setup Zcash Testnet Integration**

### **Option A: Use Zcash Testnet RPC** (Easier)

Instead of running your own node, use a public RPC:

```typescript
// relayer/src/zcash-client.ts (NEW FILE)
import fetch from 'node-fetch';

export class ZcashClient {
  private rpcUrl: string;
  private rpcUser: string;
  private rpcPassword: string;

  constructor(url: string, user: string, password: string) {
    this.rpcUrl = url;
    this.rpcUser = user;
    this.rpcPassword = password;
  }

  /**
   * Call Zcash RPC method
   */
  async call(method: string, params: any[] = []): Promise<any> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${this.rpcUser}:${this.rpcPassword}`).toString('base64')
      },
      body: JSON.stringify({
        jsonrpc: '1.0',
        id: 'bridge',
        method,
        params
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }
    return data.result;
  }

  /**
   * Get commitment from transaction
   */
  async getCommitment(txid: string, outputIndex: number): Promise<string> {
    const tx = await this.call('getrawtransaction', [txid, 1]);
    // Extract commitment from shielded output
    const output = tx.vShieldedOutput[outputIndex];
    return output.cmu; // commitment
  }

  /**
   * Get Merkle path for commitment
   */
  async getMerklePath(commitment: string): Promise<any> {
    // Use z_getmerkleproof RPC call
    return await this.call('z_getmerkleproof', [commitment]);
  }

  /**
   * Get current tree root
   */
  async getTreeRoot(): Promise<string> {
    const info = await this.call('getblockchaininfo', []);
    return info.commitments; // Sapling tree root
  }

  /**
   * Watch for new blocks
   */
  async watchBlocks(callback: (blockHeight: number) => void): Promise<void> {
    let lastHeight = await this.call('getblockcount', []);
    
    setInterval(async () => {
      const currentHeight = await this.call('getblockcount', []);
      if (currentHeight > lastHeight) {
        callback(currentHeight);
        lastHeight = currentHeight;
      }
    }, 60000); // Check every minute
  }
}
```

### **Option B: Run Your Own Zcash Testnet Node** (More control)

```bash
# Install Zcash
wget https://z.cash/downloads/zcash-5.7.0-linux64.tar.gz
tar -xvf zcash-5.7.0-linux64.tar.gz
cd zcash-5.7.0

# Create config
mkdir -p ~/.zcash
cat > ~/.zcash/zcash.conf << EOF
testnet=1
rpcuser=zcashbridge
rpcpassword=YOUR_SECURE_PASSWORD
rpcallowip=127.0.0.1
server=1
txindex=1
EOF

# Start node
./bin/zcashd -daemon

# Wait for sync (takes several hours)
./bin/zcash-cli getblockchaininfo
```

### **Update Relayer to Use Real Zcash**:

```typescript
// relayer/src/watcher.ts - UPDATE
import { ZcashClient } from './zcash-client';

export class ZcashWatcher {
  private zcashClient: ZcashClient;

  constructor(rpcUrl: string, rpcUser: string, rpcPassword: string) {
    this.zcashClient = new ZcashClient(rpcUrl, rpcUser, rpcPassword);
  }

  async start() {
    console.log('👀 Watching Zcash testnet...');
    
    // Watch for new blocks
    await this.zcashClient.watchBlocks(async (blockHeight) => {
      console.log(`📦 New block: ${blockHeight}`);
      await this.processBlock(blockHeight);
    });
  }

  async processBlock(blockHeight: number) {
    // Get block transactions
    const blockHash = await this.zcashClient.call('getblockhash', [blockHeight]);
    const block = await this.zcashClient.call('getblock', [blockHash, 2]);
    
    // Find shielded transactions
    for (const tx of block.tx) {
      if (tx.vShieldedOutput && tx.vShieldedOutput.length > 0) {
        for (let i = 0; i < tx.vShieldedOutput.length; i++) {
          const commitment = tx.vShieldedOutput[i].cmu;
          console.log(`🔐 Found commitment: ${commitment}`);
          
          // Process this commitment
          await this.processCommitment(commitment, tx.txid);
        }
      }
    }
  }
}
```

---

## 2️⃣ **Deploy to Mina Testnet (Berkeley)**

### **Setup Mina Account**:

```bash
# Install Mina CLI
npm install -g mina-signer

# Generate keys
cd mina-snark
bun run src/generate-keys.ts
```

Create `mina-snark/src/generate-keys.ts`:

```typescript
import { PrivateKey, PublicKey } from 'o1js';
import fs from 'fs';

// Generate deployer key
const deployerKey = PrivateKey.random();
const deployerAddress = deployerKey.toPublicKey();

// Generate zkApp key
const zkAppKey = PrivateKey.random();
const zkAppAddress = zkAppKey.toPublicKey();

// Save keys
const keys = {
  deployer: {
    privateKey: deployerKey.toBase58(),
    publicKey: deployerAddress.toBase58()
  },
  zkApp: {
    privateKey: zkAppKey.toBase58(),
    publicKey: zkAppAddress.toBase58()
  }
};

fs.writeFileSync('keys.json', JSON.stringify(keys, null, 2));

console.log('🔑 Keys generated and saved to keys.json');
console.log('\n📝 Deployer Address:', deployerAddress.toBase58());
console.log('📝 zkApp Address:', zkAppAddress.toBase58());
console.log('\n⚠️  IMPORTANT: Keep keys.json secure and never commit it!');
console.log('\n💰 Fund deployer address with testnet MINA:');
console.log('   https://faucet.minaprotocol.com/');
```

### **Get Testnet MINA**:

1. Run: `bun run src/generate-keys.ts`
2. Copy the deployer address
3. Go to: https://faucet.minaprotocol.com/
4. Request testnet MINA (free!)

### **Deploy zkApp to Mina Testnet**:

Create `mina-snark/src/deploy.ts`:

```typescript
import { Mina, PrivateKey, AccountUpdate, fetchAccount } from 'o1js';
import { ZcashBridge } from './ZcashBridge.js';
import fs from 'fs';

async function deploy() {
  console.log('🚀 Deploying ZcashBridge to Mina Berkeley Testnet...\n');

  // Load keys
  const keys = JSON.parse(fs.readFileSync('keys.json', 'utf8'));
  const deployerKey = PrivateKey.fromBase58(keys.deployer.privateKey);
  const zkAppKey = PrivateKey.fromBase58(keys.zkApp.privateKey);
  const zkAppAddress = zkAppKey.toPublicKey();

  // Connect to Berkeley testnet
  const Berkeley = Mina.Network({
    mina: 'https://api.minascan.io/node/berkeley/v1/graphql',
    archive: 'https://api.minascan.io/archive/berkeley/v1/graphql'
  });
  Mina.setActiveInstance(Berkeley);

  console.log('📡 Connected to Berkeley testnet');
  console.log('📍 Deployer:', deployerKey.toPublicKey().toBase58());
  console.log('📍 zkApp:', zkAppAddress.toBase58());

  // Compile contract
  console.log('\n🔧 Compiling ZcashBridge...');
  const { verificationKey } = await ZcashBridge.compile();
  console.log('✅ Compilation complete');

  // Create zkApp instance
  const zkApp = new ZcashBridge(zkAppAddress);

  // Deploy transaction
  console.log('\n📤 Creating deployment transaction...');
  const deployTx = await Mina.transaction(
    { sender: deployerKey.toPublicKey(), fee: 0.1e9 },
    () => {
      AccountUpdate.fundNewAccount(deployerKey.toPublicKey());
      zkApp.deploy();
    }
  );

  await deployTx.prove();
  await deployTx.sign([deployerKey, zkAppKey]).send();

  console.log('✅ Deployment transaction sent!');
  console.log('\n🎉 ZcashBridge deployed successfully!');
  console.log('📍 Contract address:', zkAppAddress.toBase58());
  console.log('\n🔍 View on explorer:');
  console.log(`   https://minascan.io/berkeley/account/${zkAppAddress.toBase58()}`);

  // Save deployment info
  const deployment = {
    network: 'berkeley',
    zkAppAddress: zkAppAddress.toBase58(),
    deployedAt: new Date().toISOString(),
    verificationKey: verificationKey.data
  };
  fs.writeFileSync('deployment.json', JSON.stringify(deployment, null, 2));
}

deploy().catch(console.error);
```

**Deploy**:

```bash
cd mina-snark
bun run src/generate-keys.ts
# Fund the deployer address from faucet
bun run src/deploy.ts
```

---

## 3️⃣ **Deploy Relayer Service**

### **Recommended: Deploy to VPS**

**Best options**:
- **DigitalOcean** - $12/month droplet
- **AWS EC2** - t3.small instance
- **Hetzner** - €5/month VPS
- **Railway.app** - Easy deployment

### **Option A: Deploy to Railway.app** (Easiest)

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
railway login
```

2. **Create `railway.json`**:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd relayer && bun run src/index.ts",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

3. **Add environment variables**:
```bash
# Create .env for Railway
cat > relayer/.env.production << EOF
ZCASH_RPC_URL=http://your-zcash-node:8232
ZCASH_RPC_USER=zcashbridge
ZCASH_RPC_PASSWORD=YOUR_PASSWORD
MINA_ENDPOINT=https://api.minascan.io/node/berkeley/v1/graphql
MINA_ARCHIVE=https://api.minascan.io/archive/berkeley/v1/graphql
ZKAPP_ADDRESS=<your-deployed-zkapp-address>
DEPLOYER_KEY=<your-deployer-private-key>
POLL_INTERVAL=60000
EOF
```

4. **Deploy**:
```bash
railway init
railway up
```

### **Option B: Deploy to DigitalOcean** (More control)

1. **Create Droplet**:
   - Ubuntu 22.04
   - 2GB RAM minimum
   - $12/month

2. **SSH and setup**:
```bash
ssh root@your-droplet-ip

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Clone your repo
git clone <your-repo-url>
cd zypherpunk/relayer

# Install dependencies
bun install

# Setup environment
cp .env.example .env
nano .env  # Edit with your values

# Install PM2 for process management
npm install -g pm2

# Start relayer
pm2 start "bun run src/index.ts" --name zcash-mina-relayer
pm2 save
pm2 startup
```

3. **Setup monitoring**:
```bash
# View logs
pm2 logs zcash-mina-relayer

# Monitor status
pm2 monit
```

---

## 4️⃣ **Update Configuration**

### **Create Production Config**:

```typescript
// config/production.ts
export const config = {
  zcash: {
    network: 'testnet',
    rpcUrl: process.env.ZCASH_RPC_URL || 'http://localhost:18232',
    rpcUser: process.env.ZCASH_RPC_USER || 'zcashbridge',
    rpcPassword: process.env.ZCASH_RPC_PASSWORD || '',
  },
  mina: {
    network: 'berkeley',
    endpoint: process.env.MINA_ENDPOINT || 'https://api.minascan.io/node/berkeley/v1/graphql',
    archive: process.env.MINA_ARCHIVE || 'https://api.minascan.io/archive/berkeley/v1/graphql',
    zkAppAddress: process.env.ZKAPP_ADDRESS || '',
    deployerKey: process.env.DEPLOYER_KEY || '',
  },
  relayer: {
    pollInterval: parseInt(process.env.POLL_INTERVAL || '60000'),
    batchSize: parseInt(process.env.BATCH_SIZE || '10'),
  }
};
```

---

## 5️⃣ **Testing the Live Deployment**

### **Test Flow**:

1. **Create Zcash Testnet Transaction**:
```bash
# Using Zcash CLI
zcash-cli -testnet z_sendmany \
  "your_z_address" \
  '[{"address":"bridge_z_address","amount":0.01}]'
```

2. **Monitor Relayer**:
```bash
# Watch relayer logs
pm2 logs zcash-mina-relayer

# Should see:
# 📬 New deposit detected!
# 🔐 Generating proof...
# ✅ Proof generated
# 📤 Submitting to Mina...
# ✅ Submitted! Tx: ...
```

3. **Verify on Mina**:
```bash
# Check zkApp state
https://minascan.io/berkeley/account/<your-zkapp-address>
```

---

## 📊 **Deployment Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                      │
└─────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  Zcash Testnet   │         │   VPS/Railway    │         │  Mina Berkeley   │
│                  │         │                  │         │                  │
│  • Real network  │────────▶│  • Relayer       │────────▶│  • zkApp         │
│  • Testnet coins │  RPC    │  • Watcher       │  GraphQL│  • Verification  │
│  • Shielded pool │         │  • Prover        │         │  • State         │
└──────────────────┘         │  • Submitter     │         └──────────────────┘
                             │  • PM2/Docker    │
                             └──────────────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │   Monitoring     │
                             │  • Logs          │
                             │  • Metrics       │
                             │  • Alerts        │
                             └──────────────────┘
```

---

## 🎬 **Demo Preparation**

### **For Your PoC Demo**:

1. **Setup Demo Script**:
```bash
#!/bin/bash
# demo-live.sh

echo "🎬 Zcash-Mina Bridge Live Demo"
echo "================================"
echo ""

# Step 1: Show Zcash testnet transaction
echo "1️⃣ Creating Zcash testnet transaction..."
TXID=$(zcash-cli -testnet z_sendmany "..." '[...]')
echo "   Tx: $TXID"
echo ""

# Step 2: Show relayer detecting
echo "2️⃣ Relayer detecting deposit..."
sleep 30
curl http://your-relayer/status
echo ""

# Step 3: Show Mina verification
echo "3️⃣ Checking Mina zkApp..."
curl "https://api.minascan.io/node/berkeley/v1/graphql" \
  -d '{"query": "query { account(publicKey: \"...\") { balance } }"}'
echo ""

echo "✅ Demo complete!"
```

2. **Prepare Demo Presentation**:
   - Show Zcash testnet explorer
   - Show relayer logs (live)
   - Show Mina explorer
   - Explain privacy preservation

---

## 💰 **Cost Estimate**

### **Testnet Deployment** (Recommended for PoC):

```
Item                    Cost
────────────────────────────────
Zcash testnet          FREE (use public RPC)
Mina testnet           FREE (faucet coins)
VPS (DigitalOcean)     $12/month
Domain (optional)      $10/year
────────────────────────────────
Total                  ~$12/month
```

### **Mainnet Deployment** (Future):

```
Item                    Cost
────────────────────────────────
Zcash node             $50-100/month (VPS)
Mina node              $50/month (VPS)
Relayer VPS            $20/month
Security audit         $20,000-50,000
Insurance              Variable
────────────────────────────────
Total                  $120/month + $20k+ audit
```

---

## ⚠️ **Important Security Notes**

### **For Testnet Demo**:
✅ Safe to use
✅ No real money
✅ Good for PoC

### **Before Mainnet**:
❌ **DO NOT deploy to mainnet without**:
1. Professional security audit
2. Formal verification
3. Bug bounty program
4. Insurance coverage
5. Multi-sig relayer committee
6. Emergency pause mechanism
7. Comprehensive testing

---

## 📋 **Deployment Checklist**

### **Phase 1: Testnet (1-2 days)**

- [ ] Setup Zcash testnet access (RPC or node)
- [ ] Generate Mina testnet keys
- [ ] Get testnet MINA from faucet
- [ ] Compile and deploy zkApp to Berkeley
- [ ] Deploy relayer to VPS/Railway
- [ ] Update relayer with real Zcash client
- [ ] Test end-to-end flow
- [ ] Prepare demo script
- [ ] Document deployment

### **Phase 2: Mainnet (2-4 weeks + audit)**

- [ ] Security audit ($20k-50k)
- [ ] Formal verification
- [ ] Bug bounty program
- [ ] Setup multi-sig relayer committee
- [ ] Implement emergency pause
- [ ] Setup monitoring and alerts
- [ ] Get insurance coverage
- [ ] Deploy to mainnet
- [ ] Gradual rollout with limits

---

## 🚀 **Quick Start for Demo**

**Fastest path to live demo** (2-3 hours):

```bash
# 1. Generate Mina keys
cd mina-snark
bun run src/generate-keys.ts

# 2. Get testnet MINA
# Visit: https://faucet.minaprotocol.com/

# 3. Deploy zkApp
bun run src/deploy.ts

# 4. Deploy relayer to Railway
cd ../relayer
railway init
railway up

# 5. Configure Zcash RPC
# Use public testnet RPC or run node

# 6. Test!
# Create Zcash testnet transaction
# Watch relayer process it
# Verify on Mina explorer
```

---

## 📚 **Resources**

### **Zcash**:
- Testnet faucet: https://faucet.testnet.z.cash/
- Explorer: https://explorer.testnet.z.cash/
- RPC docs: https://zcash.readthedocs.io/

### **Mina**:
- Berkeley faucet: https://faucet.minaprotocol.com/
- Explorer: https://minascan.io/berkeley
- Docs: https://docs.minaprotocol.com/

### **Deployment**:
- Railway: https://railway.app/
- DigitalOcean: https://www.digitalocean.com/
- PM2: https://pm2.keymetrics.io/

---

## 🎯 **Recommended Approach for Your PoC**

**For a convincing demo**:

1. ✅ **Use Zcash Testnet** - Real blockchain, no risk
2. ✅ **Deploy to Mina Berkeley** - Real Mina testnet
3. ✅ **Host relayer on Railway** - Easy deployment
4. ✅ **Create demo script** - Automated demonstration
5. ✅ **Record video** - Show it working live

**Timeline**: 1-2 days
**Cost**: ~$12/month
**Risk**: None (testnet only)

---

## 📞 **Need Help?**

If you get stuck:
1. Check logs: `pm2 logs`
2. Verify config: Check .env files
3. Test connections: `curl` endpoints
4. Review docs: Zcash + Mina documentation

**Ready to deploy?** Start with testnet deployment above! 🚀

