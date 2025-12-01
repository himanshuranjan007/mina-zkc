/**
 * Merkle Proof Verification Circuit
 * Verifies Zcash Merkle tree inclusion proofs
 */

import { Field, Bool, Poseidon, ZkProgram } from 'o1js';

/**
 * Hash two field elements (simulating SHA256 with Poseidon for efficiency)
 * In production, this would use actual SHA256 gadgets
 */
function hashPair(left: Field, right: Field): Field {
  return Poseidon.hash([left, right]);
}

/**
 * Verify a single level of the Merkle tree
 */
function verifyMerkleLevel(
  currentHash: Field,
  sibling: Field,
  isLeft: Bool
): Field {
  // If current node is left child, hash(current, sibling)
  // If current node is right child, hash(sibling, current)
  const leftHash = hashPair(currentHash, sibling);
  const rightHash = hashPair(sibling, currentHash);
  
  return Bool.switch([isLeft], Field, [leftHash, rightHash]);
}

/**
 * ZkProgram for Merkle proof verification
 * This creates a recursive SNARK that can be composed
 */
export const MerkleProofProgram = ZkProgram({
  name: 'merkle-proof-verification',
  publicInput: Field, // Merkle root
  publicOutput: Bool, // Verification result

  methods: {
    /**
     * Verify a 32-level Merkle proof
     */
    verifyProof: {
      privateInputs: [Field, Array(32).fill(Field), Array(32).fill(Bool)],
      
      async method(
        root: Field,
        leaf: Field,
        siblings: Field[],
        isLefts: Bool[]
      ): Promise<Bool> {
        // Start with the leaf
        let currentHash = leaf;

        // Traverse up the tree
        for (let i = 0; i < 32; i++) {
          currentHash = verifyMerkleLevel(currentHash, siblings[i], isLefts[i]);
        }

        // Check if computed root matches expected root
        const isValid = currentHash.equals(root);
        
        return isValid;
      }
    },

    /**
     * Verify multiple proofs recursively (proof composition)
     */
    verifyBatch: {
      privateInputs: [
        Field, // leaf1
        Array(32).fill(Field), // siblings1
        Array(32).fill(Bool), // isLefts1
        Field, // leaf2
        Array(32).fill(Field), // siblings2
        Array(32).fill(Bool) // isLefts2
      ],
      
      async method(
        root: Field,
        leaf1: Field,
        siblings1: Field[],
        isLefts1: Bool[],
        leaf2: Field,
        siblings2: Field[],
        isLefts2: Bool[]
      ): Promise<Bool> {
        // Verify first proof
        let hash1 = leaf1;
        for (let i = 0; i < 32; i++) {
          hash1 = verifyMerkleLevel(hash1, siblings1[i], isLefts1[i]);
        }
        const valid1 = hash1.equals(root);

        // Verify second proof
        let hash2 = leaf2;
        for (let i = 0; i < 32; i++) {
          hash2 = verifyMerkleLevel(hash2, siblings2[i], isLefts2[i]);
        }
        const valid2 = hash2.equals(root);

        // Both must be valid
        return valid1.and(valid2);
      }
    }
  }
});

/**
 * Proof class for the Merkle verification program
 */
export class MerkleProof extends ZkProgram.Proof(MerkleProofProgram) {}

/**
 * Helper function to convert hex string to Field
 */
export function hexToField(hex: string): Field {
  // Remove 0x prefix if present
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  
  // Convert to BigInt then to Field
  const bigInt = BigInt('0x' + cleanHex);
  return Field(bigInt);
}

/**
 * Helper function to prepare proof data for circuit
 */
export function prepareMerkleProofData(proof: {
  leaf: string;
  index: number;
  path: string[];
  root: string;
}): {
  leaf: Field;
  siblings: Field[];
  isLefts: Bool[];
  root: Field;
} {
  const leaf = hexToField(proof.leaf);
  const root = hexToField(proof.root);
  
  const siblings: Field[] = proof.path.map(hexToField);
  
  // Determine if each node is a left or right child based on index
  const isLefts: Bool[] = [];
  let currentIndex = proof.index;
  
  for (let i = 0; i < proof.path.length; i++) {
    // If index is even, current node is left child
    isLefts.push(Bool(currentIndex % 2 === 0));
    currentIndex = Math.floor(currentIndex / 2);
  }
  
  return { leaf, siblings, isLefts, root };
}

/**
 * Compile the zkProgram (generates proving and verification keys)
 */
export async function compileMerkleProofCircuit() {
  console.log('🔧 Compiling Merkle Proof Circuit...');
  const { verificationKey } = await MerkleProofProgram.compile();
  console.log('✅ Compilation complete!');
  console.log('Verification key:', verificationKey.data.slice(0, 50) + '...');
  return verificationKey;
}

