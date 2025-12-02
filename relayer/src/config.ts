/**
 * Relayer Configuration
 * Supports both testnet and mainnet modes
 */

export interface RelayerConfig {
  // Zcash Configuration
  zcash: {
    rpcUrl: string;
    rpcUser: string;
    rpcPassword: string;
    network: 'testnet' | 'mainnet';
  };

  // Mina Configuration
  mina: {
    endpoint: string;
    archive: string;
    network: 'berkeley' | 'mainnet';
    zkAppAddress: string;
    deployerKey: string;
  };

  // Safety Limits (especially important for mainnet!)
  limits: {
    maxAmountPerTx: number;      // Max MINA per single transaction
    dailyLimit: number;          // Max MINA per day
    requireConfirmation: boolean; // Require manual confirmation
    minConfirmations: number;    // Min Zcash confirmations
  };

  // Relayer Settings
  relayer: {
    pollInterval: number;
    batchSize: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): RelayerConfig {
  const minaNetwork = process.env.MINA_NETWORK || 'berkeley';
  const zcashNetwork = process.env.ZCASH_NETWORK || 'testnet';

  // Warn if using mainnet
  if (minaNetwork === 'mainnet') {
    console.log('');
    console.log('⚠️ '.repeat(20));
    console.log('');
    console.log('   🚨 MAINNET MODE ENABLED 🚨');
    console.log('   Real MINA will be used!');
    console.log('');
    console.log('⚠️ '.repeat(20));
    console.log('');
  }

  const config: RelayerConfig = {
    zcash: {
      rpcUrl: process.env.ZCASH_RPC_URL || 'http://localhost:18232',
      rpcUser: process.env.ZCASH_RPC_USER || 'zcashbridge',
      rpcPassword: process.env.ZCASH_RPC_PASSWORD || '',
      network: zcashNetwork as 'testnet' | 'mainnet'
    },

    mina: {
      endpoint: process.env.MINA_ENDPOINT || getMinaEndpoint(minaNetwork),
      archive: process.env.MINA_ARCHIVE || getMinaArchive(minaNetwork),
      network: minaNetwork as 'berkeley' | 'mainnet',
      zkAppAddress: process.env.ZKAPP_ADDRESS || '',
      deployerKey: process.env.DEPLOYER_KEY || ''
    },

    limits: {
      // Default: Very conservative for mainnet
      maxAmountPerTx: parseFloat(process.env.MAX_AMOUNT_PER_TX || '1') * 1e9, // 1 MINA
      dailyLimit: parseFloat(process.env.DAILY_LIMIT || '10') * 1e9, // 10 MINA
      requireConfirmation: process.env.REQUIRE_CONFIRMATION === 'true',
      minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || '6')
    },

    relayer: {
      pollInterval: parseInt(process.env.POLL_INTERVAL || '60000'),
      batchSize: parseInt(process.env.BATCH_SIZE || '10'),
      logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error'
    }
  };

  // Validate mainnet config
  if (minaNetwork === 'mainnet') {
    validateMainnetConfig(config);
  }

  return config;
}

function getMinaEndpoint(network: string): string {
  if (network === 'mainnet') {
    return 'https://api.minascan.io/node/mainnet/v1/graphql';
  }
  return 'https://api.minascan.io/node/berkeley/v1/graphql';
}

function getMinaArchive(network: string): string {
  if (network === 'mainnet') {
    return 'https://api.minascan.io/archive/mainnet/v1/graphql';
  }
  return 'https://api.minascan.io/archive/berkeley/v1/graphql';
}

function validateMainnetConfig(config: RelayerConfig): void {
  const errors: string[] = [];

  if (!config.mina.zkAppAddress) {
    errors.push('ZKAPP_ADDRESS is required for mainnet');
  }

  if (!config.mina.deployerKey) {
    errors.push('DEPLOYER_KEY is required for mainnet');
  }

  if (config.limits.maxAmountPerTx > 100e9) {
    console.warn('⚠️  Warning: MAX_AMOUNT_PER_TX is very high (>100 MINA)');
  }

  if (config.limits.dailyLimit > 1000e9) {
    console.warn('⚠️  Warning: DAILY_LIMIT is very high (>1000 MINA)');
  }

  if (errors.length > 0) {
    console.error('❌ Mainnet configuration errors:');
    errors.forEach(e => console.error('   • ' + e));
    process.exit(1);
  }
}

/**
 * Print configuration summary
 */
export function printConfig(config: RelayerConfig): void {
  console.log('');
  console.log('Configuration:');
  console.log('═'.repeat(50));
  console.log('');
  console.log('Zcash:');
  console.log(`  Network:    ${config.zcash.network.toUpperCase()}`);
  console.log(`  RPC:        ${config.zcash.rpcUrl}`);
  console.log('');
  console.log('Mina:');
  console.log(`  Network:    ${config.mina.network.toUpperCase()}`);
  console.log(`  Endpoint:   ${config.mina.endpoint}`);
  console.log(`  zkApp:      ${config.mina.zkAppAddress || '(not set)'}`);
  console.log('');
  console.log('Safety Limits:');
  console.log(`  Max per tx: ${config.limits.maxAmountPerTx / 1e9} MINA`);
  console.log(`  Daily:      ${config.limits.dailyLimit / 1e9} MINA`);
  console.log(`  Confirm:    ${config.limits.requireConfirmation ? 'Yes' : 'No'}`);
  console.log('');
  console.log('═'.repeat(50));
  console.log('');
}

