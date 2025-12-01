/**
 * Main entry point for Mina zkApp
 */

export { MerkleProofProgram, MerkleProof, compileMerkleProofCircuit, prepareMerkleProofData, hexToField } from './MerkleProofCircuit';
export { ZcashBridge, deployBridge } from './ZcashBridge';
export * from './types';

// Re-export o1js types that consumers might need
export { Field, Bool, PublicKey, PrivateKey } from 'o1js';

