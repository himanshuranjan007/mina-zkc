/**
 * Bridge Relayer Service
 * Main entry point
 */

import { ZcashWatcher } from './watcher';
import { ProofGenerator } from './prover';
import { MinaSubmitter } from './submitter';
import type {
  RelayerConfig,
  ZcashEvent,
  ProcessedCommitment,
  RelayerStats
} from './types';

export class BridgeRelayer {
  private config: RelayerConfig;
  private watcher: ZcashWatcher;
  private prover: ProofGenerator;
  private submitter: MinaSubmitter;
  private processedCommitments: Map<string, ProcessedCommitment>;
  private stats: RelayerStats;
  private startTime: number;

  constructor(config: RelayerConfig) {
    this.config = config;
    this.watcher = new ZcashWatcher(config.zcashRpcUrl, config.pollInterval);
    this.prover = new ProofGenerator();
    this.submitter = new MinaSubmitter(config.minaEndpoint);
    this.processedCommitments = new Map();
    this.stats = {
      totalProcessed: 0,
      totalSubmitted: 0,
      totalFailed: 0,
      lastProcessedBlock: 0,
      uptime: 0
    };
    this.startTime = Date.now();
  }

  /**
   * Initialize all components
   */
  public async initialize(): Promise<void> {
    console.log('🚀 Initializing Bridge Relayer...\n');

    try {
      // Check Zcash connection
      console.log('1️⃣ Checking Zcash connection...');
      const zcashHealthy = await this.watcher.healthCheck();
      if (!zcashHealthy) {
        throw new Error('Zcash node not reachable');
      }
      console.log('✅ Zcash connected\n');

      // Initialize proof generator
      console.log('2️⃣ Initializing proof generator...');
      await this.prover.initialize();
      console.log('✅ Proof generator ready\n');

      // Initialize Mina submitter
      console.log('3️⃣ Initializing Mina submitter...');
      await this.submitter.initialize();
      console.log('✅ Mina submitter ready\n');

      console.log('🎉 Bridge Relayer initialized successfully!\n');
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start the relayer
   */
  public async start(): Promise<void> {
    console.log('▶️  Starting Bridge Relayer...\n');

    // Register event handler
    this.watcher.onEvent((event) => this.handleZcashEvent(event));

    // Start watching Zcash
    await this.watcher.start();

    console.log('✅ Relayer is running!\n');
    console.log('Monitoring Zcash for deposits...');
    console.log('Press Ctrl+C to stop\n');

    // Print status periodically
    setInterval(() => this.printStatus(), 30000);
  }

  /**
   * Stop the relayer
   */
  public stop(): void {
    console.log('\n🛑 Stopping Bridge Relayer...');
    this.watcher.stop();
    console.log('✅ Relayer stopped');
  }

  /**
   * Handle Zcash deposit event
   */
  private async handleZcashEvent(event: ZcashEvent): Promise<void> {
    if (event.type !== 'deposit') {
      return;
    }

    const { commitment, index, root } = event.data;

    console.log('\n📬 New deposit detected!');
    console.log(`   Commitment: ${commitment.slice(0, 20)}...`);
    console.log(`   Index: ${index}`);
    console.log(`   Root: ${root.slice(0, 20)}...`);

    // Check if already processed
    if (this.processedCommitments.has(commitment)) {
      console.log('⚠️  Already processed, skipping');
      return;
    }

    // Create processing record
    const record: ProcessedCommitment = {
      commitment,
      index,
      zcashRoot: root,
      status: 'pending',
      timestamp: Date.now()
    };
    this.processedCommitments.set(commitment, record);

    // Process the commitment
    await this.processCommitment(commitment);
  }

  /**
   * Process a commitment (fetch proof, generate SNARK, submit)
   */
  private async processCommitment(commitment: string): Promise<void> {
    const record = this.processedCommitments.get(commitment);
    if (!record) return;

    try {
      // Step 1: Fetch Merkle proof from Zcash
      console.log('\n1️⃣ Fetching Merkle proof...');
      const merkleProof = await this.watcher.getMerkleProof(commitment);

      if (!merkleProof) {
        throw new Error('Failed to fetch Merkle proof');
      }

      console.log('✅ Merkle proof received');

      // Step 2: Generate recursive zkSNARK
      console.log('\n2️⃣ Generating recursive zkSNARK...');
      record.status = 'proving';

      const proofResult = await this.prover.generateProof(merkleProof);

      if (!proofResult.success || !proofResult.proof) {
        throw new Error(proofResult.error || 'Proof generation failed');
      }

      console.log(`✅ Proof generated in ${proofResult.duration}ms`);
      record.minaProof = JSON.stringify(proofResult.proof);

      // Step 3: Submit to Mina
      console.log('\n3️⃣ Submitting to Mina zkApp...');
      record.status = 'submitted';

      const amount = 1000000; // 1 ZEC in satoshis (simplified)
      const submitResult = await this.submitter.submitProof(
        proofResult.proof,
        commitment,
        amount
      );

      if (!submitResult.success) {
        throw new Error(submitResult.error || 'Submission failed');
      }

      console.log(`✅ Submitted! Tx: ${submitResult.txHash}`);
      record.txHash = submitResult.txHash;
      record.status = 'confirmed';

      // Update stats
      this.stats.totalProcessed++;
      this.stats.totalSubmitted++;

      console.log('\n🎉 Bridge operation completed successfully!\n');
    } catch (error) {
      console.error('\n❌ Processing failed:', error);
      record.status = 'failed';
      record.error = error instanceof Error ? error.message : 'Unknown error';
      this.stats.totalFailed++;
    }
  }

  /**
   * Print relayer status
   */
  private printStatus(): void {
    this.stats.uptime = Date.now() - this.startTime;

    console.log('\n' + '═'.repeat(50));
    console.log('📊 Relayer Status');
    console.log('═'.repeat(50));
    console.log(`Uptime: ${Math.floor(this.stats.uptime / 1000)}s`);
    console.log(`Processed: ${this.stats.totalProcessed}`);
    console.log(`Submitted: ${this.stats.totalSubmitted}`);
    console.log(`Failed: ${this.stats.totalFailed}`);
    console.log(`Queue: ${this.processedCommitments.size}`);
    console.log('═'.repeat(50) + '\n');
  }

  /**
   * Get relayer statistics
   */
  public getStats(): RelayerStats {
    this.stats.uptime = Date.now() - this.startTime;
    return { ...this.stats };
  }

  /**
   * Get processed commitments
   */
  public getProcessedCommitments(): ProcessedCommitment[] {
    return Array.from(this.processedCommitments.values());
  }
}

/**
 * Main entry point
 */
async function main() {
  // Load configuration
  const config: RelayerConfig = {
    zcashRpcUrl: process.env.ZCASH_RPC_URL || 'http://localhost:3000',
    minaEndpoint: process.env.MINA_ENDPOINT || 'http://localhost:8080',
    pollInterval: parseInt(process.env.POLL_INTERVAL || '5000'),
    batchSize: parseInt(process.env.BATCH_SIZE || '10')
  };

  console.log(`
╔════════════════════════════════════════════╗
║   Bridge Relayer - Zcash ↔ Mina           ║
╚════════════════════════════════════════════╝

Configuration:
  Zcash RPC: ${config.zcashRpcUrl}
  Mina Endpoint: ${config.minaEndpoint}
  Poll Interval: ${config.pollInterval}ms
  Batch Size: ${config.batchSize}

`);

  // Create and start relayer
  const relayer = new BridgeRelayer(config);

  try {
    await relayer.initialize();
    await relayer.start();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }

  // Handle shutdown
  process.on('SIGINT', () => {
    relayer.stop();
    process.exit(0);
  });
}

// Run if called directly
if (import.meta.main) {
  main();
}

export { BridgeRelayer };
export * from './types';

