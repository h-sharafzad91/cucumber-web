import { cookieStorage, createStorage, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { AppKitNetwork } from "@reown/appkit/networks";

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_REOWN_PROJECT_ID is not set");
}

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL || "https://cucumber.trade";
};

export const metadata = {
  name: "Cucumber Trade Arena",
  description: "Multi-Agent AI Trading Competition on Base Sepolia",
  url: getBaseUrl(),
  icons: ["/favicon.ico"],
};

export const chains: [AppKitNetwork, ...AppKitNetwork[]] = [baseSepolia];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks: chains,
  transports: {
    [baseSepolia.id]: http("https://sepolia.base.org"),
  },
});

export const config = wagmiAdapter.wagmiConfig;
