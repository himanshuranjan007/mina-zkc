# 📚 Documentation Index

Complete guide to navigating the Zcash-Mina Bridge PoC documentation.

## 🚀 Getting Started

**New to the project? Start here:**

1. **[README.md](./README.md)** - Main documentation
   - Overview and features
   - Installation instructions
   - Usage guide
   - API reference

2. **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup
   - Prerequisites
   - Quick installation
   - Running the bridge
   - Common commands

3. **[scripts/setup.sh](./scripts/setup.sh)** - Automated setup
   - One-command installation
   - Dependency checking
   - Environment setup

## 📖 Core Documentation

### Architecture & Design

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Deep technical dive
  - System components
  - Data structures
  - Cryptographic primitives
  - Security model
  - Performance characteristics

- **[DIAGRAM.md](./DIAGRAM.md)** - Visual representations
  - Architecture diagrams
  - Data flow charts
  - State machines
  - Deployment topology

### Project Information

- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Project overview
  - What's included
  - Statistics
  - Key features
  - Success criteria

- **[LICENSE](./LICENSE)** - MIT License
  - Usage terms
  - Disclaimer
  - Liability information

## 🔒 Security & Contributing

- **[SECURITY.md](./SECURITY.md)** - Security policy
  - Vulnerability reporting
  - Known limitations
  - Threat model
  - Best practices

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guide
  - Development workflow
  - Code style
  - Pull request process
  - Community guidelines

## 🧩 Component Documentation

### Zcash Simulator

**Location**: `zcash-sim/`

- **[zcash-sim/README.md](./zcash-sim/README.md)**
  - Features
  - Installation
  - API endpoints
  - Configuration

**Key Files**:
- `src/merkle.ts` - Merkle tree implementation
- `src/server.ts` - REST API server
- `src/types.ts` - Type definitions
- `src/server.test.ts` - Unit tests

### Mina zkApp

**Location**: `mina-snark/`

- **[mina-snark/README.md](./mina-snark/README.md)**
  - Features
  - Circuit compilation
  - Smart contract
  - Testing

**Key Files**:
- `src/MerkleProofCircuit.ts` - Recursive proof circuit
- `src/ZcashBridge.ts` - Smart contract
- `src/compile.ts` - Compilation script
- `src/ZcashBridge.test.ts` - Unit tests

### Bridge Relayer

**Location**: `relayer/`

- **[relayer/README.md](./relayer/README.md)**
  - Features
  - Configuration
  - Architecture
  - Error handling

**Key Files**:
- `src/watcher.ts` - Event monitoring
- `src/prover.ts` - Proof generation
- `src/submitter.ts` - Mina submission
- `src/index.ts` - Main orchestration
- `src/relayer.test.ts` - Unit tests

## 🧪 Testing

### Test Files

- **[test:e2e.ts](./test:e2e.ts)** - End-to-end test
  - Complete bridge flow
  - Integration testing
  - Automated verification

- **Component Tests**
  - `zcash-sim/src/server.test.ts`
  - `mina-snark/src/ZcashBridge.test.ts`
  - `relayer/src/relayer.test.ts`

### Running Tests

```bash
# All tests
bun test

# E2E test
bun run test:e2e

# Component tests
cd zcash-sim && bun test
cd mina-snark && bun test
cd relayer && bun test
```

## 🛠️ Scripts & Automation

### Setup & Demo

- **[scripts/setup.sh](./scripts/setup.sh)** - Automated setup
  - Install dependencies
  - Create environment files
  - Run tests
  - Verify installation

- **[scripts/demo.sh](./scripts/demo.sh)** - Interactive demo
  - Create deposits
  - Generate proofs
  - Simulate bridge flow
  - Show results

### CI/CD

- **[.github/workflows/ci.yml](./.github/workflows/ci.yml)** - GitHub Actions
  - Automated testing
  - Build verification
  - Continuous integration

## 📦 Configuration Files

### Root Configuration

- **[package.json](./package.json)** - Root package
  - Workspace configuration
  - Scripts
  - Dependencies

- **[tsconfig.json](./tsconfig.json)** - TypeScript config
  - Compiler options
  - Module resolution
  - Type checking

- **[.gitignore](./.gitignore)** - Git ignore rules
  - Node modules
  - Build artifacts
  - Environment files

### Component Configuration

- `zcash-sim/package.json` - Zcash simulator
- `mina-snark/package.json` - Mina zkApp
- `relayer/package.json` - Bridge relayer

### Environment Files

- `zcash-sim/.env.example` - Zcash config template
- `relayer/.env.example` - Relayer config template

## 📚 Learning Path

### For Beginners

1. Read [QUICKSTART.md](./QUICKSTART.md)
2. Run [scripts/setup.sh](./scripts/setup.sh)
3. Try [scripts/demo.sh](./scripts/demo.sh)
4. Explore [README.md](./README.md)

### For Developers

