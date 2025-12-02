/**
 * Deploy ZcashBridge to Mina MAINNET
 * ⚠️ MAINNET = REAL MONEY
 * 
 * Run: bun run src/deploy-mainnet.ts
 */

import { Mina, PrivateKey, AccountUpdate, fetchAccount } from 'o1js';
import { ZcashBridge } from './ZcashBridge.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function deployMainnet() {
  console.log('');
  console.log('═'.repeat(60));
  console.log('🚀 MINA MAINNET DEPLOYMENT');
  console.log('═'.repeat(60));
  console.log('');
  console.log('⚠️  WARNING: This will deploy to MAINNET!');
  console.log('⚠️  Real MINA will be spent. This is NOT reversible.');
  console.log('');

  // Check if keys exist
  const keysPath = path.join(process.cwd(), 'keys.mainnet.json');
  if (!fs.existsSync(keysPath)) {
    console.error('❌ keys.mainnet.json not found!');
    console.log('\n📝 First run: bun run src/generate-keys-mainnet.ts');
    rl.close();
    process.exit(1);
  }

  // Load keys
  console.log('🔑 Loading mainnet keys...');
  const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
  
  if (keys.network !== 'MAINNET') {
    console.error('❌ These are not mainnet keys!');
    rl.close();
    process.exit(1);
  }

  const deployerKey = PrivateKey.fromBase58(keys.deployer.privateKey);
  const deployerAddress = deployerKey.toPublicKey();
  const zkAppKey = PrivateKey.fromBase58(keys.zkApp.privateKey);
  const zkAppAddress = zkAppKey.toPublicKey();
  
  console.log('   ✅ Keys loaded');
  console.log('');
  console.log('📍 Deployer: ' + deployerAddress.toBase58());
  console.log('📍 zkApp:    ' + zkAppAddress.toBase58());
  console.log('');

  // Connect to Mina MAINNET
  console.log('🌐 Connecting to Mina MAINNET...');
  const Mainnet = Mina.Network({
    mina: 'https://api.minascan.io/node/mainnet/v1/graphql',
    archive: 'https://api.minascan.io/archive/mainnet/v1/graphql'
  });
  Mina.setActiveInstance(Mainnet);
  console.log('   ✅ Connected to MAINNET');
  console.log('');

  // Check deployer balance
  console.log('💰 Checking deployer balance...');
  try {
    await fetchAccount({ publicKey: deployerAddress });
    const account = Mina.getAccount(deployerAddress);
    const balance = Number(account.balance.toBigInt()) / 1e9;
    console.log(`   Balance: ${balance} MINA`);

    if (balance < 1) {
      console.error('\n❌ Insufficient balance!');
      console.log('   Need at least 1 MINA for deployment');
      console.log('   Send MINA to: ' + deployerAddress.toBase58());
      rl.close();
      process.exit(1);
    }

    console.log('   ✅ Balance sufficient');
    console.log('');
  } catch (error) {
    console.error('\n❌ Could not fetch deployer account');
    console.log('   Make sure you sent MINA to:');
    console.log('   ' + deployerAddress.toBase58());
    console.log('');
    console.log('   Check balance: https://minascan.io/mainnet/account/' + deployerAddress.toBase58());
    rl.close();
    process.exit(1);
  }

  // Final confirmation
  console.log('═'.repeat(60));
  console.log('⚠️  FINAL CONFIRMATION');
  console.log('═'.repeat(60));
  console.log('');
  console.log('You are about to:');
  console.log('  • Deploy ZcashBridge to Mina MAINNET');
  console.log('  • Spend ~0.1 MINA in fees');
  console.log('  • This is NOT reversible');
  console.log('');

  const confirm = await question('Type "DEPLOY" to proceed: ');
  
  if (confirm !== 'DEPLOY') {
    console.log('\n❌ Cancelled.');
    rl.close();
    process.exit(0);
  }

  console.log('');

  // Compile contract
  console.log('🔧 Compiling ZcashBridge contract...');
  console.log('   (This may take 30-60 seconds)');
  const startCompile = Date.now();
  const { verificationKey } = await ZcashBridge.compile();
  const compileTime = ((Date.now() - startCompile) / 1000).toFixed(1);
  console.log(`   ✅ Compilation complete (${compileTime}s)`);
  console.log('');

  // Create zkApp instance
  const zkApp = new ZcashBridge(zkAppAddress);

  // Create deployment transaction
  console.log('📤 Creating deployment transaction...');
  const deployTx = await Mina.transaction(
    {
      sender: deployerAddress,
      fee: 0.1e9, // 0.1 MINA fee
      memo: 'Zcash-Mina Bridge'
    },
    () => {
      AccountUpdate.fundNewAccount(deployerAddress);
      zkApp.deploy();
    }
  );

  // Prove transaction
  console.log('   🔐 Generating proof...');
  const startProve = Date.now();
  await deployTx.prove();
  const proveTime = ((Date.now() - startProve) / 1000).toFixed(1);
  console.log(`   ✅ Proof generated (${proveTime}s)`);

  // Sign and send
  console.log('   ✍️  Signing and sending...');
  const pendingTx = await deployTx.sign([deployerKey, zkAppKey]).send();
  console.log('   ✅ Transaction sent!');
  console.log('');
  console.log('   Transaction hash: ' + pendingTx.hash);
  console.log('');

  // Wait for confirmation
  console.log('⏳ Waiting for confirmation...');
  console.log('   (This may take 3-10 minutes)');
  console.log('');
  console.log('   Track progress:');
  console.log('   https://minascan.io/mainnet/tx/' + pendingTx.hash);
  console.log('');

  // Save deployment info
  const deployment = {
    network: 'MAINNET',
    zkAppAddress: zkAppAddress.toBase58(),
    deployerAddress: deployerAddress.toBase58(),
    transactionHash: pendingTx.hash,
    deployedAt: new Date().toISOString(),
    verificationKeyHash: verificationKey.hash.toString()
  };

  const deploymentPath = path.join(process.cwd(), 'deployment.mainnet.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log('✅ Deployment info saved to deployment.mainnet.json');
  console.log('');

  // Success message
  console.log('═'.repeat(60));
  console.log('🎉 DEPLOYMENT INITIATED!');
  console.log('═'.repeat(60));
  console.log('');
  console.log('📍 Contract Address:');
  console.log('   ' + zkAppAddress.toBase58());
  console.log('');
  console.log('🔍 View on Explorer:');
  console.log('   https://minascan.io/mainnet/account/' + zkAppAddress.toBase58());
  console.log('');
  console.log('📝 Transaction:');
  console.log('   https://minascan.io/mainnet/tx/' + pendingTx.hash);
  console.log('');
  console.log('⏳ Wait 3-10 minutes for confirmation, then:');
  console.log('   1. Verify contract on explorer');
  console.log('   2. Update relayer/.env with zkApp address');
  console.log('   3. Start relayer: cd ../relayer && bun run dev');
  console.log('');

  rl.close();
}

// Run if called directly
if (import.meta.main) {
  deployMainnet().catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    rl.close();
    process.exit(1);
  });
}

export { deployMainnet };

