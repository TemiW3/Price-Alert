"use client";

import { useAppKit } from "@reown/appkit/react";
import { useAccount, useChainId, useDisconnect } from "wagmi";
import { sepolia } from "wagmi/chains";
import "../app/globals.css";

export function WalletConnect() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();

  const isWrongNetwork = chainId !== sepolia.id;

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="wallet-connect">
        <button onClick={() => open()} type="button" className="buttonGradient">
          Connect Wallet
        </button>
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="wallet-connect">
        <button
          onClick={() => open({ view: "Networks" })}
          type="button"
          className="buttonDanger"
        >
          Wrong Network - Switch to Sepolia
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <div className="flex items-center gap-3">
        <button
          onClick={() => open({ view: "Networks" })}
          className="chain-button"
          type="button"
        >
          <div className="w-4 h-4">
            <img
              alt="Sepolia"
              src="https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg"
              className="w-4 h-4 rounded-full"
            />
          </div>
          Sepolia
        </button>

        <button
          onClick={() => open({ view: "Account" })}
          type="button"
          className="account-button"
        >
          {formatAddress(address!)}
        </button>
      </div>
    </div>
  );
}

// Simple version for quick testing
export function SimpleWalletConnect() {
  const { open } = useAppKit();
  const { isConnected } = useAccount();

  return (
    <div className="wallet-connect">
      <w3m-button />
    </div>
  );
}

// Custom Reown Button Component
export function ReownConnectButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  return (
    <div className="wallet-connect">
      {!isConnected ? (
        <button onClick={() => open()} className="buttonGradient">
          Connect with Reown
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <button
            onClick={() => open({ view: "Account" })}
            className="buttonInfo"
          >
            Account
          </button>
        </div>
      )}
    </div>
  );
}
