"use client";

import { formatUSD, shortenTxHash } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Trade } from "@/types";

interface TradeHistoryProps {
  trades: Trade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  if (trades.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400 text-sm">
        No trades yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trades.map((trade, index) => (
        <div
          key={trade.id || `trade-${index}`}
          className="bg-gray-800 rounded-lg p-3 text-sm"
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={cn(
                "font-medium",
                trade.action === "BUY_MARKET"
                  ? "text-green-400"
                  : trade.action === "SELL_MARKET"
                  ? "text-red-400"
                  : "text-gray-400"
              )}
            >
              {trade.action === "BUY_MARKET"
                ? "BUY"
                : trade.action === "SELL_MARKET"
                ? "SELL"
                : "HOLD"}
            </span>
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded",
                trade.status === "confirmed"
                  ? "bg-green-900/50 text-green-300"
                  : trade.status === "failed"
                  ? "bg-red-900/50 text-red-300"
                  : "bg-yellow-900/50 text-yellow-300"
              )}
            >
              {trade.status}
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-400">
            <span>
              {trade.asset} • {trade.action === "SELL_MARKET"
                ? `${trade.size_asset?.toFixed(4) || 0} ${trade.asset}`
                : formatUSD(trade.size_usd)}
            </span>
            <span>@ {formatUSD(trade.execution_price)}</span>
          </div>

          <div className="text-xs text-gray-500 mt-1">
            {trade.action === "SELL_MARKET"
              ? `≈ ${formatUSD(trade.size_usd)}`
              : trade.size_asset ? `${trade.size_asset.toFixed(4)} ${trade.asset}` : null}
          </div>

          {trade.tx_hash && (
            <div className="mt-1 text-xs text-gray-500">
              tx: {shortenTxHash(trade.tx_hash)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
