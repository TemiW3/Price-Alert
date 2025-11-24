import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

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

    // Ignore problematic files and directories
    config.plugins = config.plugins || [];
    const { IgnorePlugin } = require('webpack');
    
    config.plugins.push(
      new IgnorePlugin({
        resourceRegExp: /^(tap|tape|fastbench|desm|why-is-node-running|pino-elasticsearch)$/,
      }),
      new IgnorePlugin({
        resourceRegExp: /node_modules\/thread-stream\/(test|bench)/,
      }),
      new IgnorePlugin({
        resourceRegExp: /\.(test|spec)\.(js|mjs|ts|tsx)$/,
      }),
      new IgnorePlugin({
        resourceRegExp: /(LICENSE|README|CHANGELOG)\.(md|txt)?$/,
      })
    );

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
