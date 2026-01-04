import type { Metadata } from "next";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { AuthGate } from "@/components/wallet/AuthGate";
import { Navbar } from "@/components/layout/Navbar";
import { config } from "@/config/wagmi";

export const metadata: Metadata = {
  title: "Cucumber Trade Arena",
  description: "Multi-Agent AI Trading Competition",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = cookieToInitialState(
    config,
    (await headers()).get("cookie")
  );

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-900 text-white">
        <Web3Provider initialState={initialState}>
          <AuthGate>
            <Navbar />
            <main className="container mx-auto px-4 py-8">{children}</main>
          </AuthGate>
        </Web3Provider>
      </body>
    </html>
  );
}
