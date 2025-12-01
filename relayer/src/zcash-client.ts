/**
 * Zcash RPC Client
 * Connects to real Zcash node (testnet or mainnet)
 */

export interface ZcashConfig {
  rpcUrl: string;
  rpcUser: string;
  rpcPassword: string;
  network: 'testnet' | 'mainnet';
}

export interface ZcashCommitment {
  commitment: string;
  txid: string;
  outputIndex: number;
  blockHeight: number;
}

export class ZcashClient {
  private config: ZcashConfig;

  constructor(config: ZcashConfig) {
    this.config = config;
  }

  /**
   * Call Zcash RPC method
   */
  async call(method: string, params: any[] = []): Promise<any> {
    try {
      const response = await fetch(this.config.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(
            `${this.config.rpcUser}:${this.config.rpcPassword}`
          ).toString('base64')
        },
        body: JSON.stringify({
          jsonrpc: '1.0',
          id: 'zcash-mina-bridge',
          method,
          params
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC Error: ${data.error.message}`);
      }

      return data.result;
    } catch (error) {
      console.error(`❌ RPC call failed: ${method}`, error);
      throw error;
    }
  }

  /**
   * Get blockchain info
   */
  async getBlockchainInfo(): Promise<any> {
    return await this.call('getblockchaininfo', []);
  }

  /**
   * Get current block height
   */
  async getBlockCount(): Promise<number> {
    return await this.call('getblockcount', []);
  }

  /**
   * Get block hash by height
   */
  async getBlockHash(height: number): Promise<string> {
    return await this.call('getblockhash', [height]);
  }

  /**
   * Get block by hash
   */
  async getBlock(hash: string, verbosity: number = 2): Promise<any> {
    return await this.call('getblock', [hash, verbosity]);
  }

  /**
   * Get raw transaction
   */
  async getRawTransaction(txid: string, verbose: boolean = true): Promise<any> {
    return await this.call('getrawtransaction', [txid, verbose ? 1 : 0]);
  }

  /**
   * Get Sapling commitment tree info
   */
  async getSaplingTreeInfo(): Promise<any> {
    const info = await this.getBlockchainInfo();
    return {
      root: info.commitments,
      size: info.size_on_disk,
      chainwork: info.chainwork
    };
  }

  /**
   * Extract commitments from a transaction
   */
  extractCommitments(tx: any): ZcashCommitment[] {
    const commitments: ZcashCommitment[] = [];

    // Check for Sapling outputs (vShieldedOutput)
    if (tx.vShieldedOutput && Array.isArray(tx.vShieldedOutput)) {
      tx.vShieldedOutput.forEach((output: any, index: number) => {
        if (output.cmu) {
          commitments.push({
            commitment: output.cmu,
            txid: tx.txid,
            outputIndex: index,
            blockHeight: tx.height || 0
          });
        }
      });
    }

    // Check for Orchard outputs (vShieldedOutput in newer versions)
    if (tx.orchard && tx.orchard.actions) {
      tx.orchard.actions.forEach((action: any, index: number) => {
        if (action.cmx) {
          commitments.push({
            commitment: action.cmx,
            txid: tx.txid,
            outputIndex: index + 1000, // Offset to distinguish from Sapling
            blockHeight: tx.height || 0
          });
        }
      });
    }

    return commitments;
  }

  /**
   * Get commitments from a block
   */
  async getBlockCommitments(blockHeight: number): Promise<ZcashCommitment[]> {
    const blockHash = await this.getBlockHash(blockHeight);
    const block = await this.getBlock(blockHash, 2);

    const allCommitments: ZcashCommitment[] = [];

    for (const tx of block.tx) {
      const commitments = this.extractCommitments(tx);
      allCommitments.push(...commitments);
    }

    return allCommitments;
  }

  /**
   * Watch for new blocks
   */
  async watchBlocks(
    callback: (blockHeight: number, commitments: ZcashCommitment[]) => Promise<void>,
    startHeight?: number
  ): Promise<void> {
    let lastHeight = startHeight || await this.getBlockCount();
    
    console.log(`👀 Watching Zcash ${this.config.network} from block ${lastHeight}`);

    const poll = async () => {
      try {
        const currentHeight = await this.getBlockCount();
        
        if (currentHeight > lastHeight) {
          console.log(`📦 New block detected: ${currentHeight}`);
          
          // Process all new blocks
          for (let height = lastHeight + 1; height <= currentHeight; height++) {
            const commitments = await this.getBlockCommitments(height);
            
            if (commitments.length > 0) {
              console.log(`🔐 Found ${commitments.length} commitment(s) in block ${height}`);
              await callback(height, commitments);
            }
          }
          
          lastHeight = currentHeight;
        }
      } catch (error) {
        console.error('❌ Error watching blocks:', error);
      }
    };

    // Poll every minute
    setInterval(poll, 60000);
    
    // Initial poll
    await poll();
  }

  /**
   * Get Merkle proof for a commitment (if supported by node)
   */
  async getMerkleProof(commitment: string): Promise<any> {
    try {
      // Note: This requires a custom RPC method or external service
      // Standard Zcash RPC doesn't provide this directly
      return await this.call('z_getmerkleproof', [commitment]);
    } catch (error) {
      console.warn('⚠️  z_getmerkleproof not available, using fallback');
      // Fallback: Would need to reconstruct from block data
      throw new Error('Merkle proof generation not supported by this node');
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const info = await this.getBlockchainInfo();
      return info.blocks > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get network info
   */
  async getNetworkInfo(): Promise<string> {
    const info = await this.getBlockchainInfo();
    return info.chain; // 'main', 'test', or 'regtest'
  }
}

/**
 * Create Zcash client from environment variables
 */
export function createZcashClient(): ZcashClient {
  const config: ZcashConfig = {
    rpcUrl: process.env.ZCASH_RPC_URL || 'http://localhost:18232',
    rpcUser: process.env.ZCASH_RPC_USER || 'zcashbridge',
    rpcPassword: process.env.ZCASH_RPC_PASSWORD || '',
    network: (process.env.ZCASH_NETWORK as 'testnet' | 'mainnet') || 'testnet'
  };

  return new ZcashClient(config);
}

