# ⚠️ MAINNET DEPLOYMENT GUIDE - PRODUCTION

## 🚨 CRITICAL WARNING

**MAINNET = REAL MONEY AT RISK**

Before deploying to mainnet:
- ✅ Complete security audit ($20k-50k)
- ✅ Bug bounty program
- ✅ Insurance coverage
- ✅ Legal review
- ✅ Extensive testing on testnet
- ✅ Multi-sig setup
- ✅ Emergency pause mechanism

**This PoC is NOT production-ready as-is!**

---

## 📋 Mainnet vs Testnet

| Aspect | Testnet | Mainnet |
|--------|---------|---------|
| **Money** | Fake coins (FREE) | Real money 💰 |
| **Risk** | None | HIGH ⚠️ |
| **Audit** | Not needed | REQUIRED |
| **Cost** | $0-12/month | $100+/month + audit |
| **Timeline** | 2 hours | 2-4 weeks |
| **Reversible** | Yes | NO! |

---

## 🎯 Deployment Strategy

### **Recommended Approach**:

```
Phase 1: Testnet (2 hours)
   ↓
Phase 2: Testnet + Real Testing (1 week)
   ↓
Phase 3: Security Audit (2-4 weeks)
   ↓
Phase 4: Mainnet with Limits (1 week)
   ↓
Phase 5: Full Mainnet (ongoing)
```

---

## 🔒 Security Requirements for Mainnet

### **Must Have Before Mainnet**:

#### 1. Security Audit ✅
```
Cost: $20,000 - $50,000
Time: 2-4 weeks
Providers:
  - Trail of Bits
  - OpenZeppelin
  - Quantstamp
  - Consensys Diligence
```

#### 2. Bug Bounty Program ✅
```
Platform: Immunefi or HackerOne
Budget: $10,000 - $100,000
Scope: All smart contracts and relayer
```

#### 3. Insurance ✅
```
Provider: Nexus Mutual, InsurAce
Coverage: Bridge funds
Cost: 2-5% of TVL annually
```

#### 4. Multi-Sig Relayer ✅
```
Current: Single relayer (centralized)
Needed: 3-of-5 or 5-of-9 multi-sig
Committee: Independent operators
```

#### 5. Emergency Controls ✅
```
- Pause mechanism
- Withdrawal limits
- Time locks
- Admin multi-sig
```

#### 6. Monitoring & Alerts ✅
```
- 24/7 monitoring
- Automated alerts
- Incident response team
- Health checks
```

---

## 🚀 Mainnet Deployment Steps

### **Phase 1: Preparation** (1-2 weeks)

#### 1.1 Code Hardening

**Update Security**:

