# Environment Variables Security

This document outlines the environment variables used in the Price Alert DApp and security best practices.

## Required Environment Variables

### Frontend (.env.local)

```bash
# WalletConnect Project ID (get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Smart Contract Addresses
NEXT_PUBLIC_PRICE_ALERT_CONTRACT_ADDRESS=0x3e0a4cb9b4117913999e4e65a8adcd5d29785838
NEXT_PUBLIC_TELLOR_ORACLE_ADDRESS=0xB19584Be015c04cf6CFBF6370Fe94a58b7A38830

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_NETWORK_NAME=sepolia
```

## Security Notes

1. **Never commit .env.local** - This file contains your actual project IDs and is gitignored
2. **Use .env.example** - Template file for new developers
3. **NEXT*PUBLIC*** prefix - Required for client-side environment variables in Next.js
4. **Contract addresses** - While public on blockchain, keeping them in env files makes deployment easier

## Getting Your WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up/Login
3. Create a new project
4. Copy the Project ID
5. Add it to your `.env.local` file

## Validation

The app automatically validates all required environment variables on startup and will throw clear error messages if any are missing.
