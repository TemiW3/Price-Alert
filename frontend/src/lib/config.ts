// Environment configuration
export const config = {
  // WalletConnect
  walletConnect: {
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  },

  // Smart Contracts
  contracts: {
    priceAlert: process.env.NEXT_PUBLIC_PRICE_ALERT_CONTRACT_ADDRESS,
    tellorOracle: process.env.NEXT_PUBLIC_TELLOR_ORACLE_ADDRESS,
  },

  // Network
  network: {
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111"),
    name: process.env.NEXT_PUBLIC_NETWORK_NAME || "sepolia",
  },
} as const;

// Validation
export function validateConfig() {
  const errors: string[] = [];

  if (!config.walletConnect.projectId) {
    errors.push("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required");
  }

  if (!config.contracts.priceAlert) {
    errors.push("NEXT_PUBLIC_PRICE_ALERT_CONTRACT_ADDRESS is required");
  }

  if (!config.contracts.tellorOracle) {
    errors.push("NEXT_PUBLIC_TELLOR_ORACLE_ADDRESS is required");
  }

  if (errors.length > 0) {
    throw new Error(`Environment configuration errors:\n${errors.join("\n")}`);
  }
}

// Validate on import
if (typeof window !== "undefined") {
  validateConfig();
}
