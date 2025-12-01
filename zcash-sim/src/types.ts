/**
 * Type definitions for Zcash simulator
 */

export interface Commitment {
  value: string; // Hex string representing the commitment
  index: number; // Position in Merkle tree
  timestamp: number;
}

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
}

export interface MerkleProof {
  leaf: string;
  index: number;
  path: string[]; // Array of sibling hashes
  root: string;
}

export interface DepositRequest {
  commitment: string; // Hex string of commitment
}

export interface DepositResponse {
  success: boolean;
  commitment: string;
  index: number;
  root: string;
  message?: string;
}

export interface ProofRequest {
  commitment: string;
}

export interface ProofResponse {
  success: boolean;
  proof?: MerkleProof;
  error?: string;
}

export interface TreeInfo {
  root: string;
  depth: number;
  leafCount: number;
}

export interface ShieldedPool {
  commitments: Map<string, Commitment>;
  leaves: string[];
}