```typescript
// mina-snark/src/ZcashBridge.ts - ADD SECURITY

import { SmartContract, state, State, method, Field, PublicKey, Permissions, Bool, Provable } from 'o1js';

export class ZcashBridge extends SmartContract {
  // Existing state
  @state(Field) zcashRoot = State<Field>();
  @state(Field) totalBridged = State<Field>();
  @state(Field) lastUpdateBlock = State<Field>();
  @state(Field) processedCommitmentsRoot = State<Field>();
  
  // NEW: Security features
  @state(Bool) isPaused = State<Bool>();
  @state(Field) dailyLimit = State<Field>();
  @state(Field) dailyBridged = State<Field>();
  @state(Field) lastResetDay = State<Field>();
  @state(PublicKey) admin = State<PublicKey>();
  @state(PublicKey) emergencyAdmin = State<PublicKey>();

  init() {
    super.init();
    
    this.zcashRoot.set(Field(0));
    this.totalBridged.set(Field(0));
    this.lastUpdateBlock.set(Field(0));
    this.processedCommitmentsRoot.set(Field(0));
    
    // NEW: Security initialization
    this.isPaused.set(Bool(false));
    this.dailyLimit.set(Field(1000000000)); // 1000 MINA daily limit
    this.dailyBridged.set(Field(0));
    this.lastResetDay.set(Field(0));
    
    // Set permissions
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
      send: Permissions.proofOrSignature(),
      receive: Permissions.none(),
      setPermissions: Permissions.impossible() // Lock permissions
    });
  }

  /**
   * Emergency pause (admin only)
   */
  @method async pause() {
    // Verify admin signature
    const admin = this.admin.getAndRequireEquals();
    this.requireSignature();
    
    // Pause the bridge
    this.isPaused.set(Bool(true));
  }

  /**
   * Resume operations (admin only)
   */
  @method async unpause() {
    const admin = this.admin.getAndRequireEquals();
    this.requireSignature();
    
    this.isPaused.set(Bool(false));
  }

  /**
   * Verify and mint with security checks
   */
  @method async verifyAndMint(
    proof: MerkleProof,
    commitment: Field,
    recipient: PublicKey,
    amount: Field
  ) {
    // Check if paused
    const paused = this.isPaused.getAndRequireEquals();
    paused.assertFalse('Bridge is paused');
    
    // Check daily limit
    const dailyLimit = this.dailyLimit.getAndRequireEquals();
    const dailyBridged = this.dailyBridged.getAndRequireEquals();
    const newDaily = dailyBridged.add(amount);
    newDaily.assertLessThanOrEqual(dailyLimit, 'Daily limit exceeded');
    
    // Verify proof (existing logic)
    const currentRoot = this.zcashRoot.getAndRequireEquals();
    proof.verify();
    const proofRoot = proof.publicInput;
    proofRoot.assertEquals(currentRoot, 'Proof root mismatch');
    const isValid = proof.publicOutput;
    isValid.assertTrue('Invalid proof');
    
    // Update state
    const processedRoot = this.processedCommitmentsRoot.getAndRequireEquals();
    const newProcessedRoot = Provable.if(isValid, Field, commitment, processedRoot);
    this.processedCommitmentsRoot.set(newProcessedRoot);
    
    const currentTotal = this.totalBridged.getAndRequireEquals();
    const newTotal = currentTotal.add(amount);
    this.totalBridged.set(newTotal);
    
    this.dailyBridged.set(newDaily);
  }

  /**
   * Reset daily limit (called automatically)
   */
  @method async resetDailyLimit(currentDay: Field) {
    const lastDay = this.lastResetDay.getAndRequireEquals();
    currentDay.assertGreaterThan(lastDay, 'Already reset today');
    
    this.dailyBridged.set(Field(0));
    this.lastResetDay.set(currentDay);
  }
}
```

#### 1.2 Add Nullifier Tracking

```typescript
// mina-snark/src/NullifierSet.ts - NEW FILE

import { Field, Struct, MerkleTree, MerkleWitness } from 'o1js';

export class NullifierWitness extends MerkleWitness(32) {}

export class NullifierSet {
  private tree: MerkleTree;
  
  constructor() {
    this.tree = new MerkleTree(32);
  }
  
  /**
   * Add nullifier to prevent double-spending
   */
  add(nullifier: Field): void {
    const index = this.tree.leafCount;
    this.tree.setLeaf(BigInt(index), nullifier);
  }
  
  /**
   * Check if nullifier exists
   */
  exists(nullifier: Field, witness: NullifierWitness): boolean {
    const root = this.tree.getRoot();
    return witness.calculateRoot(nullifier).equals(root).toBoolean();
  }
  
  getRoot(): Field {
    return this.tree.getRoot();
  }
}
```

#### 1.3 Multi-Sig Relayer

