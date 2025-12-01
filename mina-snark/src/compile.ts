/**
 * Compile script for zkApp circuits
 * Run this before deploying or testing
 */

import { compileMerkleProofCircuit } from './MerkleProofCircuit';
import { ZcashBridge } from './ZcashBridge';
import { PrivateKey } from 'o1js';

async function compile() {
  console.log('🚀 Starting compilation process...\n');
  
  try {
    // Compile Merkle proof circuit
    console.log('1️⃣ Compiling Merkle Proof Circuit...');
    const merkleVK = await compileMerkleProofCircuit();
    console.log('✅ Merkle circuit compiled\n');
    
    // Compile bridge contract
    console.log('2️⃣ Compiling Zcash Bridge Contract...');
    const zkAppKey = PrivateKey.random();
    const zkAppAddress = zkAppKey.toPublicKey();
    
    await ZcashBridge.compile();
    console.log('✅ Bridge contract compiled\n');
    
    console.log('🎉 All circuits compiled successfully!');
    console.log('\nYou can now:');
    console.log('  - Run tests: bun test');
    console.log('  - Deploy contract: bun run deploy');
    
  } catch (error) {
    console.error('❌ Compilation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  compile();
}

export { compile };

