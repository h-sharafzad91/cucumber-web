"use client";

import { ReactNode, useEffect, useState } from "react";
import { createAppKit } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, type State } from "wagmi";
import { wagmiAdapter, projectId, metadata, chains } from "@/config/wagmi";
import { baseSepolia } from "wagmi/chains";

const queryClient = new QueryClient();

createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId!,
  networks: chains,
  defaultNetwork: baseSepolia,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-color-mix": "#16a34a",
    "--w3m-color-mix-strength": 20,
    "--w3m-accent": "#22c55e",
    "--w3m-border-radius-master": "8px",
  },
});

interface Web3ProviderProps {
  children: ReactNode;
  initialState?: State;
}

export function Web3Provider({ children, initialState }: Web3ProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>
        {mounted && children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
