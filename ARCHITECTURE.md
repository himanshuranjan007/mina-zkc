# Architecture Documentation

## Overview

The Zcash-Mina Privacy Bridge is a proof-of-concept implementation demonstrating how to bridge privacy-preserving transactions between Zcash and Mina Protocol using recursive zero-knowledge proofs.

## System Components

### 1. Zcash Simulator (`zcash-sim/`)

**Purpose**: Simulates a Zcash node with shielded pool functionality.

**Key Components**:
- **Merkle Tree**: Implements a 32-level Merkle tree for commitment tracking
- **Shielded Pool**: Stores commitments and their metadata
- **REST API**: Provides endpoints for deposits and proof generation
- **Event System**: Emits events for relayer monitoring

**Data Flow**:
```
User Deposit → Commitment → Merkle Tree → Event Emission
```

**Key Files**:
- `src/merkle.ts` - Merkle tree implementation with SHA-256 hashing
- `src/server.ts` - Express server with REST API
- `src/types.ts` - Type definitions

### 2. Mina zkApp (`mina-snark/`)

**Purpose**: Smart contract on Mina that verifies Zcash proofs and mints wrapped tokens.

**Key Components**:
- **MerkleProofCircuit**: Recursive zkSNARK for Merkle proofs verification
- **ZcashBridge Contract**: Smart contract with state management
- **Proof Composition**: Enables batching multiple proofs

**Circuit Design**:
```
Input: Merkle Root (public)
Private Inputs: Leaf, Siblings[32], IsLeft[32]b
Output: Bool (verification result)

Circuit Logic:
  currentHash = leaf
  for i in 0..31:
    if isLeft[i]:
      currentHash = hash(currentHash, siblings[i])
    else:
      currentHash = hash(siblings[i], currentHash)
  return currentHash == root
```

**Key Files**:
- `src/MerkleProofCircuit.ts` - Recursive proof verification
- `src/ZcashBridge.ts` - Smart contract implementation
- `src/compile.ts` - Circuit compilation script

### 3. Relayer Service (`relayer/`)

**Purpose**: Bridges the two chains by watching Zcash and submitting proofs to Mina.

**Key Components**:
- **Watcher**: Polls Zcash for new deposit events
- **Prover**: Generates recursive zkSNARKs
- **Submitter**: Submits proofs to Mina zkApp

**Processing Pipeline**:
```
1. Watch Zcash Events
   ↓
2. Fetch Merkle Proof
   ↓
3. Generate Recursive SNARK
   ↓
4. Submit to Mina zkApp
   ↓
5. Wait for Confirmation
```

**Key Files**:
- `src/watcher.ts` - Event monitoring
- `src/prover.ts` - Proof generation
- `src/submitter.ts` - Mina submission
- `src/index.ts` - Main orchestration

## Data Structures

### Commitment

```typescript
interface Commitment {
  value: string;      // 32-byte hex string
  index: number;      // Position in Merkle tree
  timestamp: number;  // Unix timestamp
}
```

### Merkle Proof

```typescript
interface MerkleProof {
  leaf: string;       // Commitment hash
  index: number;      // Leaf position
  path: string[];     // 32 sibling hashes
  root: string;       // Merkle root
}
```

### Bridge State

```typescript
interface BridgeState {
  zcashRoot: Field;           // Current Zcash Merkle root
  totalBridged: Field;        // Total amount bridged
  lastUpdateBlock: Field;     // Last update block number
  processedCommitments: Set;  // Nullifier set
}
```

## Cryptographic Primitives

### Hash Functions

**Zcash Simulator**: SHA-256
- Used for Merkle tree construction
- Standard cryptographic hash
- 32-byte output

**Mina Circuits**: Poseidon
- Used in zkSNARK circuits
- Optimized for zero-knowledge proofs
- Efficient in arithmetic circuits

### Zero-Knowledge Proofs

**Proof System**: Recursive SNARKs (via o1js)
- **Prover Time**: O(n) where n = tree depth
- **Verifier Time**: O(1) constant time
- **Proof Size**: ~22KB constant size
- **Recursion**: Proofs can verify other proofs

### Merkle Tree

**Configuration**:
- Depth: 32 levels
- Capacity: 2^32 leaves (~4 billion)
- Hash: SHA-256 (simulator) / Poseidon (circuits)

**Properties**:
- Append-only structure
- Efficient proof generation: O(log n)
- Proof size: 32 hashes (1KB)

## Security Model

### Threat Model

