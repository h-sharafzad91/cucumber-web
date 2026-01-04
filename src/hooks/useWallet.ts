"use client";

import { useEffect } from "react";
import { useAccount, useChainId, useDisconnect } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { useWalletStore } from "@/stores/wallet-store";
import { baseSepolia } from "wagmi/chains";

export function useWallet() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const chainId = useChainId();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { open } = useAppKit();
  const { setWallet, disconnect: storeDisconnect } = useWalletStore();

  useEffect(() => {
    if (isConnected && address) {
      setWallet(address, chainId);
    } else if (!isConnected && !isConnecting && !isReconnecting) {
      storeDisconnect();
    }
  }, [
    isConnected,
    address,
    chainId,
    isConnecting,
    isReconnecting,
    setWallet,
    storeDisconnect,
  ]);

  const connect = () => {
    open();
  };

  const disconnect = () => {
    wagmiDisconnect();
    storeDisconnect();
  };

  const switchToBaseSepolia = () => {
    open({ view: "Networks" });
  };

  const isWrongNetwork = isConnected && chainId !== baseSepolia.id;

  return {
    address,
    isConnected,
    isConnecting: isConnecting || isReconnecting,
    chainId,
    isWrongNetwork,
    connect,
    disconnect,
    switchToBaseSepolia,
  };
}
