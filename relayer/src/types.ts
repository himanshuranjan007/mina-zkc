/**
 * Type definitions for relayer service
 */

export interface RelayerConfig {
  zcashRpcUrl: string;
  minaEndpoint: string;
  pollInterval: number;
  batchSize: number;
}

export interface ZcashEvent {
  type: string;
  data: {
    commitment: string;
    index: number;
    root: string;
  };
  timestamp: number;
}

export interface MerkleProof {
  leaf: string;
  index: number;
  path: string[];
  root: string;
}

export interface ProcessedCommitment {
  commitment: string;
  index: number;
  zcashRoot: string;
  minaProof?: string;
  status: 'pending' | 'proving' | 'submitted' | 'confirmed' | 'failed';
  timestamp: number;
  txHash?: string;
  error?: string;
}

export interface RelayerStats {
  totalProcessed: number;
  totalSubmitted: number;
  totalFailed: number;
  lastProcessedBlock: number;
  uptime: number;
}

export interface ProofGenerationResult {
  success: boolean;
  proof?: any;
  error?: string;
  duration: number;
}

export interface SubmissionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

