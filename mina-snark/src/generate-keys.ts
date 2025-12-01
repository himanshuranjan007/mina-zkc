/**
 * Generate keys for Mina deployment
 * Run: bun run src/generate-keys.ts
 */

import { PrivateKey } from 'o1js';
import fs from 'fs';
import path from 'path';

async function generateKeys() {
  console.log('🔑 Generating Mina keys for deployment...\n');

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
    deployer: {
      privateKey: deployerKey.toBase58(),
      publicKey: deployerAddress.toBase58()
    },
    zkApp: {
      privateKey: zkAppKey.toBase58(),
      publicKey: zkAppAddress.toBase58()
    },
    generatedAt: new Date().toISOString(),
    network: 'berkeley' // testnet
  };

  // Save keys
  const keysPath = path.join(process.cwd(), 'keys.json');
  fs.writeFileSync(keysPath, JSON.stringify(keys, null, 2));

  console.log('\n✅ Keys saved to keys.json\n');
  console.log('═'.repeat(60));
  console.log('📝 DEPLOYER ADDRESS (fund this with testnet MINA):');
  console.log('   ' + deployerAddress.toBase58());
  console.log('\n📝 ZKAPP ADDRESS (your bridge contract):');
  console.log('   ' + zkAppAddress.toBase58());
  console.log('═'.repeat(60));

  console.log('\n💰 Next steps:');
  console.log('   1. Go to: https://faucet.minaprotocol.com/');
  console.log('   2. Paste deployer address and request testnet MINA');
  console.log('   3. Wait for confirmation (~3 minutes)');
  console.log('   4. Run: bun run src/deploy.ts');

  console.log('\n⚠️  SECURITY:');
  console.log('   • Keep keys.json secure');
  console.log('   • Never commit keys.json to git');
  console.log('   • Backup keys.json safely');

  // Update .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  let gitignore = '';
  
  if (fs.existsSync(gitignorePath)) {
    gitignore = fs.readFileSync(gitignorePath, 'utf8');
  }

  if (!gitignore.includes('keys.json')) {
    fs.appendFileSync(gitignorePath, '\n# Mina keys\nkeys.json\ndeployment.json\n');
    console.log('   ✅ Added keys.json to .gitignore');
  }

  console.log('\n🎉 Key generation complete!\n');
}

// Run if called directly
if (import.meta.main) {
  generateKeys().catch(console.error);
}

export { generateKeys };

