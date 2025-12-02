/**
 * Generate keys for Mina MAINNET deployment
 * ⚠️ MAINNET = REAL MONEY
 * 
 * Run: bun run src/generate-keys-mainnet.ts
 */

import { PrivateKey } from 'o1js';
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

async function generateMainnetKeys() {
  console.log('');
  console.log('═'.repeat(60));
  console.log('🔐 MINA MAINNET KEY GENERATION');
  console.log('═'.repeat(60));
  console.log('');
  console.log('⚠️  WARNING: These keys will control REAL MINA tokens!');
  console.log('⚠️  Real money is at risk. Proceed with caution.');
  console.log('');

  const confirm = await question('Type "MAINNET" to confirm you understand: ');
  
  if (confirm !== 'MAINNET') {
    console.log('\n❌ Cancelled. You must type "MAINNET" exactly.');
    rl.close();
    process.exit(0);
  }

  console.log('\n🔑 Generating MAINNET keys...\n');

  // Generate deployer key
  console.log('1️⃣ Generating deployer key...');
  const deployerKey = PrivateKey.random();
  const deployerAddress = deployerKey.toPublicKey();
  console.log('   ✅ Deployer key generated');

  // Generate zkApp key
  console.log('2️⃣ Generating zkApp key...');
  const zkAppKey = PrivateKey.random();
  const zkAppAddress = zkAppKey.toPublicKey();
  console.log('   ✅ zkApp key generated');

  // Create keys object
  const keys = {
    network: 'MAINNET',
    warning: 'THESE KEYS CONTROL REAL FUNDS - KEEP SECURE!',
    deployer: {
      privateKey: deployerKey.toBase58(),
      publicKey: deployerAddress.toBase58()
    },
    zkApp: {
      privateKey: zkAppKey.toBase58(),
      publicKey: zkAppAddress.toBase58()
    },
    generatedAt: new Date().toISOString()
  };

  // Save keys
  const keysPath = path.join(process.cwd(), 'keys.mainnet.json');
  fs.writeFileSync(keysPath, JSON.stringify(keys, null, 2));

  // Update .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  let gitignore = '';
  if (fs.existsSync(gitignorePath)) {
    gitignore = fs.readFileSync(gitignorePath, 'utf8');
  }
  if (!gitignore.includes('keys.mainnet.json')) {
    fs.appendFileSync(gitignorePath, '\n# Mainnet keys - NEVER COMMIT!\nkeys.mainnet.json\ndeployment.mainnet.json\n');
    console.log('\n   ✅ Added keys.mainnet.json to .gitignore');
  }

  console.log('\n✅ Keys saved to keys.mainnet.json\n');
  
  console.log('═'.repeat(60));
  console.log('📝 DEPLOYER ADDRESS (send MINA here):');
  console.log('');
  console.log('   ' + deployerAddress.toBase58());
  console.log('');
  console.log('═'.repeat(60));
  console.log('📝 ZKAPP ADDRESS (your contract will be here):');
  console.log('');
  console.log('   ' + zkAppAddress.toBase58());
  console.log('');
  console.log('═'.repeat(60));

  console.log('\n💰 NEXT STEPS:');
  console.log('');
  console.log('   1. Buy ~20 MINA (~$10-15 USD) from:');
  console.log('      • Coinbase: https://www.coinbase.com/');
  console.log('      • Kraken: https://www.kraken.com/');
  console.log('      • Binance: https://www.binance.com/');
  console.log('');
  console.log('   2. Withdraw MINA to your deployer address:');
  console.log('      ' + deployerAddress.toBase58());
  console.log('');
  console.log('   3. Wait for confirmation (5-10 minutes)');
  console.log('');
  console.log('   4. Verify balance on explorer:');
  console.log('      https://minascan.io/mainnet/account/' + deployerAddress.toBase58());
  console.log('');
  console.log('   5. Deploy: bun run src/deploy-mainnet.ts');
  console.log('');

  console.log('⚠️  SECURITY WARNINGS:');
  console.log('   • NEVER share keys.mainnet.json');
  console.log('   • NEVER commit to git');
  console.log('   • Backup to secure location');
  console.log('   • These keys control REAL money!');
  console.log('');

  rl.close();
}

// Run if called directly
if (import.meta.main) {
  generateMainnetKeys().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

export { generateMainnetKeys };

