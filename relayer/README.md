# Bridge Relayer

Service that watches Zcash for deposits and submits proofs to Mina zkApp.

## Features

- **Event Monitoring**: Watches Zcash for new deposits
- **Proof Generation**: Creates recursive zkSNARKs
- **Automatic Submission**: Submits proofs to Mina
- **Batch Processing**: Optimizes gas costs
- **Error Handling**: Retries and recovery

## Installation

```bash
bun install
```

## Configuration

Create `.env` file:

```bash
ZCASH_RPC_URL=http://localhost:3000
MINA_ENDPOINT=http://localhost:8080
POLL_INTERVAL=5000
BATCH_SIZE=10
```

## Usage

### Development Mode

```bash
bun run dev
```

### Production

```bash
bun run build
bun run start
```

### Tests

```bash
bun test
```

## Architecture

### Components

1. **Watcher** - Monitors Zcash for events
2. **Prover** - Generates recursive zkSNARKs
3. **Submitter** - Submits proofs to Mina

### Flow

```
Zcash Event → Fetch Proof → Generate SNARK → Submit to Mina
```

### Processing Pipeline

1. **Event Detection**
   - Poll Zcash `/events` endpoint
   - Filter for deposit events
   - Deduplicate commitments

2. **Proof Fetching**
   - Request Merkle proof from Zcash
   - Validate proof structure
   - Prepare for circuit

3. **SNARK Generation**
   - Convert to circuit format
   - Generate recursive proof
   - Verify locally

4. **Mina Submission**
   - Create transaction
   - Call `verifyAndMint()`
   - Wait for confirmation

## API

### BridgeRelayer

```typescript
const relayer = new BridgeRelayer(config);
await relayer.initialize();
await relayer.start();
```

### Configuration

```typescript
interface RelayerConfig {
  zcashRpcUrl: string;
  minaEndpoint: string;
  pollInterval: number;
  batchSize: number;
}
```

## Monitoring

The relayer prints status every 30 seconds:

```
📊 Relayer Status
Uptime: 300s
Processed: 10
Submitted: 9
Failed: 1
Queue: 2
```

## Error Handling

- **Connection Errors**: Retries with exponential backoff
- **Proof Failures**: Logs and continues
- **Submission Failures**: Queues for retry

## Production Considerations

⚠️ **This is a PoC - NOT production ready**

For production:
- Implement persistent storage
- Add retry logic with exponential backoff
- Implement proper key management
- Add metrics and alerting
- Implement rate limiting
- Add circuit breaker pattern
- Use message queue for reliability

## Troubleshooting

### Relayer not starting

Check Zcash connection:
```bash
curl http://localhost:3000/health
```

### Proofs failing

Check circuit compilation:
```bash
cd ../mina-snark && bun run compile
```

### Submissions failing

Check Mina connection:
```bash
# Verify Mina endpoint is reachable
```

