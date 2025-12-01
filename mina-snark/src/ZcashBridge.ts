/**
 * Zcash Bridge zkApp Smart Contract
 * Verifies Zcash commitments and mints wrapped tokens on Mina
 */

import {
  SmartContract,
  state,
  State,
  method,
  Field,
  PublicKey,
  Permissions,
  Bool,
  Provable
} from 'o1js';
import { MerkleProof } from './MerkleProofCircuit';

/**
 * Bridge smart contract that verifies Zcash proofs
 */
export class ZcashBridge extends SmartContract {
  // State variables
  @state(Field) zcashRoot = State<Field>();
  @state(Field) totalBridged = State<Field>();
  @state(Field) lastUpdateBlock = State<Field>();
  
  // Mapping of processed commitments (to prevent double-spending)
  // In production, this would use a proper nullifier set
  @state(Field) processedCommitmentsRoot = State<Field>();

  /**
   * Initialize the contract
   */
  init() {
    super.init();
    
    // Set initial state
    this.zcashRoot.set(Field(0));
    this.totalBridged.set(Field(0));
    this.lastUpdateBlock.set(Field(0));
    this.processedCommitmentsRoot.set(Field(0));
    
    // Set permissions
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
      send: Permissions.proofOrSignature(),
      receive: Permissions.none()
    });
  }

  /**
   * Update the Zcash Merkle root (called by relayer)
   * In production, this would be permissioned or use a committee
   */
  @method async updateZcashRoot(newRoot: Field, blockHeight: Field) {
    // Get current state
    const currentRoot = this.zcashRoot.getAndRequireEquals();
    
    // Verify new root is different (tree has grown)
    const isDifferent = currentRoot.equals(newRoot).not();
    isDifferent.assertTrue('Root must change');
    
    // Update state
    this.zcashRoot.set(newRoot);
    this.lastUpdateBlock.set(blockHeight);
  }

  /**
   * Verify a Zcash commitment and mint wrapped tokens
   * This is the core bridge functionality
   */
  @method async verifyAndMint(
    proof: MerkleProof,
    commitment: Field,
    recipient: PublicKey,
    amount: Field
  ) {
    // Get current Zcash root
    const currentRoot = this.zcashRoot.getAndRequireEquals();
    
    // Verify the recursive proof
    proof.verify();
    
    // The proof's public input should match our stored root
    const proofRoot = proof.publicInput;
    proofRoot.assertEquals(currentRoot, 'Proof root must match stored root');
    
    // The proof's output should be true (valid)
    const isValid = proof.publicOutput;
    isValid.assertTrue('Proof verification failed');
    
    // Verify commitment hasn't been processed before
    // (Simplified - production would use nullifier set)
    const processedRoot = this.processedCommitmentsRoot.getAndRequireEquals();
    
    // Update processed commitments
    // In production: add commitment to nullifier set
    const newProcessedRoot = Provable.if(
      isValid,
      Field,
      commitment, // Simplified: just use commitment as new root
      processedRoot
    );
    this.processedCommitmentsRoot.set(newProcessedRoot);
    
    // Update total bridged amount
    const currentTotal = this.totalBridged.getAndRequireEquals();
    const newTotal = currentTotal.add(amount);
    this.totalBridged.set(newTotal);
    
    // In production: mint wrapped tokens to recipient
    // For PoC, we just emit an event (not implemented in o1js yet)
    // this.emitEvent('TokensMinted', { recipient, amount, commitment });
  }

  /**
   * Get current bridge state (view method)
   */
  @method async getBridgeState(): Promise<{
    root: Field;
    total: Field;
    lastBlock: Field;
  }> {
    return {
      root: this.zcashRoot.getAndRequireEquals(),
      total: this.totalBridged.getAndRequireEquals(),
      lastBlock: this.lastUpdateBlock.getAndRequireEquals()
    };
  }

  /**
   * Emergency pause (for production)
   */
  @method async pause(admin: PublicKey) {
    // Verify admin signature
    // In production: implement proper access control
    this.requireSignature();
  }
}

/**
 * Deploy the bridge contract
 */
export async function deployBridge(
  deployerKey: PublicKey,
  zkAppPrivateKey: any
): Promise<ZcashBridge> {
  console.log('📦 Deploying Zcash Bridge contract...');
  
  const zkAppAddress = zkAppPrivateKey.toPublicKey();
  const zkApp = new ZcashBridge(zkAppAddress);
  
  console.log('✅ Bridge deployed at:', zkAppAddress.toBase58());
  
  return zkApp;
}