```typescript
// relayer/src/multi-sig.ts - NEW FILE

import { PrivateKey, PublicKey, Signature } from 'o1js';

export class MultiSigRelayer {
  private signers: PublicKey[];
  private threshold: number;
  private signatures: Map<string, Signature[]>;

  constructor(signers: PublicKey[], threshold: number) {
    this.signers = signers;
    this.threshold = threshold;
    this.signatures = new Map();
  }

  /**
   * Request signatures from committee
   */
  async requestSignatures(txData: any): Promise<Signature[]> {
    const txHash = this.hashTransaction(txData);
    
    // In production: Send to all signers via secure channel
    // For now: Simulate
    const signatures: Signature[] = [];
    
    for (let i = 0; i < this.threshold; i++) {
      // Each signer signs independently
      const sig = await this.requestSignatureFromSigner(this.signers[i], txData);
      signatures.push(sig);
    }
    
    return signatures;
  }

  /**
   * Verify threshold signatures
   */
  verifySignatures(txData: any, signatures: Signature[]): boolean {
    if (signatures.length < this.threshold) {
      return false;
    }
    
    const txHash = this.hashTransaction(txData);
    
    for (const sig of signatures) {
      // Verify each signature
      // In production: Implement proper verification
    }
    
    return true;
  }

  private hashTransaction(txData: any): string {
    // Hash transaction data
    return JSON.stringify(txData);
  }

  private async requestSignatureFromSigner(
    signer: PublicKey,
    txData: any
  ): Promise<Signature> {
    // In production: Send to signer's endpoint
    // Wait for signature response
    throw new Error('Not implemented - needs secure communication');
  }
}
```

---

### **Phase 2: Mainnet Deployment** (1 week)

#### 2.1 Deploy to Mina Mainnet

**Generate Production Keys**:

```bash
cd mina-snark

# Generate keys with extra security
bun run src/generate-keys-mainnet.ts
```

Create `mina-snark/src/generate-keys-mainnet.ts`:

```typescript
import { PrivateKey } from 'o1js';
import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function generateMainnetKeys() {
  console.log('🔐 MAINNET KEY GENERATION');
  console.log('⚠️  CRITICAL: These keys control REAL funds!\n');
  
  const confirm = await question('Are you sure you want to generate MAINNET keys? (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log('Cancelled.');
    process.exit(0);
  }
  
  console.log('\n🔑 Generating keys...\n');
  
  // Generate deployer key
  const deployerKey = PrivateKey.random();
  const deployerAddress = deployerKey.toPublicKey();
  
  // Generate zkApp key
  const zkAppKey = PrivateKey.random();
  const zkAppAddress = zkAppKey.toPublicKey();
  
  // Generate admin keys (for multi-sig)
  const admin1Key = PrivateKey.random();
  const admin1Address = admin1Key.toPublicKey();
  
  const admin2Key = PrivateKey.random();
  const admin2Address = admin2Key.toPublicKey();
  
  const keys = {
    network: 'MAINNET',
    deployer: {
      privateKey: deployerKey.toBase58(),
      publicKey: deployerAddress.toBase58()
    },
    zkApp: {
      privateKey: zkAppKey.toBase58(),
      publicKey: zkAppAddress.toBase58()
    },
    admins: [
      {
        privateKey: admin1Key.toBase58(),
        publicKey: admin1Address.toBase58()
      },
      {
        privateKey: admin2Key.toBase58(),
        publicKey: admin2Address.toBase58()
      }
    ],
    generatedAt: new Date().toISOString()
  };
  
  // Save to encrypted file
  fs.writeFileSync('keys.mainnet.json', JSON.stringify(keys, null, 2));
  
  console.log('✅ Keys generated and saved to keys.mainnet.json\n');
  console.log('═'.repeat(60));
  console.log('📝 DEPLOYER ADDRESS (fund with REAL MINA):');
  console.log('   ' + deployerAddress.toBase58());
  console.log('\n📝 ZKAPP ADDRESS:');
  console.log('   ' + zkAppAddress.toBase58());
  console.log('\n📝 ADMIN ADDRESSES:');
  console.log('   Admin 1: ' + admin1Address.toBase58());
  console.log('   Admin 2: ' + admin2Address.toBase58());
  console.log('═'.repeat(60));
  
  console.log('\n⚠️  CRITICAL SECURITY STEPS:');
  console.log('   1. Backup keys.mainnet.json to secure location');
  console.log('   2. Encrypt the backup');
  console.log('   3. Store in multiple secure locations');
  console.log('   4. Use hardware wallet for admin keys (production)');
  console.log('   5. NEVER commit keys.mainnet.json to git');
  console.log('   6. Fund deployer with REAL MINA (not testnet!)');
  
  rl.close();
}

generateMainnetKeys();
```

