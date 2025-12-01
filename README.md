# Privacy-Preserving Bridge: Zcash ↔ Mina Protocol

A Proof-of-Concept implementation demonstrating cross-chain privacy-preserving transfers between Zcash and Mina Protocol using recursive zero-knowledge proofs.

## 🎯 Overview

This PoC bridges Zcash's shielded transactions with Mina Protocol's recursive zkSNARKs, enabling:
- **Privacy-preserving cross-chain transfers** without revealing transaction details
- **Efficient verification** using Mina's recursive proof composition
- **Trustless bridge operation** via cryptographic proofs

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Zcash     │────────▶│   Relayer    │────────▶│    Mina     │
│  Simulator  │         │   Service    │         │   zkApp     │
│             │         │              │         │             │
│ • Merkle    │         │ • Watch      │         │ • Verify    │
│   Tree      │         │ • Prove      │         │   Proofs    │
│ • Shielded  │         │ • Submit     │         │ • Mint      │
│   Pool      │         │              │         │   Tokens    │
└─────────────┘         └──────────────┘         └─────────────┘
```

### Components

1. **zcash-sim/** - Simulated Zcash node with shielded pool
2. **relayer/** - Bridge relayer that generates and submits proofs
3. **mina-snark/** - Mina zkApp with recursive proof verification

## 🚀 Quick Start

### Prerequisites

```bash
# Install Bun runtime
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

### Installation

```bash
# Clone and install dependencies
cd zypherpunk
bun install

# Install workspace dependencies
cd zcash-sim && bun install && cd ..
cd relayer && bun install && cd ..
cd mina-snark && bun install && cd ..
```

### Running the PoC

#### Terminal 1: Start Zcash Simulator
```bash
cd zcash-sim
bun run dev
# Listens on http://localhost:3000
```

#### Terminal 2: Start Relayer
```bash
cd relayer
bun run dev
# Watches Zcash, generates proofs, submits to Mina
```

#### Terminal 3: Run Mina Tests
```bash
cd mina-snark
bun test
# Verifies zkApp functionality
```

#### Terminal 4: Execute End-to-End Test
```bash
bun run test:e2e
# Simulates complete bridge flow
```

## 📋 Detailed Setup

### 1. Zcash Simulator

The simulator provides:
- Merkle tree for shielded pool commitments
- REST API for deposits and Merkle proofs
- Event emission for relayer monitoring

```bash
cd zcash-sim
bun run dev

# Test deposit
curl -X POST http://localhost:3000/deposit \
  -H "Content-Type: application/json" \
  -d '{"commitment": "0x1234...abcd"}'
```

### 2. Mina zkApp

SnarkyJS-based smart contract that:
- Verifies Merkle inclusion proofs recursively
- Validates Zcash commitment format
- Mints wrapped tokens on Mina

```bash
cd mina-snark
bun run build
bun test
```

### 3. Relayer Service

Bridges the two chains by:
- Monitoring Zcash for new commitments
- Generating recursive zkSNARKs
- Submitting proofs to Mina zkApp

```bash
cd relayer
bun run dev

# Monitor logs for proof generation
```

## 🧪 Testing

### Unit Tests

```bash
# Test Zcash simulator
cd zcash-sim && bun test

# Test Mina circuits
cd mina-snark && bun test

# Test relayer logic
cd relayer && bun test
```

### Integration Test

```bash
# From root directory
bun run test:e2e
```

This will:
1. Start Zcash simulator
2. Create a shielded deposit
3. Generate Merkle proof
4. Relayer creates recursive zkSNARK
5. Submit to Mina zkApp
6. Verify proof and mint tokens

## 🔒 Privacy & Security

### Privacy Guarantees

- **Zcash side**: Commitments hide sender, amount, and memo
- **Bridge**: Only proves membership, not transaction details
- **Mina side**: Verification doesn't reveal Zcash transaction data

### Security Considerations

⚠️ **This is a PoC - NOT production ready**

