/**
 * Merkle Tree implementation for Zcash shielded pool simulation
 * Uses SHA-256 for hashing (simplified from Zcash's Pedersen hash)
 */

import { MerkleProof, MerkleNode } from './types';

export class MerkleTree {
  private leaves: string[];
  private depth: number;
  private zeroHashes: string[];

  constructor(depth: number = 32) {
    this.depth = depth;
    this.leaves = [];
    this.zeroHashes = this.computeZeroHashes();
  }

  /**
   * Compute zero hashes for empty tree nodes
   * zero[i] = hash(zero[i-1] || zero[i-1])
   */
  private computeZeroHashes(): string[] {
    const zeros: string[] = new Array(this.depth + 1);
    // Base case: hash of empty string
    zeros[0] = this.hash('0x0000000000000000000000000000000000000000000000000000000000000000');
    
    for (let i = 1; i <= this.depth; i++) {
      zeros[i] = this.hash(zeros[i - 1] + zeros[i - 1]);
    }
    
    return zeros;
  }

  /**
   * Simple SHA-256 hash implementation using Bun's crypto
   */
  private hash(data: string): string {
    const hasher = new Bun.CryptoHasher('sha256');
    hasher.update(data);
    return '0x' + hasher.digest('hex');
  }

  /**
   * Hash two nodes together
   */
  private hashPair(left: string, right: string): string {
    return this.hash(left + right.slice(2)); // Remove 0x from right
  }

  /**
   * Add a new leaf (commitment) to the tree
   */
  public insert(commitment: string): number {
    if (!commitment.startsWith('0x')) {
      commitment = '0x' + commitment;
    }
    
    const index = this.leaves.length;
    this.leaves.push(commitment);
    return index;
  }

  /**
   * Get the current root of the Merkle tree
   */
  public getRoot(): string {
    if (this.leaves.length === 0) {
      return this.zeroHashes[this.depth];
    }

    return this.computeRoot(this.leaves.length);
  }

  /**
   * Compute root for a specific number of leaves
   */
  private computeRoot(leafCount: number): string {
    let level = [...this.leaves];
    
    for (let height = 0; height < this.depth; height++) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = i + 1 < level.length ? level[i + 1] : this.zeroHashes[height];
        nextLevel.push(this.hashPair(left, right));
      }
      
      // If odd number of nodes, pad with zero hash
      if (level.length % 2 === 1 && level.length > 1) {
        // Already handled in loop above
      }
      
      level = nextLevel;
      
      // If only one node left, continue with it and zero hashes
      if (level.length === 1 && height < this.depth - 1) {
        while (height < this.depth - 1) {
          height++;
          level = [this.hashPair(level[0], this.zeroHashes[height])];
        }
        break;
      }
    }
    
    return level[0] || this.zeroHashes[this.depth];
  }

  /**
   * Generate a Merkle proof for a specific leaf
   */
  public getProof(index: number): MerkleProof | null {
    if (index < 0 || index >= this.leaves.length) {
      return null;
    }

    const leaf = this.leaves[index];
    const path: string[] = [];
    let currentIndex = index;

    for (let height = 0; height < this.depth; height++) {
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      let sibling: string;
      
      if (siblingIndex < this.getLevelSize(height)) {
        sibling = this.getNodeAtLevel(height, siblingIndex);
      } else {
        sibling = this.zeroHashes[height];
      }

      path.push(sibling);
      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      leaf,
      index,
      path,
      root: this.getRoot()
    };
  }

  /**
   * Get the number of nodes at a specific level
   */
  private getLevelSize(height: number): number {
    return Math.ceil(this.leaves.length / Math.pow(2, height));
  }

  /**
   * Get a specific node at a level and index
   */
  private getNodeAtLevel(height: number, index: number): string {
    if (height === 0) {
      return this.leaves[index] || this.zeroHashes[0];
    }

    const leftChild = this.getNodeAtLevel(height - 1, index * 2);
    const rightChild = this.getNodeAtLevel(height - 1, index * 2 + 1);
    
    return this.hashPair(leftChild, rightChild);
  }

  /**
   * Verify a Merkle proof
   */
  public static verifyProof(proof: MerkleProof): boolean {
    let currentHash = proof.leaf;
    let currentIndex = proof.index;

    for (const sibling of proof.path) {
      const isRightNode = currentIndex % 2 === 1;
      
      const hasher = new Bun.CryptoHasher('sha256');
      if (isRightNode) {
        hasher.update(sibling + currentHash.slice(2));
      } else {
        hasher.update(currentHash + sibling.slice(2));
      }
      currentHash = '0x' + hasher.digest('hex');
      
      currentIndex = Math.floor(currentIndex / 2);
    }

    return currentHash === proof.root;
  }

  /**
   * Get tree statistics
   */
  public getInfo() {
    return {
      root: this.getRoot(),
      depth: this.depth,
      leafCount: this.leaves.length
    };
  }

  /**
   * Get all leaves
   */
  public getLeaves(): string[] {
    return [...this.leaves];
  }
}

