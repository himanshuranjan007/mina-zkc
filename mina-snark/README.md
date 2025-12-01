# Mina zkApp - Zcash Bridge

Recursive zero-knowledge proof verification for Zcash bridge using o1js (SnarkyJS).

## Features

- **Merkle Proof Verification**: Verifies Zcash commitment inclusion
- **Recursive SNARKs**: Composes proofs efficiently
- **Bridge Contract**: Smart contract for cross-chain verification
- **Token Minting**: Issues wrapped tokens on Mina

## Installation

```bash
bun install
```

## Usage

### Compile Circuits

```bash
bun run compile
```

This generates proving and verification keys for:
- Merkle proof circuit
- Bridge smart contract

### Run Tests

```bash
bun test
```

### Development

```bash
bun run dev
```

## Architecture

### MerkleProofCircuit

Verifies 32-level Merkle tree inclusion proofs:

```typescript
import { MerkleProofProgram, prepareMerkleProofData } from './MerkleProofCircuit';

// Prepare proof data
const proofData = prepareMerkleProofData({
  leaf: '0x123...',
  index: 5,
  path: [...],
  root: '0xabc...'
});

// Generate proof
const proof = await MerkleProofProgram.verifyProof(
  proofData.root,
  proofData.leaf,
  proofData.siblings,
  proofData.isLefts
);
```

### ZcashBridge Contract

Smart contract that:
1. Stores Zcash Merkle root
2. Verifies recursive proofs
3. Tracks processed commitments
4. Mints wrapped tokens

```typescript
import { ZcashBridge } from './ZcashBridge';

// Deploy
const zkApp = new ZcashBridge(zkAppAddress);
await zkApp.deploy();

// Verify and mint
await zkApp.verifyAndMint(proof, commitment, recipient, amount);
```

## Circuit Details

### Proof System

- **Hash Function**: Poseidon (for efficiency in Mina)
- **Tree Depth**: 32 levels
- **Proof Size**: ~22KB (constant)
- **Verification Time**: O(1)

### Recursive Composition

The circuit supports proof composition:

```
Proof₁ + Proof₂ → Proof₃
```

This enables batching multiple bridge operations.

## Testing

### Unit Tests

```bash
bun test src/MerkleProofCircuit.test.ts
bun test src/ZcashBridge.test.ts
```

### Integration Tests

```bash
bun test src/integration.test.ts
```

## Production Considerations

⚠️ **This is a PoC - NOT production ready**

For production:
- Use actual SHA256 gadgets (not Poseidon)
- Implement proper nullifier set
- Add access control for root updates
- Implement token standard (e.g., FungibleToken)
- Add event emissions
- Conduct security audit

## API Reference

### MerkleProofProgram

- `verifyProof(root, leaf, siblings, isLefts)` - Verify single proof
- `verifyBatch(root, leaf1, siblings1, isLefts1, leaf2, siblings2, isLefts2)` - Verify multiple proofs

### ZcashBridge

- `updateZcashRoot(newRoot, blockHeight)` - Update Zcash state
- `verifyAndMint(proof, commitment, recipient, amount)` - Bridge tokens
- `getBridgeState()` - Get current state
- `pause(admin)` - Emergency pause

## Resources

- [o1js Documentation](https://docs.minaprotocol.com/zkapps/o1js)
- [Mina Protocol](https://minaprotocol.com)
- [zkApp Examples](https://github.com/o1-labs/docs2/tree/main/examples/zkapps)

