import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import { config as envConfig } from "./config";

if (!envConfig.walletConnect.projectId) {
  throw new Error(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required. Please check your .env.local file."
  );
}

export const config = getDefaultConfig({
  appName: "Price Alert DApp",
  projectId: envConfig.walletConnect.projectId,
  chains: [sepolia],
  ssr: true,
  batch: {
    multicall: true,
  },
});
