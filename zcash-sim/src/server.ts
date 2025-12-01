/**
 * Zcash Simulator Server
 * Simulates a Zcash node with shielded pool for bridge PoC
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { MerkleTree } from './merkle';
import type {
  Commitment,
  DepositRequest,
  DepositResponse,
  ProofRequest,
  ProofResponse,
  ShieldedPool
} from './types';

const app = express();
const PORT = process.env.PORT || 3000;
const MERKLE_DEPTH = parseInt(process.env.MERKLE_DEPTH || '32');

// Middleware
app.use(cors());
app.use(express.json());

// State
const merkleTree = new MerkleTree(MERKLE_DEPTH);
const shieldedPool: ShieldedPool = {
  commitments: new Map(),
  leaves: []
};

// Event emitter for relayer monitoring
const events: Array<{ type: string; data: any; timestamp: number }> = [];

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'zcash-simulator',
    timestamp: Date.now()
  });
});

/**
 * Get tree information
 */
app.get('/tree-info', (req: Request, res: Response) => {
  const info = merkleTree.getInfo();
  res.json({
    ...info,
    commitmentCount: shieldedPool.commitments.size
  });
});

/**
 * Get current Merkle root
 */
app.get('/tree-root', (req: Request, res: Response) => {
  res.json({
    root: merkleTree.getRoot(),
    timestamp: Date.now()
  });
});

/**
 * Create a shielded deposit (add commitment to pool)
 */
app.post('/deposit', (req: Request, res: Response) => {
  try {
    const { commitment } = req.body as DepositRequest;

    if (!commitment) {
      return res.status(400).json({
        success: false,
        message: 'Commitment is required'
      });
    }

    // Validate commitment format (should be hex string)
    const commitmentHex = commitment.startsWith('0x') ? commitment : '0x' + commitment;
    if (!/^0x[0-9a-fA-F]{64}$/.test(commitmentHex)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid commitment format. Expected 32-byte hex string.'
      });
    }

    // Check for duplicate
    if (shieldedPool.commitments.has(commitmentHex)) {
      return res.status(409).json({
        success: false,
        message: 'Commitment already exists in pool'
      });
    }

    // Insert into Merkle tree
    const index = merkleTree.insert(commitmentHex);
    const root = merkleTree.getRoot();

    // Store commitment metadata
    const commitmentData: Commitment = {
      value: commitmentHex,
      index,
      timestamp: Date.now()
    };
    shieldedPool.commitments.set(commitmentHex, commitmentData);
    shieldedPool.leaves.push(commitmentHex);

    // Emit event for relayer
    const event = {
      type: 'deposit',
      data: {
        commitment: commitmentHex,
        index,
        root
      },
      timestamp: Date.now()
    };
    events.push(event);

    console.log(`✅ Deposit received: ${commitmentHex.slice(0, 10)}... at index ${index}`);

    const response: DepositResponse = {
      success: true,
      commitment: commitmentHex,
      index,
      root
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get Merkle proof for a commitment
 */
app.get('/merkle-proof/:commitment', (req: Request, res: Response) => {
  try {
    const commitment = req.params.commitment.startsWith('0x')
      ? req.params.commitment
      : '0x' + req.params.commitment;

    const commitmentData = shieldedPool.commitments.get(commitment);
    
    if (!commitmentData) {
      return res.status(404).json({
        success: false,
        error: 'Commitment not found in pool'
      });
    }

    const proof = merkleTree.getProof(commitmentData.index);
    
    if (!proof) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate proof'
      });
    }

    console.log(`📋 Proof generated for ${commitment.slice(0, 10)}...`);

    const response: ProofResponse = {
      success: true,
      proof
    };

    res.json(response);
  } catch (error) {
    console.error('Proof generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get all commitments (for debugging)
 */
app.get('/commitments', (req: Request, res: Response) => {
  const commitments = Array.from(shieldedPool.commitments.values());
  res.json({
    count: commitments.length,
    commitments
  });
});

/**
 * Get recent events (for relayer polling)
 */
app.get('/events', (req: Request, res: Response) => {
  const since = parseInt(req.query.since as string) || 0;
  const recentEvents = events.filter(e => e.timestamp > since);
  
  res.json({
    events: recentEvents,
    count: recentEvents.length
  });
});

/**
 * Verify a Merkle proof (utility endpoint)
 */
app.post('/verify-proof', (req: Request, res: Response) => {
  try {
    const { proof } = req.body;
    
    if (!proof) {
      return res.status(400).json({
        success: false,
        message: 'Proof is required'
      });
    }

    const isValid = MerkleTree.verifyProof(proof);
    
    res.json({
      success: true,
      valid: isValid
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Reset the simulator (for testing)
 */
app.post('/reset', (req: Request, res: Response) => {
  shieldedPool.commitments.clear();
  shieldedPool.leaves = [];
  events.length = 0;
  
  // Create new tree
  const newTree = new MerkleTree(MERKLE_DEPTH);
  Object.assign(merkleTree, newTree);
  
  console.log('🔄 Simulator reset');
  
  res.json({
    success: true,
    message: 'Simulator reset successfully'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Zcash Simulator - Bridge PoC             ║
╚════════════════════════════════════════════╝

🚀 Server running on http://localhost:${PORT}
📊 Merkle tree depth: ${MERKLE_DEPTH}
🌳 Initial root: ${merkleTree.getRoot()}

Endpoints:
  GET  /health              - Health check
  GET  /tree-info           - Tree statistics
  GET  /tree-root           - Current Merkle root
  POST /deposit             - Create shielded deposit
  GET  /merkle-proof/:id    - Get inclusion proof
  GET  /commitments         - List all commitments
  GET  /events              - Get recent events
  POST /verify-proof        - Verify a proof
  POST /reset               - Reset simulator

Ready to accept deposits! 🔐
`);
});

export { app, merkleTree, shieldedPool };