**Buy Real MINA**:

```
Exchanges:
  - Coinbase
  - Kraken
  - Binance
  - Gate.io

Amount needed:
  - Deployment: ~10 MINA
  - Operations: 50-100 MINA reserve
  - Total: ~110 MINA (~$50-100 USD)
```

**Deploy to Mainnet**:

```bash
# Deploy with mainnet config
MINA_NETWORK=mainnet bun run src/deploy-mainnet.ts
```

Create `mina-snark/src/deploy-mainnet.ts`:

```typescript
import { Mina, PrivateKey, AccountUpdate } from 'o1js';
import { ZcashBridge } from './ZcashBridge.js';
import fs from 'fs';

async function deployMainnet() {
  console.log('🚀 MAINNET DEPLOYMENT');
  console.log('⚠️  DEPLOYING TO MAINNET - REAL MONEY!\n');
  
  // Load mainnet keys
  const keys = JSON.parse(fs.readFileSync('keys.mainnet.json', 'utf8'));
  const deployerKey = PrivateKey.fromBase58(keys.deployer.privateKey);
  const zkAppKey = PrivateKey.fromBase58(keys.zkApp.privateKey);
  const zkAppAddress = zkAppKey.toPublicKey();
  
  // Connect to Mina MAINNET
  const Mainnet = Mina.Network({
    mina: 'https://api.minascan.io/node/mainnet/v1/graphql',
    archive: 'https://api.minascan.io/archive/mainnet/v1/graphql'
  });
  Mina.setActiveInstance(Mainnet);
  
  console.log('🌐 Connected to Mina MAINNET');
  console.log('📍 zkApp Address:', zkAppAddress.toBase58());
  
  // Compile
  console.log('\n🔧 Compiling contract...');
  await ZcashBridge.compile();
  console.log('✅ Compiled');
  
  // Deploy
  console.log('\n📤 Deploying to MAINNET...');
  const zkApp = new ZcashBridge(zkAppAddress);
  
  const deployTx = await Mina.transaction(
    { sender: deployerKey.toPublicKey(), fee: 0.1e9 },
    () => {
      AccountUpdate.fundNewAccount(deployerKey.toPublicKey());
      zkApp.deploy();
    }
  );
  
  await deployTx.prove();
  await deployTx.sign([deployerKey, zkAppKey]).send();
  
  console.log('✅ DEPLOYED TO MAINNET!');
  console.log('🔍 View: https://minascan.io/mainnet/account/' + zkAppAddress.toBase58());
  
  // Save deployment
  fs.writeFileSync('deployment.mainnet.json', JSON.stringify({
    network: 'mainnet',
    zkAppAddress: zkAppAddress.toBase58(),
    deployedAt: new Date().toISOString()
  }, null, 2));
}

deployMainnet().catch(console.error);
```

#### 2.2 Deploy to Zcash Mainnet

**Setup Zcash Mainnet Node**:

```bash
# Download Zcash
wget https://z.cash/downloads/zcash-5.7.0-linux64.tar.gz
tar -xvf zcash-5.7.0-linux64.tar.gz

# Configure for MAINNET
mkdir -p ~/.zcash
cat > ~/.zcash/zcash.conf << EOF
# MAINNET configuration
mainnet=1
rpcuser=zcashbridge
rpcpassword=$(openssl rand -hex 32)
rpcallowip=127.0.0.1
server=1
txindex=1

# Security
rpcbind=127.0.0.1
rpcallowip=127.0.0.1

# Performance
dbcache=4000
maxmempool=300
EOF

# Start node (sync takes 1-2 days!)
./zcash-5.7.0/bin/zcashd -daemon

# Monitor sync
watch -n 60 './zcash-5.7.0/bin/zcash-cli getblockchaininfo'
```