1. Study [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Review [DIAGRAM.md](./DIAGRAM.md)
3. Read component READMEs
4. Examine source code
5. Run tests

### For Contributors

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Check [SECURITY.md](./SECURITY.md)
3. Review code structure
4. Run test suite
5. Submit PRs

### For Researchers

1. Study [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Review circuit implementations
3. Analyze security model
4. Explore cryptographic primitives
5. Read academic references

## 🔍 Quick Reference

### API Endpoints (Zcash Simulator)

```
POST   /deposit              - Create deposit
GET    /merkle-proof/:id     - Get proof
GET    /tree-root            - Get root
GET    /tree-info            - Get tree stats
GET    /commitments          - List all
GET    /events               - Get events
POST   /verify-proof         - Verify proof
POST   /reset                - Reset (testing)
```

### Key Concepts

- **Commitment**: Hash hiding transaction details
- **Merkle Tree**: Efficient proof structure
- **zkSNARK**: Zero-knowledge proof
- **Recursive Proof**: Proof verifying other proofs
- **Nullifier**: Prevents double-spending
- **Bridge**: Cross-chain connection

### Important Commands

```bash
# Setup
./scripts/setup.sh

# Start components
cd zcash-sim && bun run dev
cd relayer && bun run dev

# Testing
bun test
bun run test:e2e

# Demo
./scripts/demo.sh

# Build
bun run build
```

## 🎯 Use Case Navigation

### "I want to..."

**...understand the system**
→ [ARCHITECTURE.md](./ARCHITECTURE.md), [DIAGRAM.md](./DIAGRAM.md)

**...run the bridge**
→ [QUICKSTART.md](./QUICKSTART.md), [scripts/setup.sh](./scripts/setup.sh)

**...contribute code**
→ [CONTRIBUTING.md](./CONTRIBUTING.md), component READMEs

**...report a bug**
→ [SECURITY.md](./SECURITY.md), GitHub Issues

**...understand security**
→ [SECURITY.md](./SECURITY.md), [ARCHITECTURE.md](./ARCHITECTURE.md)

**...see it in action**
→ [scripts/demo.sh](./scripts/demo.sh), [test:e2e.ts](./test:e2e.ts)

**...learn zkSNARKs**
→ [mina-snark/](./mina-snark/), [ARCHITECTURE.md](./ARCHITECTURE.md)

**...build something similar**
→ All documentation, source code

## 📞 Getting Help

### Documentation Issues

- Unclear documentation? Open an issue
- Missing information? Submit a PR
- Questions? Check GitHub Discussions

### Technical Issues

- Bug reports: GitHub Issues
- Feature requests: GitHub Issues
- Security issues: See [SECURITY.md](./SECURITY.md)

### Community

- Discussions: GitHub Discussions
- Contributing: See [CONTRIBUTING.md](./CONTRIBUTING.md)
- Code of Conduct: Be respectful and inclusive

## 🗺️ Project Structure

```
zypherpunk/
├── README.md              # Main documentation
├── QUICKSTART.md          # Quick start guide
├── ARCHITECTURE.md        # Technical deep dive
├── DIAGRAM.md             # Visual diagrams
├── CONTRIBUTING.md        # Contribution guide
├── SECURITY.md            # Security policy
├── PROJECT_SUMMARY.md     # Project overview
├── LICENSE                # MIT license
├── INDEX.md               # This file
│
├── zcash-sim/             # Zcash simulator
│   ├── README.md
│   ├── package.json
│   └── src/
│
├── mina-snark/            # Mina zkApp
│   ├── README.md
│   ├── package.json
│   └── src/
│
├── relayer/               # Bridge relayer
│   ├── README.md
│   ├── package.json
│   └── src/
│
├── scripts/               # Automation scripts
│   ├── setup.sh
│   └── demo.sh
│
├── .github/               # GitHub config
│   └── workflows/
│       └── ci.yml
│
├── test:e2e.ts           # E2E test
├── package.json           # Root package
├── tsconfig.json          # TypeScript config
└── .gitignore            # Git ignore
```

## 📊 Documentation Statistics

- **Total Documents**: 15+
- **README Files**: 4
- **Guide Documents**: 6
- **Configuration Files**: 5
- **Test Files**: 4
- **Scripts**: 2

## ✅ Documentation Checklist

- ✅ Getting started guide
- ✅ Architecture documentation
- ✅ API reference
- ✅ Security policy
- ✅ Contributing guidelines
- ✅ Code examples
- ✅ Diagrams
- ✅ Testing guide
- ✅ Troubleshooting
- ✅ License

## 🎓 Additional Resources

### External Links

- [Zcash Protocol](https://z.cash/)
- [Mina Protocol](https://minaprotocol.com/)
- [o1js Documentation](https://docs.minaprotocol.com/zkapps/o1js)
- [Zero-Knowledge Proofs](https://zkp.science/)

### Academic Papers

- Zcash Protocol Specification
- Recursive SNARKs Paper
- Mina Whitepaper

---

**Last Updated**: December 2025

**Maintained By**: Zypherpunk Team

**License**: MIT (see [LICENSE](./LICENSE))

**Status**: ✅ Complete and Active

