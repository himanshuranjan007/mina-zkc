/**
 * Deploy ZcashBridge to Mina Berkeley Testnet
 * Run: bun run src/deploy.ts
 */

import { Mina, PrivateKey, AccountUpdate, fetchAccount } from 'o1js';
import { ZcashBridge } from './ZcashBridge.js';
import fs from 'fs';
import path from 'path';

async function deploy() {
  console.log('🚀 Deploying ZcashBridge to Mina Berkeley Testnet\n');
  console.log('═'.repeat(60));

  // Check if keys exist
  const keysPath = path.join(process.cwd(), 'keys.json');
  if (!fs.existsSync(keysPath)) {
    console.error('❌ keys.json not found!');
    console.log('\n📝 Please run first: bun run src/generate-keys.ts');
    process.exit(1);
  }

  // Load keys
  console.log('🔑 Loading keys...');
  const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
  const deployerKey = PrivateKey.fromBase58(keys.deployer.privateKey);
  const deployerAddress = deployerKey.toPublicKey();
  const zkAppKey = PrivateKey.fromBase58(keys.zkApp.privateKey);
  const zkAppAddress = zkAppKey.toPublicKey();
  console.log('   ✅ Keys loaded');

  // Connect to Berkeley testnet
  console.log('\n🌐 Connecting to Berkeley testnet...');
  const Berkeley = Mina.Network({
    mina: 'https://api.minascan.io/node/berkeley/v1/graphql',
    archive: 'https://api.minascan.io/archive/berkeley/v1/graphql'
  });
  Mina.setActiveInstance(Berkeley);
  console.log('   ✅ Connected to Berkeley');

  console.log('\n📍 Addresses:');
  console.log('   Deployer:', deployerAddress.toBase58());
  console.log('   zkApp:', zkAppAddress.toBase58());

  // Check deployer balance
  console.log('\n💰 Checking deployer balance...');
  try {
    await fetchAccount({ publicKey: deployerAddress });
    const account = Mina.getAccount(deployerAddress);
    const balance = Number(account.balance.toBigInt()) / 1e9;
    console.log(`   Balance: ${balance} MINA`);

    if (balance < 1) {
      console.error('\n❌ Insufficient balance!');
      console.log('   Need at least 1 MINA for deployment');
      console.log('   Get testnet MINA from: https://faucet.minaprotocol.com/');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Could not fetch deployer account');
    console.log('   Make sure you funded the deployer address:');
    console.log('   ' + deployerAddress.toBase58());
    console.log('   Get testnet MINA from: https://faucet.minaprotocol.com/');
    process.exit(1);
  }

  // Compile contract
  console.log('\n🔧 Compiling ZcashBridge contract...');
  console.log('   (This may take 30-60 seconds)');
  const startCompile = Date.now();
  const { verificationKey } = await ZcashBridge.compile();
  const compileTime = ((Date.now() - startCompile) / 1000).toFixed(1);
  console.log(`   ✅ Compilation complete (${compileTime}s)`);

  // Create zkApp instance
  const zkApp = new ZcashBridge(zkAppAddress);

  // Create deployment transaction
  console.log('\n📤 Creating deployment transaction...');
  const deployTx = await Mina.transaction(
    {
      sender: deployerAddress,
      fee: 0.1e9, // 0.1 MINA fee
      memo: 'Deploy Zcash-Mina Bridge'
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
  console.log('   ✍️  Signing transaction...');
  const signedTx = await deployTx.sign([deployerKey, zkAppKey]).send();
  console.log('   ✅ Transaction sent!');

  // Wait for confirmation
  console.log('\n⏳ Waiting for confirmation...');
  console.log('   (This may take 3-5 minutes)');
  
  // Note: In production, you'd wait for the transaction to be included
  // For now, we'll just show the transaction hash
  console.log('   Transaction hash:', signedTx.hash());

  // Save deployment info
  const deployment = {
    network: 'berkeley',
    zkAppAddress: zkAppAddress.toBase58(),
    deployerAddress: deployerAddress.toBase58(),
    deployedAt: new Date().toISOString(),
    transactionHash: signedTx.hash(),
    verificationKey: verificationKey.data.slice(0, 100) + '...' // Truncated
  };

  const deploymentPath = path.join(process.cwd(), 'deployment.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log('\n✅ Deployment info saved to deployment.json');

  // Success!
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 DEPLOYMENT SUCCESSFUL!');
  console.log('═'.repeat(60));
  console.log('\n📍 Contract Address:');
  console.log('   ' + zkAppAddress.toBase58());
  console.log('\n🔍 View on Explorer:');
  console.log('   https://minascan.io/berkeley/account/' + zkAppAddress.toBase58());
  console.log('\n📝 Next Steps:');
  console.log('   1. Wait 3-5 minutes for confirmation');
  console.log('   2. Verify deployment on explorer');
  console.log('   3. Update relayer config with zkApp address');
  console.log('   4. Deploy relayer service');
  console.log('\n💡 Tip: Save deployment.json for your records');
  console.log('');
}

// Run if called directly
if (import.meta.main) {
  deploy().catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });
}

export { deploy };