Known limitations:
- Simulated Zcash (not real node)
- No key management
- No double-spend protection
- No economic security model
- Single relayer (centralization risk)

For production:
- Integrate with real Zcash node via RPC
- Implement multi-party computation for relayer
- Add slashing conditions
- Implement nullifier tracking
- Conduct security audits

## 📚 Technical Details

### Proof System

The bridge uses a two-layer proof system:

1. **Merkle Inclusion Proof** (Zcash)
   - Proves commitment exists in shielded pool
   - Uses SHA256 hash function
   - Typical depth: 32 levels

2. **Recursive zkSNARK** (Mina)
   - Verifies Merkle proof in O(1) time
   - Composes with other proofs
   - Constant-size verification (~22KB)

### Data Flow

```
Zcash Deposit → Commitment → Merkle Tree
                    ↓
            Merkle Proof Generation
                    ↓
        Relayer Watches & Proves
                    ↓
    Recursive zkSNARK Creation (SnarkyJS)
                    ↓
        Submit to Mina zkApp
                    ↓
    Verify & Mint Wrapped Tokens
```

## 🛠️ Development

### Project Structure

```
zypherpunk/
├── zcash-sim/          # Simulated Zcash node
│   ├── src/
│   │   ├── server.ts   # Express API
│   │   ├── merkle.ts   # Merkle tree implementation
│   │   └── types.ts    # Type definitions
│   └── package.json
│
├── mina-snark/         # Mina zkApp
│   ├── src/
│   │   ├── ZcashBridge.ts      # Main zkApp contract
│   │   ├── MerkleProof.ts      # Proof verification circuit
│   │   ├── RecursiveProof.ts   # Recursive composition
│   │   └── types.ts
│   └── package.json
│
├── relayer/            # Bridge relayer
│   ├── src/
│   │   ├── watcher.ts  # Zcash event monitor
│   │   ├── prover.ts   # Proof generation
│   │   ├── submitter.ts # Mina submission
│   │   └── types.ts
│   └── package.json
│
└── package.json        # Root workspace config
```

### Adding Features

1. **New proof types**: Extend `mina-snark/src/MerkleProof.ts`
2. **Additional chains**: Create new simulator in workspace
3. **Enhanced privacy**: Modify commitment scheme in `zcash-sim`

### Environment Variables

Create `.env` files in each workspace:

```bash
# zcash-sim/.env
PORT=3000
MERKLE_DEPTH=32

# relayer/.env
ZCASH_RPC_URL=http://localhost:3000
MINA_ENDPOINT=http://localhost:8080
POLL_INTERVAL=5000

# mina-snark/.env
NETWORK=testnet
```

## 📖 API Reference

### Zcash Simulator

- `POST /deposit` - Create shielded commitment
- `GET /merkle-proof/:commitment` - Get inclusion proof
- `GET /tree-root` - Get current Merkle root

### Relayer

- `GET /status` - Relayer health and stats
- `POST /process-commitment` - Manually trigger proof generation

### Mina zkApp

- `verifyAndMint(proof, commitment)` - Verify proof and mint tokens
- `getRoot()` - Get verified Zcash root

## 🤝 Contributing

This is a research PoC. Contributions welcome:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🔗 Resources

- [Zcash Protocol Spec](https://zips.z.cash/)
- [Mina Protocol Docs](https://docs.minaprotocol.com/)
- [SnarkyJS Documentation](https://docs.minaprotocol.com/zkapps/snarkyjs-reference)
- [Zero-Knowledge Proofs Explained](https://z.cash/technology/zksnarks/)

## ⚠️ Disclaimer

This is experimental software for research and educational purposes. Do not use in production with real funds. The authors assume no liability for any losses incurred.

## 🙏 Acknowledgments

Built on the shoulders of giants:
- Zcash team for pioneering privacy tech
- Mina Protocol for recursive SNARKs
- SnarkyJS contributors

---

**Status**: ✅ Proof of Concept Complete
**Last Updated**: December 2025

