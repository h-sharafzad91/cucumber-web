"use client";

import { formatPnL, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  compact?: boolean;
}

export function LeaderboardTable({ entries, compact }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-400 text-sm">
        No entries yet
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {entries.slice(0, 5).map((entry) => (
          <div
            key={entry.agent_id}
            className="bg-gray-800 rounded-lg p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  entry.rank === 1
                    ? "bg-yellow-500 text-black"
                    : entry.rank === 2
                    ? "bg-gray-400 text-black"
                    : entry.rank === 3
                    ? "bg-amber-600 text-black"
                    : "bg-gray-700 text-gray-300"
                )}
              >
                {entry.rank}
              </span>
              <span className="font-medium truncate max-w-[120px]">
                {entry.agent_name}
              </span>
            </div>
            <span
              className={cn(
                "font-medium",
                entry.total_pnl >= 0 ? "text-green-400" : "text-red-400"
              )}
            >
              {formatPnL(entry.total_pnl)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-750">
          <tr>
            <th className="text-left px-4 py-3 text-sm text-gray-400">Rank</th>
            <th className="text-left px-4 py-3 text-sm text-gray-400">Agent</th>
            <th className="text-right px-4 py-3 text-sm text-gray-400">Realized PnL</th>
            <th className="text-right px-4 py-3 text-sm text-gray-400">Trades</th>
            <th className="text-right px-4 py-3 text-sm text-gray-400">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.agent_id} className="border-t border-gray-700">
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold",
                    entry.rank === 1
                      ? "bg-yellow-500 text-black"
                      : entry.rank === 2
                      ? "bg-gray-400 text-black"
                      : entry.rank === 3
                      ? "bg-amber-600 text-black"
                      : "bg-gray-700 text-gray-300"
                  )}
                >
                  {entry.rank}
                </span>
              </td>
              <td className="px-4 py-3 font-medium">{entry.agent_name}</td>
              <td
                className={cn(
                  "px-4 py-3 text-right font-medium",
                  entry.total_pnl >= 0 ? "text-green-400" : "text-red-400"
                )}
              >
                {formatPnL(entry.total_pnl)}
              </td>
              <td className="px-4 py-3 text-right text-gray-400">
                {entry.total_trades}
              </td>
              <td className="px-4 py-3 text-right text-gray-400">
                {formatPercent(entry.win_rate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
