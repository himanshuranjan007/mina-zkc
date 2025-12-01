/**
 * Tests for Zcash Simulator
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { MerkleTree } from './merkle';

describe('MerkleTree', () => {
  test('should create empty tree with correct root', () => {
    const tree = new MerkleTree(4);
    const root = tree.getRoot();
    expect(root).toBeDefined();
    expect(root.startsWith('0x')).toBe(true);
  });

  test('should insert commitment and update root', () => {
    const tree = new MerkleTree(4);
    const initialRoot = tree.getRoot();
    
    const commitment = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    tree.insert(commitment);
    
    const newRoot = tree.getRoot();
    expect(newRoot).not.toBe(initialRoot);
  });

  test('should generate valid Merkle proof', () => {
    const tree = new MerkleTree(4);
    
    const commitment1 = '0x1111111111111111111111111111111111111111111111111111111111111111';
    const commitment2 = '0x2222222222222222222222222222222222222222222222222222222222222222';
    
    tree.insert(commitment1);
    const index = tree.insert(commitment2);
    
    const proof = tree.getProof(index);
    expect(proof).not.toBeNull();
    expect(proof?.leaf).toBe(commitment2);
    expect(proof?.index).toBe(index);
    expect(proof?.path.length).toBe(4);
  });

  test('should verify valid proof', () => {
    const tree = new MerkleTree(4);
    
    const commitment = '0x3333333333333333333333333333333333333333333333333333333333333333';
    const index = tree.insert(commitment);
    
    const proof = tree.getProof(index);
    expect(proof).not.toBeNull();
    
    if (proof) {
      const isValid = MerkleTree.verifyProof(proof);
      expect(isValid).toBe(true);
    }
  });

  test('should handle multiple insertions', () => {
    const tree = new MerkleTree(8);
    const commitments: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      const commitment = '0x' + i.toString().padStart(64, '0');
      commitments.push(commitment);
      tree.insert(commitment);
    }
    
    const info = tree.getInfo();
    expect(info.leafCount).toBe(10);
    expect(info.depth).toBe(8);
  });

  test('should generate different proofs for different leaves', () => {
    const tree = new MerkleTree(4);
    
    const commitment1 = '0x4444444444444444444444444444444444444444444444444444444444444444';
    const commitment2 = '0x5555555555555555555555555555555555555555555555555555555555555555';
    
    const index1 = tree.insert(commitment1);
    const index2 = tree.insert(commitment2);
    
    const proof1 = tree.getProof(index1);
    const proof2 = tree.getProof(index2);
    
    expect(proof1).not.toBeNull();
    expect(proof2).not.toBeNull();
    expect(proof1?.leaf).not.toBe(proof2?.leaf);
  });

  test('should return null for invalid index', () => {
    const tree = new MerkleTree(4);
    const proof = tree.getProof(999);
    expect(proof).toBeNull();
  });
});

describe('Zcash Simulator Integration', () => {
  test('should simulate deposit flow', () => {
    const tree = new MerkleTree(32);
    const commitments = new Map();
    
    // Simulate deposit
    const commitment = '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
    const index = tree.insert(commitment);
    const root = tree.getRoot();
    
    commitments.set(commitment, { value: commitment, index, timestamp: Date.now() });
    
    expect(commitments.has(commitment)).toBe(true);
    expect(commitments.get(commitment).index).toBe(index);
    
    // Generate proof
    const proof = tree.getProof(index);
    expect(proof).not.toBeNull();
    expect(proof?.root).toBe(root);
    
    // Verify proof
    if (proof) {
      const isValid = MerkleTree.verifyProof(proof);
      expect(isValid).toBe(true);
    }
  });
});

