"use client";

import { useWallet } from "@/hooks/useWallet";
import { shortenAddress, cn } from "@/lib/utils";

interface ConnectButtonProps {
  className?: string;
}

export function ConnectButton({ className }: ConnectButtonProps) {
  const {
    address,
    isConnected,
    isConnecting,
    isWrongNetwork,
    connect,
    disconnect,
    switchToBaseSepolia,
  } = useWallet();

  if (isConnecting) {
    return (
      <button
        disabled
        className={cn(
          "bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed",
          className
        )}
      >
        Connecting...
      </button>
    );
  }

  if (isWrongNetwork) {
    return (
      <button
        onClick={switchToBaseSepolia}
        className={cn(
          "bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm font-medium transition",
          className
        )}
      >
        Switch to Base Sepolia
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400 hidden sm:block">
          Base Sepolia
        </span>
        <button
          onClick={disconnect}
          className={cn(
            "bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition group",
            className
          )}
        >
          <span className="group-hover:hidden">{shortenAddress(address)}</span>
          <span className="hidden group-hover:inline text-red-400">
            Disconnect
          </span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className={cn(
        "bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg text-sm font-medium transition",
        className
      )}
    >
      Connect Wallet
    </button>
  );
}
