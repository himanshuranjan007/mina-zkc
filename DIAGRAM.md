# System Diagrams

Visual representations of the Zcash-Mina Bridge architecture.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Zcash-Mina Privacy Bridge                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│    Zcash     │────────▶│   Relayer    │────────▶│     Mina     │
│  Blockchain  │  Events │   Service    │  Proofs │   Protocol   │
│              │         │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
      │                        │                         │
      │                        │                         │
      ▼                        ▼                         ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Shielded    │         │  Proof       │         │   zkApp      │
│  Pool        │         │  Generator   │         │  Contract    │
│  (Merkle)    │         │  (Recursive) │         │  (Verify)    │
└──────────────┘         └──────────────┘         └──────────────┘
```

## Component Interaction

```
User Deposit Flow:
──────────────────

1. User → Zcash: Create shielded deposit
   ┌─────┐     deposit(commitment)      ┌──────────┐
   │User │ ─────────────────────────────▶│  Zcash   │
   └─────┘                                │Simulator │
                                          └─────┬────┘
                                                │
                                                ▼
                                        Insert to Merkle Tree
                                                │
                                                ▼
                                          Emit Event

2. Relayer: Watch and Process
   ┌─────────┐      poll events       ┌──────────┐
   │ Relayer │◀──────────────────────│  Zcash   │
   │ Watcher │                        │Simulator │
   └────┬────┘                        └──────────┘
        │
        │ fetch proof
        ▼
   ┌─────────┐      getMerkleProof    ┌──────────┐
   │ Relayer │─────────────────────────▶│  Zcash   │
   │ Prover  │◀─────────────────────────│Simulator │
   └────┬────┘      return proof       └──────────┘
        │
        │ generate zkSNARK
        ▼
   Recursive Proof Generation
        │
        ▼
   ┌──────────┐
   │ Relayer  │
   │Submitter │
   └────┬─────┘
        │
        │ submit proof
        ▼

3. Mina: Verify and Mint
   ┌──────────┐    verifyAndMint()    ┌──────────┐
   │ Relayer  │──────────────────────▶│   Mina   │
   │Submitter │                        │  zkApp   │
   └──────────┘                        └─────┬────┘
                                             │
                                             ▼
                                      Verify Proof
                                             │
                                             ▼
                                      Update State
                                             │
                                             ▼
                                      Mint Tokens
```

## Data Flow

```
Commitment Journey:
──────────────────

┌─────────────────────────────────────────────────────────────┐
│ 1. COMMITMENT CREATION                                      │
└─────────────────────────────────────────────────────────────┘
   commitment = hash(amount, recipient, randomness)
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. MERKLE TREE INSERTION                                    │
└─────────────────────────────────────────────────────────────┘
   index = tree.insert(commitment)
   root = tree.getRoot()
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. MERKLE PROOF GENERATION                                  │
└─────────────────────────────────────────────────────────────┘
   proof = {
     leaf: commitment,
     index: index,
     path: [sibling₀, sibling₁, ..., sibling₃₁],
     root: root
   }
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. RECURSIVE SNARK GENERATION                               │
└─────────────────────────────────────────────────────────────┘
   zkProof = MerkleProofProgram.verifyProof(
     root,
     commitment,
     siblings,
     isLefts
   )
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. MINA VERIFICATION                                        │
└─────────────────────────────────────────────────────────────┘
   zkApp.verifyAndMint(zkProof, commitment, recipient, amount)
        │
        ▼
   ✅ Tokens Minted on Mina
```

## Merkle Tree Structure

```
                          Root (Level 32)
                            │
                ┌───────────┴───────────┐
                │                       │
           Level 31                Level 31
                │                       │
        ┌───────┴───────┐       ┌───────┴───────┐
        │               │       │               │
    Level 30        Level 30  Level 30      Level 30
        │               │       │               │
        ...            ...     ...             ...
        │               │       │               │
    Level 0         Level 0  Level 0        Level 0
        │               │       │               │
   Commitment₀    Commitment₁ Commitment₂  Commitment₃

Proof Path for Commitment₀:
  [sibling₁, parent_sibling, ..., root_sibling]
  
Verification:
  hash₀ = commitment₀
  hash₁ = hash(hash₀, sibling₁)
  hash₂ = hash(hash₁, sibling₂)
  ...
  hash₃₂ = root ✓
```

## Circuit Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              MerkleProofCircuit (ZkProgram)                 │
└─────────────────────────────────────────────────────────────┘

Public Input:  root (Field)
Private Input: leaf (Field), siblings[32] (Field[]), isLefts[32] (Bool[])
Public Output: valid (Bool)

Circuit Logic:
──────────────

  currentHash ← leaf
  
  for i = 0 to 31:
    if isLefts[i]:
      currentHash ← hash(currentHash, siblings[i])
    else:
      currentHash ← hash(siblings[i], currentHash)
  
  return currentHash == root


┌─────────────────────────────────────────────────────────────┐
│              Recursive Composition                          │
└─────────────────────────────────────────────────────────────┘

  Proof₁ + Proof₂ → Proof₃
  
  verifyBatch(root, proof₁, proof₂):
    valid₁ ← verify(proof₁)
    valid₂ ← verify(proof₂)
    return valid₁ AND valid₂
```

