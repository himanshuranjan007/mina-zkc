/**
 * Type definitions for Mina zkApp
 */

import { Field, Bool, Struct, Proof } from 'o1js';

/**
 * Merkle proof path element
 */
export class MerklePathElement extends Struct({
  sibling: Field,
  isLeft: Bool
}) {}

/**
 * Zcash commitment representation
 */
export class ZcashCommitment extends Struct({
  value: Field,
  index: Field
}) {}

/**
 * Merkle inclusion proof
 */
export class MerkleInclusionProof extends Struct({
  leaf: Field,
  root: Field,
  pathElements: [MerklePathElement, MerklePathElement, MerklePathElement, MerklePathElement,
                 MerklePathElement, MerklePathElement, MerklePathElement, MerklePathElement,
                 MerklePathElement, MerklePathElement, MerklePathElement, MerklePathElement,
                 MerklePathElement, MerklePathElement, MerklePathElement, MerklePathElement,
                 MerklePathElement, MerklePathElement, MerklePathElement, MerklePathElement,
                 MerklePathElement, MerklePathElement, MerklePathElement, MerklePathElement,
                 MerklePathElement, MerklePathElement, MerklePathElement, MerklePathElement,
                 MerklePathElement, MerklePathElement, MerklePathElement, MerklePathElement]
}) {}

/**
 * Bridge state
 */
export interface BridgeState {
  zcashRoot: Field;
  totalBridged: Field;
  lastUpdateTimestamp: Field;
}

/**
 * Verification result
 */
export interface VerificationResult {
  success: boolean;
  commitment?: string;
  amount?: string;
  error?: string;
}