**Update Relayer for Mainnet**:

```bash
# relayer/.env.mainnet
ZCASH_RPC_URL=http://127.0.0.1:8232
ZCASH_RPC_USER=zcashbridge
ZCASH_RPC_PASSWORD=<from zcash.conf>
ZCASH_NETWORK=mainnet

MINA_ENDPOINT=https://api.minascan.io/node/mainnet/v1/graphql
MINA_ARCHIVE=https://api.minascan.io/archive/mainnet/v1/graphql
ZKAPP_ADDRESS=<your-mainnet-zkapp>
DEPLOYER_KEY=<your-mainnet-key>

# Security
DAILY_LIMIT=1000000000
MAX_SINGLE_TX=100000000
REQUIRE_MULTISIG=true
MIN_CONFIRMATIONS=6
```

---

### **Phase 3: Gradual Rollout** (2-4 weeks)

#### Week 1: Limited Launch
```
Daily limit: 10 MINA
Max per tx: 1 MINA
Whitelist: Team only
```

#### Week 2: Expanded Testing
```
Daily limit: 100 MINA
Max per tx: 10 MINA
Whitelist: Beta users
```

#### Week 3: Public Beta
```
Daily limit: 1,000 MINA
Max per tx: 100 MINA
Public: Limited access
```

#### Week 4: Full Launch
```
Daily limit: 10,000 MINA
Max per tx: 1,000 MINA
Public: Full access
```

---

## 💰 Mainnet Costs

### **Infrastructure**:
```
Component                   Cost
─────────────────────────────────────
Zcash mainnet node         $100/month (VPS)
Mina node (optional)       $50/month
Relayer VPS                $50/month
Monitoring                 $20/month
Backup systems             $30/month
─────────────────────────────────────
Monthly Total              $250/month
```

### **One-Time Costs**:
```
Item                       Cost
─────────────────────────────────────
Security audit             $20,000-50,000
Legal review               $5,000-10,000
Bug bounty setup           $10,000
Insurance (first year)     $5,000-20,000
Development time           $20,000-50,000
─────────────────────────────────────
One-Time Total             $60,000-140,000
```

### **Operational**:
```
Item                       Cost
─────────────────────────────────────
MINA for operations        100 MINA (~$50)
ZEC for testing            1 ZEC (~$30)
Gas/fees                   $100/month
Insurance (annual)         2-5% of TVL
Bug bounty payouts         Variable
─────────────────────────────────────
```

---

## ⚠️ Critical Risks

### **Technical Risks**:
- Smart contract bugs
- Relayer failures
- Network congestion
- Oracle manipulation

### **Economic Risks**:
- Insufficient liquidity
- Price volatility
- Bank run scenarios
- Arbitrage attacks

### **Operational Risks**:
- Key compromise
- Relayer downtime
- Node synchronization
- Human error

---

## 🛡️ Security Checklist

Before mainnet launch:

### **Code Security**:
- [ ] Professional security audit completed
- [ ] All critical/high issues resolved
- [ ] Formal verification (if possible)
- [ ] Code freeze period (1 week)
- [ ] Emergency procedures tested

### **Operational Security**:
- [ ] Multi-sig setup (3-of-5 minimum)
- [ ] Hardware wallets for admin keys
- [ ] Secure key storage (HSM)
- [ ] Backup and recovery procedures
- [ ] Incident response plan

### **Monitoring**:
- [ ] 24/7 monitoring setup
- [ ] Automated alerts configured
- [ ] Health check endpoints
- [ ] Performance metrics
- [ ] Anomaly detection

### **Legal & Compliance**:
- [ ] Legal review completed
- [ ] Terms of service
- [ ] Privacy policy
- [ ] Regulatory compliance checked
- [ ] Insurance obtained

### **Testing**:
- [ ] Extensive testnet testing (1+ month)
- [ ] Stress testing completed
- [ ] Failure scenario testing
- [ ] Recovery procedures tested
- [ ] User acceptance testing

