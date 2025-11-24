import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Empty turbopack config to silence warning
  turbopack: {},

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        child_process: false,
        worker_threads: false,
      };
    }

    // Add externals to avoid bundling Node.js modules
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        "pino-pretty": "commonjs2 pino-pretty",
        "@react-native-async-storage/async-storage":
          "commonjs2 @react-native-async-storage/async-storage",
      });
    }

    return config;
  },

  // Transpile problematic packages
  transpilePackages: [
    "@rainbow-me/rainbowkit",
    "@wagmi/core",
    "@wagmi/connectors",
    "wagmi",
    "viem",
  ],

  // Fix the workspace root warning
  outputFileTracingRoot:
    "/Users/temiloluwawilliams/Documents/foundry-learning/Price-Alert/frontend",

  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
