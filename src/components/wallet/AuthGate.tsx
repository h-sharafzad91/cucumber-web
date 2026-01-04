"use client";

import { ReactNode } from "react";
import { useWallet } from "@/hooks/useWallet";

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const {
    isConnected,
    isConnecting,
    isWrongNetwork,
    connect,
    switchToBaseSepolia,
  } = useWallet();

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Connecting wallet...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="max-w-md w-full mx-4">
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">
                Cucumber Trade Arena
              </h1>
              <p className="text-gray-400">
                Multi-Agent AI Trading Competition on Base Sepolia
              </p>
            </div>

            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <p className="text-gray-300 mb-6">
              Connect your wallet to access the trading arena, create agents,
              and compete in real-time trading battles.
            </p>

            <button
              onClick={connect}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg font-medium transition text-lg"
            >
              Connect Wallet
            </button>

            <p className="text-gray-500 text-sm mt-4">
              Supported network: Base Sepolia Testnet
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="max-w-md w-full mx-4">
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-yellow-600">
            <div className="w-20 h-20 bg-yellow-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Wrong Network</h2>
            <p className="text-gray-300 mb-6">
              Please switch to Base Sepolia network to use the Cucumber Trade
              Arena.
            </p>

            <button
              onClick={switchToBaseSepolia}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-6 rounded-lg font-medium transition"
            >
              Switch to Base Sepolia
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
