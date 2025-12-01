/**
 * Tests for Relayer components
 */

import { describe, test, expect } from 'bun:test';
import { ZcashWatcher } from './watcher';
import { ProofGenerator } from './prover';
import { MinaSubmitter } from './submitter';

describe('ZcashWatcher', () => {
  test('should create watcher instance', () => {
    const watcher = new ZcashWatcher('http://localhost:3000', 5000);
    expect(watcher).toBeDefined();
  });

  test('should register event handlers', () => {
    const watcher = new ZcashWatcher('http://localhost:3000');
    let called = false;

    watcher.onEvent(() => {
      called = true;
    });

    expect(called).toBe(false); // Not called yet
  });

  test('should get watcher status', () => {
    const watcher = new ZcashWatcher('http://localhost:3000', 5000);
    const status = watcher.getStatus();

    expect(status.isRunning).toBe(false);
    expect(status.zcashRpcUrl).toBe('http://localhost:3000');
    expect(status.pollInterval).toBe(5000);
  });
});

describe('ProofGenerator', () => {
  test('should create proof generator', () => {
    const prover = new ProofGenerator();
    expect(prover).toBeDefined();
  });

  test('should initialize proof generator', async () => {
    const prover = new ProofGenerator();
    await prover.initialize();

    const stats = prover.getStats();
    expect(stats.isInitialized).toBe(true);
  });

  test('should generate proof', async () => {
    const prover = new ProofGenerator();
    await prover.initialize();

    const mockProof = {
      leaf: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      index: 0,
      path: Array(32).fill('0x0000000000000000000000000000000000000000000000000000000000000000'),
      root: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    };

    const result = await prover.generateProof(mockProof);

    expect(result.success).toBe(true);
    expect(result.proof).toBeDefined();
    expect(result.duration).toBeGreaterThan(0);
  });

  test('should verify generated proof', async () => {
    const prover = new ProofGenerator();
    await prover.initialize();

    const mockProof = {
      publicInput: 'root',
      publicOutput: true,
      proof: 'mock_proof'
    };

    const isValid = await prover.verifyProof(mockProof);
    expect(isValid).toBe(true);
  });
});

describe('MinaSubmitter', () => {
  test('should create submitter instance', () => {
    const submitter = new MinaSubmitter('http://localhost:8080');
    expect(submitter).toBeDefined();
  });

  test('should initialize submitter', async () => {
    const submitter = new MinaSubmitter('http://localhost:8080');
    await submitter.initialize();

    const stats = submitter.getStats();
    expect(stats.isInitialized).toBe(true);
  });

  test('should submit proof', async () => {
    const submitter = new MinaSubmitter('http://localhost:8080');
    await submitter.initialize();

    const mockProof = {
      publicInput: 'root',
      publicOutput: true,
      proof: 'mock_proof'
    };

    const result = await submitter.submitProof(
      mockProof,
      '0x1234567890abcdef',
      1000000
    );

    expect(result.success).toBe(true);
    expect(result.txHash).toBeDefined();
  });

  test('should update Zcash root', async () => {
    const submitter = new MinaSubmitter('http://localhost:8080');
    await submitter.initialize();

    const result = await submitter.updateZcashRoot(
      '0xabcdef1234567890',
      100
    );

    expect(result.success).toBe(true);
    expect(result.txHash).toBeDefined();
  });
});

describe('Integration', () => {
  test('should simulate full relayer flow', async () => {
    // This test simulates the complete relayer flow
    const watcher = new ZcashWatcher('http://localhost:3000');
    const prover = new ProofGenerator();
    const submitter = new MinaSubmitter('http://localhost:8080');

    // Initialize components
    await prover.initialize();
    await submitter.initialize();

    // Simulate processing
    const mockMerkleProof = {
      leaf: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      index: 0,
      path: Array(32).fill('0x0000000000000000000000000000000000000000000000000000000000000000'),
      root: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    };

    // Generate proof
    const proofResult = await prover.generateProof(mockMerkleProof);
    expect(proofResult.success).toBe(true);

    // Submit to Mina
    if (proofResult.proof) {
      const submitResult = await submitter.submitProof(
        proofResult.proof,
        mockMerkleProof.leaf,
        1000000
      );
      expect(submitResult.success).toBe(true);
    }
  });
});

