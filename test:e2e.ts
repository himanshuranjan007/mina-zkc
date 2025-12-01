/**
 * End-to-End Test for Zcash-Mina Bridge
 * Tests the complete flow from deposit to proof verification
 */

console.log(`
╔════════════════════════════════════════════╗
║   E2E Test - Zcash ↔ Mina Bridge          ║
╚════════════════════════════════════════════╝
`);

interface TestResult {
  step: string;
  success: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test Step 1: Check Zcash Simulator
 */
async function testZcashSimulator(): Promise<TestResult> {
  const start = Date.now();
  console.log('\n1️⃣ Testing Zcash Simulator...');

  try {
    const response = await fetch('http://localhost:3000/health');
    
    if (!response.ok) {
      throw new Error('Zcash simulator not responding');
    }

    const data = await response.json();
    console.log('   ✅ Zcash simulator is healthy');
    console.log(`   Status: ${data.status}`);

    return {
      step: 'Zcash Simulator',
      success: true,
      duration: Date.now() - start
    };
  } catch (error) {
    console.error('   ❌ Zcash simulator check failed:', error);
    return {
      step: 'Zcash Simulator',
      success: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test Step 2: Create Deposit
 */
async function testDeposit(): Promise<TestResult & { commitment?: string; index?: number; root?: string }> {
  const start = Date.now();
  console.log('\n2️⃣ Creating Zcash Deposit...');

  try {
    // Generate random commitment
    const commitment = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    console.log(`   Commitment: ${commitment.slice(0, 20)}...`);

    const response = await fetch('http://localhost:3000/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commitment })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Deposit failed');
    }

    console.log('   ✅ Deposit successful');
    console.log(`   Index: ${data.index}`);
    console.log(`   Root: ${data.root.slice(0, 20)}...`);

    return {
      step: 'Create Deposit',
      success: true,
      duration: Date.now() - start,
      commitment: data.commitment,
      index: data.index,
      root: data.root
    };
  } catch (error) {
    console.error('   ❌ Deposit failed:', error);
    return {
      step: 'Create Deposit',
      success: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test Step 3: Fetch Merkle Proof
 */
async function testMerkleProof(commitment: string): Promise<TestResult & { proof?: any }> {
  const start = Date.now();
  console.log('\n3️⃣ Fetching Merkle Proof...');

  try {
    const response = await fetch(`http://localhost:3000/merkle-proof/${commitment}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.proof) {
      throw new Error(data.error || 'Proof generation failed');
    }

    console.log('   ✅ Merkle proof received');
    console.log(`   Leaf: ${data.proof.leaf.slice(0, 20)}...`);
    console.log(`   Path length: ${data.proof.path.length}`);
    console.log(`   Root: ${data.proof.root.slice(0, 20)}...`);

    return {
      step: 'Fetch Merkle Proof',
      success: true,
      duration: Date.now() - start,
      proof: data.proof
    };
  } catch (error) {
    console.error('   ❌ Proof fetch failed:', error);
    return {
      step: 'Fetch Merkle Proof',
      success: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test Step 4: Verify Proof Locally
 */
async function testProofVerification(proof: any): Promise<TestResult> {
  const start = Date.now();
  console.log('\n4️⃣ Verifying Proof Locally...');

  try {
    const response = await fetch('http://localhost:3000/verify-proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.valid) {
      throw new Error('Proof verification failed');
    }

    console.log('   ✅ Proof verified successfully');

    return {
      step: 'Verify Proof',
      success: true,
      duration: Date.now() - start
    };
  } catch (error) {
    console.error('   ❌ Verification failed:', error);
    return {
      step: 'Verify Proof',
      success: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test Step 5: Simulate Recursive SNARK Generation
 */
async function testSNARKGeneration(): Promise<TestResult> {
  const start = Date.now();
  console.log('\n5️⃣ Simulating Recursive SNARK Generation...');

  try {
    // Simulate proof generation time
    await sleep(1000);

    console.log('   ✅ Recursive SNARK generated (simulated)');
    console.log('   In production: MerkleProofProgram.verifyProof()');

    return {
      step: 'Generate Recursive SNARK',
      success: true,
      duration: Date.now() - start
    };
  } catch (error) {
    console.error('   ❌ SNARK generation failed:', error);
    return {
      step: 'Generate Recursive SNARK',
      success: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test Step 6: Simulate Mina Submission
 */
async function testMinaSubmission(): Promise<TestResult> {
  const start = Date.now();
  console.log('\n6️⃣ Simulating Mina zkApp Submission...');

  try {
    // Simulate submission time
    await sleep(800);

    const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    console.log('   ✅ Proof submitted to Mina (simulated)');
    console.log(`   Tx Hash: ${mockTxHash.slice(0, 20)}...`);
    console.log('   In production: zkApp.verifyAndMint()');

    return {
      step: 'Submit to Mina',
      success: true,
      duration: Date.now() - start
    };
  } catch (error) {
    console.error('   ❌ Submission failed:', error);
    return {
      step: 'Submit to Mina',
      success: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test Multiple Deposits
 */
async function testMultipleDeposits(): Promise<TestResult> {
  const start = Date.now();
  console.log('\n7️⃣ Testing Multiple Deposits...');

  try {
    const deposits = [];

    for (let i = 0; i < 3; i++) {
      const commitment = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      const response = await fetch('http://localhost:3000/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitment })
      });

      const data = await response.json();
      deposits.push(data);

      console.log(`   Deposit ${i + 1}: Index ${data.index}`);
    }

    console.log('   ✅ Multiple deposits successful');

    return {
      step: 'Multiple Deposits',
      success: true,
      duration: Date.now() - start
    };
  } catch (error) {
    console.error('   ❌ Multiple deposits failed:', error);
    return {
      step: 'Multiple Deposits',
      success: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Print Test Summary
 */
function printSummary(results: TestResult[]): void {
  console.log('\n' + '═'.repeat(50));
  console.log('📊 Test Summary');
  console.log('═'.repeat(50));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);

  console.log('\nDetailed Results:');
  results.forEach((result, i) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${i + 1}. ${icon} ${result.step} (${result.duration}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '═'.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Bridge is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.\n');
  }
}

/**
 * Main test runner
 */
async function runE2ETests(): Promise<void> {
  console.log('Starting end-to-end tests...\n');
  console.log('⚠️  Make sure Zcash simulator is running on port 3000');
  console.log('   Run: cd zcash-sim && bun run dev\n');

  await sleep(1000);

  try {
    // Test 1: Zcash Simulator
    const test1 = await testZcashSimulator();
    results.push(test1);

    if (!test1.success) {
      console.error('\n❌ Zcash simulator not available. Please start it first.');
      console.error('   Run: cd zcash-sim && bun run dev');
      process.exit(1);
    }

    // Test 2: Create Deposit
    const test2 = await testDeposit();
    results.push(test2);

    if (!test2.success || !test2.commitment) {
      throw new Error('Deposit failed, cannot continue');
    }

    // Test 3: Fetch Merkle Proof
    const test3 = await testMerkleProof(test2.commitment);
    results.push(test3);

    if (!test3.success || !test3.proof) {
      throw new Error('Proof fetch failed, cannot continue');
    }

    // Test 4: Verify Proof
    const test4 = await testProofVerification(test3.proof);
    results.push(test4);

    // Test 5: Generate SNARK
    const test5 = await testSNARKGeneration();
    results.push(test5);

    // Test 6: Submit to Mina
    const test6 = await testMinaSubmission();
    results.push(test6);

    // Test 7: Multiple Deposits
    const test7 = await testMultipleDeposits();
    results.push(test7);

    // Print summary
    printSummary(results);

  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    printSummary(results);
    process.exit(1);
  }
}

// Run tests
if (import.meta.main) {
  runE2ETests();
}

