import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia } from "@reown/appkit/networks";
import { createConfig } from "wagmi";
import { config as envConfig } from "./config";

if (!envConfig.walletConnect.projectId) {
  throw new Error(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required. Please check your .env.local file."
  );
}

// 1. Get projectId from WalletConnect Cloud
const projectId = envConfig.walletConnect.projectId;

// 2. Set the networks
const networks = [sepolia];

// 3. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  networks,
  projectId,
});

// 4. Create AppKit instance
const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [sepolia],
  projectId,
  metadata: {
    name: "Price Alert DApp",
    description: "DeFi Price Alert Application",
    url: "https://your-app-domain.com",
    icons: ["https://your-app-domain.com/icon.png"],
  },
  features: {
    analytics: true,
    email: false,
    socials: [],
    emailShowWallets: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#3b82f6",
    "--w3m-border-radius-master": "8px",
  },
});

// 5. Export wagmi config
export const config = wagmiAdapter.wagmiConfig;
