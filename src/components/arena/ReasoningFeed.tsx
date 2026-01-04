"use client";

import { cn } from "@/lib/utils";
import type { ReasoningEvent } from "@/types";

interface ReasoningFeedProps {
  reasonings: ReasoningEvent[];
}

export function ReasoningFeed({ reasonings }: ReasoningFeedProps) {
  if (reasonings.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
        Waiting for agent reasoning...
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto">
      {reasonings.map((r, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{r.agent_name || r.agent_id.slice(0, 8)}</span>
            <span
              className={cn(
                "text-xs px-2 py-1 rounded",
                r.action === "BUY_MARKET"
                  ? "bg-green-900 text-green-300"
                  : r.action === "SELL_MARKET"
                  ? "bg-red-900 text-red-300"
                  : "bg-gray-700 text-gray-300"
              )}
            >
              {r.action}
            </span>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed">{r.reasoning}</p>

          {r.asset && (r.size_usd || r.size_asset) && (
            <div className="mt-2 text-xs text-gray-500">
              {r.action === "SELL_MARKET" && r.size_asset
                ? `${r.asset} • ${r.size_asset.toFixed(4)} ${r.asset}`
                : r.size_usd
                ? `${r.asset} • $${r.size_usd.toFixed(2)}`
                : null}
              {r.action === "SELL_MARKET" && r.size_usd && (
                <span className="ml-1">(≈ ${r.size_usd.toFixed(2)})</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
