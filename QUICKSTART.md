# Quick Start Guide

Get the Zcash-Mina bridge running in 5 minutes!

## Prerequisites

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version  # Should be >= 1.0.0
```

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd zypherpunk

# Install all dependencies
bun install
cd zcash-sim && bun install && cd ..
cd relayer && bun install && cd ..
cd mina-snark && bun install && cd ..
```

## Running the Bridge

### Step 1: Start Zcash Simulator

Open Terminal 1:

```bash
cd zcash-sim
bun run dev
```

You should see:

```
╔════════════════════════════════════════════╗
║   Zcash Simulator - Bridge PoC             ║
╚════════════════════════════════════════════╝

🚀 Server running on http://localhost:3000
📊 Merkle tree depth: 32
🌳 Initial root: 0x...

Ready to accept deposits! 🔐
```

### Step 2: Test a Deposit

Open Terminal 2:

```bash
# Create a test deposit
curl -X POST http://localhost:3000/deposit \
  -H "Content-Type: application/json" \
  -d '{"commitment": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"}'
```

Response:

```json
{
  "success": true,
  "commitment": "0x1234...",
  "index": 0,
  "root": "0xabcd..."
}
```

### Step 3: Get Merkle Proof

```bash
curl http://localhost:3000/merkle-proof/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Step 4: Start Relayer (Optional)

Open Terminal 3:

```bash
cd relayer
bun run dev
```

The relayer will:
- Watch for new deposits
- Generate proofs automatically
- Submit to Mina (simulated)

### Step 5: Run End-to-End Test

Open Terminal 4:

```bash
# Make sure Zcash simulator is running first!
bun run test:e2e
```

You should see:

```
╔════════════════════════════════════════════╗
║   E2E Test - Zcash ↔ Mina Bridge          ║
╚════════════════════════════════════════════╝

1️⃣ Testing Zcash Simulator...
   ✅ Zcash simulator is healthy

2️⃣ Creating Zcash Deposit...
   ✅ Deposit successful

3️⃣ Fetching Merkle Proof...
   ✅ Merkle proof received

...

🎉 All tests passed! Bridge is working correctly.
```

## Common Commands

### Development

```bash
# Start Zcash simulator
cd zcash-sim && bun run dev

# Start relayer
cd relayer && bun run dev

# Run Mina tests
cd mina-snark && bun test
```

### Testing

```bash
# Run all tests
bun test

# Run E2E test
bun run test:e2e

# Test specific component
cd zcash-sim && bun test
```

### Building

```bash
# Build all workspaces
bun run build

# Build specific workspace
cd zcash-sim && bun run build
```

## API Examples

### Create Deposit

```bash
curl -X POST http://localhost:3000/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "commitment": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  }'
```

### Get Merkle Proof

```bash
curl http://localhost:3000/merkle-proof/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Get Tree Info

```bash
curl http://localhost:3000/tree-info
```

### Get All Commitments

```bash
curl http://localhost:3000/commitments
```

### Get Recent Events

```bash
curl http://localhost:3000/events?since=0
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Bun Not Found

```bash
# Reload shell configuration
source ~/.bashrc  # or ~/.zshrc

# Or add to PATH manually
export PATH="$HOME/.bun/bin:$PATH"
```

### Dependencies Not Installing

```bash
# Clear cache and reinstall
rm -rf node_modules
rm bun.lockb
bun install
```

### Tests Failing

```bash
# Make sure Zcash simulator is running
cd zcash-sim && bun run dev

# In another terminal, run tests
bun run test:e2e
```

## Next Steps

1. **Explore the Code**
   - Check out `zcash-sim/src/` for Merkle tree implementation
   - Look at `mina-snark/src/` for zkSNARK circuits
   - Review `relayer/src/` for bridge logic

2. **Read Documentation**
   - [Architecture](./ARCHITECTURE.md) - System design
   - [Contributing](./CONTRIBUTING.md) - How to contribute
   - [README](./README.md) - Full documentation

3. **Experiment**
   - Create multiple deposits
   - Modify Merkle tree depth
   - Add custom proof logic

4. **Contribute**
   - Fix bugs
   - Add features
   - Improve documentation

## Getting Help

- **Issues**: Check [GitHub Issues](https://github.com/yourusername/zypherpunk/issues)
- **Documentation**: Read the [full README](./README.md)
- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)

## What's Next?

Now that you have the bridge running:

1. Try creating multiple deposits
2. Watch the relayer process them
3. Explore the Mina zkApp circuits
4. Read the architecture documentation
5. Consider contributing!

Happy bridging! 🌉