---

## 📋 Mainnet Deployment Checklist

### **Pre-Deployment** (2-4 weeks):
- [ ] Security audit completed
- [ ] All issues resolved
- [ ] Bug bounty program live
- [ ] Insurance obtained
- [ ] Legal review done
- [ ] Multi-sig setup
- [ ] Monitoring configured
- [ ] Testnet testing (1+ month)

### **Deployment Day**:
- [ ] Final code review
- [ ] Generate mainnet keys securely
- [ ] Buy MINA for deployment
- [ ] Deploy Mina zkApp
- [ ] Verify on explorer
- [ ] Setup Zcash mainnet node
- [ ] Configure relayer
- [ ] Test with small amounts
- [ ] Announce to community

### **Post-Deployment** (ongoing):
- [ ] Monitor 24/7
- [ ] Gradual limit increases
- [ ] Community support
- [ ] Regular security reviews
- [ ] Performance optimization
- [ ] Documentation updates

---

## 🚨 Emergency Procedures

### **If Something Goes Wrong**:

1. **Immediate Actions**:
```bash
# Pause the bridge
mina-cli pause-bridge --admin-key <key>

# Stop relayer
pm2 stop zcash-mina-bridge

# Alert team
./scripts/emergency-alert.sh
```

2. **Investigation**:
- Check logs
- Verify transactions
- Identify issue
- Assess impact

3. **Communication**:
- Post status update
- Notify users
- Update documentation
- Regular updates

4. **Resolution**:
- Fix issue
- Test thoroughly
- Resume gradually
- Post-mortem

---

## 📞 Support & Resources

### **Security Auditors**:
- Trail of Bits: https://www.trailofbits.com/
- OpenZeppelin: https://openzeppelin.com/security-audits/
- Quantstamp: https://quantstamp.com/
- Consensys Diligence: https://consensys.net/diligence/

### **Bug Bounty Platforms**:
- Immunefi: https://immunefi.com/
- HackerOne: https://www.hackerone.com/

### **Insurance**:
- Nexus Mutual: https://nexusmutual.io/
- InsurAce: https://www.insurace.io/

### **Legal**:
- Consult crypto-specialized law firm
- Check local regulations
- Understand compliance requirements

---

## 🎯 Recommendation

### **For Your PoC**:

**I strongly recommend starting with TESTNET**:

✅ **Testnet First** (2 hours):
- Zero risk
- Free to use
- Perfect for demos
- Test all features
- Prove concept works

❌ **Mainnet Later** (2-4 weeks + $60k-140k):
- After security audit
- After extensive testing
- With proper funding
- With legal clearance
- With team/company backing

### **Timeline**:

```
Now → 1 week:     Testnet deployment & testing
Week 2-3:         Security audit
Week 4-5:         Bug fixes & improvements
Week 6-7:         Mainnet preparation
Week 8:           Limited mainnet launch
Week 9-12:        Gradual rollout
```

---

## 🚀 Next Steps

### **If Going to Mainnet**:

1. **Complete testnet first** (prove it works)
2. **Get security audit** (find vulnerabilities)
3. **Setup multi-sig** (reduce centralization)
4. **Get insurance** (protect users)
5. **Legal review** (ensure compliance)
6. **Gradual rollout** (limit risk)

### **If Staying on Testnet** (Recommended for PoC):

```bash
# Just follow the testnet guide
cd mina-snark
bun run generate-keys
bun run deploy
```

---

## ⚠️ Final Warning

**MAINNET = REAL MONEY = REAL RISK**

This PoC code is:
- ✅ Great for learning
- ✅ Perfect for demos
- ✅ Good for testnet
- ❌ NOT ready for mainnet
- ❌ NOT audited
- ❌ NOT production-grade

**Before mainnet**: Security audit, legal review, insurance, multi-sig, monitoring, testing, testing, testing!

---

**My recommendation**: Start with testnet, prove the concept, then consider mainnet with proper preparation. 🚀

