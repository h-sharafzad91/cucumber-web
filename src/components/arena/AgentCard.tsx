"use client";

import { useEffect, useState } from "react";
import { getAgent, getPositions } from "@/lib/api";
import { formatUSD, formatPnL } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Agent } from "@/types";

interface Position {
  asset: string;
  size: number;
  avg_entry_price: number;
}

interface AgentCardProps {
  agentId: string;
  agentName?: string;
  roundId: string;
  initialBalance: number;
  balance: number;
  pnl: number;
  realizedPnl?: number;
  unrealizedPnl?: number;
  trades: number;
  currentPrice: number;
}

export function AgentCard({
  agentId,
  agentName,
  roundId,
  initialBalance,
  balance,
  pnl,
  realizedPnl,
  unrealizedPnl,
  trades,
  currentPrice
}: AgentCardProps) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);

  const ethPosition = positions.find(p => p.asset === 'ETH');
  const ethValue = ethPosition ? ethPosition.size * currentPrice : 0;
  const totalPortfolioValue = balance + ethValue;

  const calculatedUnrealizedPnl = ethPosition && ethPosition.avg_entry_price
    ? (currentPrice - ethPosition.avg_entry_price) * ethPosition.size
    : 0;

  const displayUnrealizedPnl = unrealizedPnl !== undefined && unrealizedPnl !== null
    ? unrealizedPnl
    : calculatedUnrealizedPnl;

  const displayRealizedPnl = realizedPnl !== undefined && realizedPnl !== null
    ? realizedPnl
    : 0;

  const returnPercent = initialBalance > 0 && displayRealizedPnl ? ((displayRealizedPnl / initialBalance) * 100) : 0;

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentRes, positionsRes] = await Promise.all([
          getAgent(agentId),
          getPositions(roundId, agentId),
        ]);
        setAgent(agentRes.agent);
        setPositions(positionsRes.positions || []);
      } catch (err) {
        console.error("Failed to fetch agent data:", err);
      }
    }
    fetchData();

    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [agentId, roundId, trades]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium truncate">
          {agentName || agent?.name || agentId.slice(0, 8)}
        </h3>
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded",
            agent?.persona_config.risk_tolerance === "aggressive"
              ? "bg-red-900/50 text-red-300"
              : agent?.persona_config.risk_tolerance === "moderate"
              ? "bg-yellow-900/50 text-yellow-300"
              : "bg-green-900/50 text-green-300"
          )}
        >
          {agent?.persona_config.risk_tolerance || "-"}
        </span>
      </div>

      <div className="bg-gray-700/50 rounded p-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Portfolio Value</span>
          <span className="font-bold text-lg">{formatUSD(totalPortfolioValue)}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span
            className={cn(
              "text-sm font-medium",
              returnPercent >= 0 ? "text-green-400" : "text-red-400"
            )}
          >
            {returnPercent >= 0 ? "+" : ""}{returnPercent.toFixed(2)}%
          </span>
          <span className="text-gray-500 text-xs">from {formatUSD(initialBalance)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-400">USD</span>
          <p className="font-medium">{formatUSD(balance)}</p>
        </div>
        <div>
          <span className="text-gray-400">ETH</span>
          <p className="font-medium">
            {ethPosition ? `${ethPosition.size.toFixed(4)} ETH` : "0 ETH"}
          </p>
          {ethValue > 0 && (
            <p className="text-xs text-gray-500">≈ {formatUSD(ethValue)}</p>
          )}
        </div>
      </div>

      <div className="bg-gray-700/50 rounded p-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 font-medium">P&L (Realized)</span>
          <span className={cn("font-bold text-base", displayRealizedPnl >= 0 ? "text-green-400" : "text-red-400")}>
            {displayRealizedPnl >= 0 ? "+" : ""}{formatUSD(displayRealizedPnl)}
          </span>
        </div>
      </div>

      {Math.abs(displayUnrealizedPnl) > 0.01 && (
        <div className="bg-gray-700/50 rounded p-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-medium">Unrealized P&L</span>
            <span className={cn("font-bold text-base", displayUnrealizedPnl >= 0 ? "text-green-400" : "text-red-400")}>
              {displayUnrealizedPnl >= 0 ? "+" : ""}{formatUSD(displayUnrealizedPnl)}
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-gray-700">
        <span>{trades} trades</span>
        <span className="capitalize">{agent?.persona_config.strategy?.replace("_", " ") || "-"}</span>
      </div>
    </div>
  );
}
