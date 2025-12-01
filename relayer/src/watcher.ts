/**
 * Zcash Event Watcher
 * Monitors Zcash simulator for new deposits
 */

import type { ZcashEvent, MerkleProof } from './types';

export class ZcashWatcher {
  private zcashRpcUrl: string;
  private pollInterval: number;
  private lastEventTimestamp: number;
  private isRunning: boolean;
  private eventHandlers: Array<(event: ZcashEvent) => void>;

  constructor(zcashRpcUrl: string, pollInterval: number = 5000) {
    this.zcashRpcUrl = zcashRpcUrl;
    this.pollInterval = pollInterval;
    this.lastEventTimestamp = 0;
    this.isRunning = false;
    this.eventHandlers = [];
  }

  /**
   * Register event handler
   */
  public onEvent(handler: (event: ZcashEvent) => void): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Start watching for events
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Watcher already running');
      return;
    }

    this.isRunning = true;
    console.log(`👀 Watching Zcash at ${this.zcashRpcUrl}`);
    console.log(`📊 Poll interval: ${this.pollInterval}ms`);

    // Start polling loop
    this.poll();
  }

  /**
   * Stop watching
   */
  public stop(): void {
    this.isRunning = false;
    console.log('🛑 Watcher stopped');
  }

  /**
   * Poll for new events
   */
  private async poll(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.checkForNewEvents();
      } catch (error) {
        console.error('❌ Error polling events:', error);
      }

      // Wait before next poll
      await this.sleep(this.pollInterval);
    }
  }

  /**
   * Check for new events since last timestamp
   */
  private async checkForNewEvents(): Promise<void> {
    try {
      const url = `${this.zcashRpcUrl}/events?since=${this.lastEventTimestamp}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const events: ZcashEvent[] = data.events || [];

      if (events.length > 0) {
        console.log(`📬 Received ${events.length} new event(s)`);

        for (const event of events) {
          // Update last timestamp
          if (event.timestamp > this.lastEventTimestamp) {
            this.lastEventTimestamp = event.timestamp;
          }

          // Notify handlers
          this.notifyHandlers(event);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching events:', error);
    }
  }

  /**
   * Notify all registered handlers
   */
  private notifyHandlers(event: ZcashEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('❌ Error in event handler:', error);
      }
    }
  }

  /**
   * Fetch Merkle proof for a commitment
   */
  public async getMerkleProof(commitment: string): Promise<MerkleProof | null> {
    try {
      const url = `${this.zcashRpcUrl}/merkle-proof/${commitment}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.proof) {
        console.error('❌ Failed to get proof:', data.error);
        return null;
      }

      return data.proof;
    } catch (error) {
      console.error('❌ Error fetching proof:', error);
      return null;
    }
  }

  /**
   * Get current Zcash tree root
   */
  public async getCurrentRoot(): Promise<string | null> {
    try {
      const url = `${this.zcashRpcUrl}/tree-root`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.root;
    } catch (error) {
      console.error('❌ Error fetching root:', error);
      return null;
    }
  }

  /**
   * Get tree info
   */
  public async getTreeInfo(): Promise<any> {
    try {
      const url = `${this.zcashRpcUrl}/tree-info`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error fetching tree info:', error);
      return null;
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.zcashRpcUrl}/health`;
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get watcher status
   */
  public getStatus() {
    return {
      isRunning: this.isRunning,
      lastEventTimestamp: this.lastEventTimestamp,
      zcashRpcUrl: this.zcashRpcUrl,
      pollInterval: this.pollInterval
    };
  }
}

