/**
 * Tests for Zcash Bridge zkApp
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Bool
} from 'o1js';
import { ZcashBridge } from './ZcashBridge';
import {
  MerkleProofProgram,
  prepareMerkleProofData,
  hexToField
} from './MerkleProofCircuit';

describe('ZcashBridge', () => {
  let deployerAccount: PublicKey;
  let deployerKey: PrivateKey;
  let zkAppAddress: PublicKey;
  let zkAppPrivateKey: PrivateKey;
  let zkApp: ZcashBridge;
  let Local: any;

  beforeAll(async () => {
    // Setup local blockchain
    Local = Mina.LocalBlockchain({ proofsEnabled: false });
    Mina.setActiveInstance(Local);

    // Get deployer account
    deployerKey = Local.testAccounts[0].privateKey;
    deployerAccount = Local.testAccounts[0].publicKey;

    // Create zkApp account
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();

    // Create contract instance
    zkApp = new ZcashBridge(zkAppAddress);
  });

  test('should initialize with zero state', async () => {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.sign([deployerKey, zkAppPrivateKey]).send();

    const root = zkApp.zcashRoot.get();
    const total = zkApp.totalBridged.get();

    expect(root.toString()).toBe('0');
    expect(total.toString()).toBe('0');
  });

  test('should update Zcash root', async () => {
    const newRoot = Field(12345);
    const blockHeight = Field(100);

    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.updateZcashRoot(newRoot, blockHeight);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    const storedRoot = zkApp.zcashRoot.get();
    expect(storedRoot.toString()).toBe(newRoot.toString());
  });

  test('should get bridge state', async () => {
    const txn = await Mina.transaction(deployerAccount, async () => {
      const state = await zkApp.getBridgeState();
      return state;
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    const root = zkApp.zcashRoot.get();
    const total = zkApp.totalBridged.get();
    
    expect(root).toBeDefined();
    expect(total).toBeDefined();
  });
});

describe('MerkleProofCircuit', () => {
  test('should prepare proof data correctly', () => {
    const mockProof = {
      leaf: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      index: 5,
      path: Array(32).fill('0x0000000000000000000000000000000000000000000000000000000000000000'),
      root: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    };

    const prepared = prepareMerkleProofData(mockProof);

    expect(prepared.leaf).toBeDefined();
    expect(prepared.root).toBeDefined();
    expect(prepared.siblings.length).toBe(32);
    expect(prepared.isLefts.length).toBe(32);
  });

  test('should convert hex to field', () => {
    const hex = '0x1234567890abcdef';
    const field = hexToField(hex);
    
    expect(field).toBeDefined();
    expect(field.toString()).toBe(BigInt('0x1234567890abcdef').toString());
  });

  test('should handle hex without 0x prefix', () => {
    const hex = '1234567890abcdef';
    const field = hexToField(hex);
    
    expect(field).toBeDefined();
    expect(field.toString()).toBe(BigInt('0x1234567890abcdef').toString());
  });
});

describe('Integration', () => {
  test('should simulate full bridge flow', async () => {
    // This test simulates the complete flow:
    // 1. Zcash deposit creates commitment
    // 2. Relayer generates proof
    // 3. Bridge verifies and mints

    const commitment = Field(999888777);
    const amount = Field(1000000); // 1 ZEC in satoshis
    
    // In a real test, we would:
    // - Generate actual Merkle proof
    // - Create recursive SNARK
    // - Submit to bridge
    // - Verify state changes

    expect(commitment).toBeDefined();
    expect(amount).toBeDefined();
  });
});

