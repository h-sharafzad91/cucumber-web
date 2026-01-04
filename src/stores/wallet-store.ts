import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;

  setWallet: (address: string | null, chainId: number | null) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      isConnected: false,
      chainId: null,

      setWallet: (address, chainId) =>
        set({
          address,
          isConnected: !!address,
          chainId,
        }),

      disconnect: () =>
        set({
          address: null,
          isConnected: false,
          chainId: null,
        }),
    }),
    {
      name: "cucumber-wallet",
      partialize: (state) => ({ address: state.address }),
    }
  )
);
