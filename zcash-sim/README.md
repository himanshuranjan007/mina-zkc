# Zcash Simulator

Simulated Zcash node with shielded pool for bridge PoC testing.

## Features

- Merkle tree for commitment tracking
- REST API for deposits and proof generation
- Event emission for relayer monitoring
- Proof verification utilities

## Installation

```bash
bun install
```

## Usage

```bash
# Development mode with auto-reload
bun run dev

# Build
bun run build

# Production
bun run start

# Tests
bun test
```

## API Endpoints

### POST /deposit
Create a shielded deposit.

```bash
curl -X POST http://localhost:3000/deposit \
  -H "Content-Type: application/json" \
  -d '{"commitment": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"}'
```

### GET /merkle-proof/:commitment
Get Merkle inclusion proof.

```bash
curl http://localhost:3000/merkle-proof/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### GET /tree-root
Get current Merkle root.

```bash
curl http://localhost:3000/tree-root
```

## Configuration

Create `.env` file:

```
PORT=3000
MERKLE_DEPTH=32
```