**Assumptions**:
1. Zcash consensus is secure
2. Mina consensus is secure
3. zkSNARK soundness holds
4. Hash functions are collision-resistant

**Threats**:
1. **Double-spending**: Prevented by nullifier set
2. **Invalid proofs**: Prevented by zkSNARK verification
3. **Relayer censorship**: Mitigated by multiple relayers (future)
4. **Front-running**: Mitigated by commitment scheme

### Privacy Guarantees

**What is Private**:
- Transaction amounts
- Sender identity
- Recipient identity (on Zcash side)
- Transaction graph

**What is Public**:
- Merkle root updates
- Proof submissions
- Total bridged amount
- Timing information

### Trust Assumptions

**Current PoC**:
- Single relayer (centralized)
- No economic security
- Simulated Zcash (not real)

**Production Requirements**:
- Multi-party relayer committee
- Stake-based security
- Real Zcash integration
- Formal verification

## Performance Characteristics

### Zcash Simulator

- Deposit processing: ~10ms
- Merkle proof generation: ~5ms
- Tree update: ~1ms

### Mina Circuits

- Circuit compilation: ~30s (one-time)
- Proof generation: ~5-10s per proof
- Proof verification: ~100ms
- Recursive composition: ~15s for 2 proofs

### Relayer

- Event polling: 5s interval
- End-to-end latency: ~20s
- Throughput: ~3 tx/min (single-threaded)

### Optimization Opportunities

1. **Batch Processing**: Combine multiple proofs
2. **Parallel Proving**: Multi-threaded proof generation
3. **Proof Caching**: Reuse intermediate proofs
4. **State Compression**: Optimize on-chain storage

## Scalability Considerations

### Current Limitations

1. **Sequential Processing**: One commitment at a time
2. **Proof Generation**: CPU-intensive
3. **On-chain Storage**: Linear growth with commitments

### Scaling Solutions

1. **Batching**: Process multiple commitments per proof
2. **Sharding**: Multiple bridge instances
3. **Rollups**: Aggregate proofs off-chain
4. **State Pruning**: Archive old commitments

## Integration Points

### Zcash Integration (Production)

```typescript
// Replace simulator with real Zcash RPC
const zcash = new ZcashRPC({
  url: 'http://zcash-node:8232',
  user: 'user',
  password: 'pass'
});

// Monitor shielded pool
const commitment = await zcash.z_getcommitment(txid);
const proof = await zcash.z_getmerkleproof(commitment);
```

### Mina Integration

```typescript
// Deploy zkApp
const zkApp = new ZcashBridge(zkAppAddress);
await zkApp.deploy();

// Submit proof
const tx = await Mina.transaction(sender, () => {
  zkApp.verifyAndMint(proof, commitment, recipient, amount);
});
await tx.prove();
await tx.sign([senderKey]).send();
```

## Testing Strategy

### Unit Tests

- Merkle tree operations
- Proof generation
- Circuit logic
- State transitions

### Integration Tests

- Zcash → Relayer flow
- Relayer → Mina flow
- End-to-end bridge operation

### Security Tests

- Invalid proof rejection
- Double-spend prevention
- Access control
- Edge cases

## Deployment Architecture

### Local Development

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Zcash     │────▶│   Relayer    │────▶│    Mina     │
│  localhost  │     │  localhost   │     │  localhost  │
│   :3000     │     │              │     │   :8080     │
└─────────────┘     └──────────────┘     └─────────────┘
```

### Production (Conceptual)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Zcash     │────▶│  Relayer     │────▶│    Mina     │
│  Mainnet    │     │  Committee   │     │  Mainnet    │
│             │     │  (Multi-sig) │     │             │
└─────────────┘     └──────────────┘     └─────────────┘
                          │
                          ▼
                    ┌──────────┐
                    │  Oracle  │
                    │  Network │
                    └──────────┘
```

## Future Enhancements

### Short-term

1. Real Zcash integration
2. Multiple relayer support
3. Batch proof generation
4. Enhanced monitoring

### Long-term

1. Bidirectional bridge (Mina → Zcash)
2. Multi-asset support
3. Decentralized relayer network
4. Cross-chain messaging
5. Formal verification
6. Hardware acceleration for proving

## References

- [Zcash Protocol Specification](https://zips.z.cash/protocol/protocol.pdf)
- [Mina Protocol Documentation](https://docs.minaprotocol.com/)
- [o1js Reference](https://docs.minaprotocol.com/zkapps/o1js)
- [Recursive SNARKs Paper](https://eprint.iacr.org/2019/1021)