## State Transitions

```
┌─────────────────────────────────────────────────────────────┐
│                  ZcashBridge State                          │
└─────────────────────────────────────────────────────────────┘

State Variables:
  • zcashRoot: Field          (Current Zcash Merkle root)
  • totalBridged: Field       (Total amount bridged)
  • lastUpdateBlock: Field    (Last update timestamp)
  • processedCommitments: Set (Nullifier set)

State Transitions:
──────────────────

1. updateZcashRoot(newRoot, blockHeight)
   ┌──────────────┐
   │ zcashRoot    │ ──▶ newRoot
   │ lastUpdate   │ ──▶ blockHeight
   └──────────────┘

2. verifyAndMint(proof, commitment, recipient, amount)
   ┌──────────────┐
   │ Verify proof │ ──▶ ✓
   │ Check nullifier│ ──▶ ✓
   │ Add to set   │ ──▶ commitment
   │ totalBridged │ ──▶ totalBridged + amount
   │ Mint tokens  │ ──▶ recipient
   └──────────────┘
```

## Relayer State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                  Relayer Processing States                  │
└─────────────────────────────────────────────────────────────┘

     ┌─────────┐
     │ PENDING │
     └────┬────┘
          │
          │ Event detected
          ▼
     ┌─────────┐
     │ PROVING │
     └────┬────┘
          │
          │ Proof generated
          ▼
   ┌──────────────┐
   │  SUBMITTED   │
   └──────┬───────┘
          │
          ├─────────▶ ┌───────────┐
          │           │ CONFIRMED │
          │           └───────────┘
          │
          └─────────▶ ┌─────────┐
                      │ FAILED  │
                      └────┬────┘
                           │
                           │ Retry
                           ▼
                      ┌─────────┐
                      │ PENDING │
                      └─────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Trust Boundaries                         │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│    Zcash     │         │   Relayer    │         │     Mina     │
│   (Trusted)  │         │ (Semi-Trust) │         │   (Trusted)  │
│              │         │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
      │                        │                         │
      │ Consensus              │ Proofs                  │ Consensus
      │ Security               │ Cryptography            │ Security
      │                        │                         │
      ▼                        ▼                         ▼
  Merkle Root              zkSNARK                  Verification
  Commitment               Generation                Contract


Threat Model:
─────────────

1. Malicious Relayer
   ├─ Cannot forge proofs (cryptographic security)
   ├─ Cannot double-spend (nullifier set)
   └─ Can censor (availability issue)

2. Network Attacker
   ├─ Cannot modify proofs (integrity)
   ├─ Cannot replay (nonce/nullifier)
   └─ Can delay (DoS)

3. Smart Contract Bug
   ├─ Formal verification needed
   ├─ Audit required
   └─ Upgrade mechanism
```

## Performance Characteristics

```
┌─────────────────────────────────────────────────────────────┐
│                    Latency Breakdown                        │
└─────────────────────────────────────────────────────────────┘

Zcash Deposit          │██│ ~10ms
                       │
Merkle Proof Gen       │█│ ~5ms
                       │
Relayer Detection      │████████│ ~5s (poll interval)
                       │
zkSNARK Generation     │████████████████│ ~5-10s
                       │
Mina Submission        │████│ ~1-2s
                       │
Mina Confirmation      │████████████│ ~3-5min (block time)
                       │
                       └──────────────────────────────▶
                         Total: ~3-5 minutes

Optimization Opportunities:
  • Batch processing: 3x throughput
  • Parallel proving: 2x speed
  • Proof caching: 50% reduction
```

## Deployment Topology

```
┌─────────────────────────────────────────────────────────────┐
│                  Production Deployment                      │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │  Load        │
                    │  Balancer    │
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
      ┌─────────┐    ┌─────────┐    ┌─────────┐
      │Relayer 1│    │Relayer 2│    │Relayer 3│
      └────┬────┘    └────┬────┘    └────┬────┘
           │              │              │
           └──────────────┼──────────────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
           ▼              ▼              ▼
      ┌────────┐    ┌─────────┐    ┌────────┐
      │ Zcash  │    │Database │    │  Mina  │
      │  Node  │    │(State)  │    │  Node  │
      └────────┘    └─────────┘    └────────┘
```

---

**Note**: These diagrams represent the PoC architecture. Production deployment would require additional components for security, redundancy, and scalability.

