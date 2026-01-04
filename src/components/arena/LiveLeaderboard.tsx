'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWebSocket, type LeaderboardUpdate } from '@/hooks/useWebSocket';
import { getLeaderboard } from '@/lib/api';

interface LeaderboardEntry {
  agent_id: string;
  agent_name: string;
  total_pnl: number;
  rank: number;
  current_balance?: number;
  total_trades?: number;
  effective_tick_interval?: number;
}

interface LiveLeaderboardProps {
  roundId: string;
}

function formatTickInterval(seconds: number): string {
  if (seconds >= 3600) {
    const hours = seconds / 3600;
    return hours === 1 ? '1h' : `${hours}h`;
  }
  if (seconds >= 60) {
    const mins = seconds / 60;
    return mins === 1 ? '1m' : `${mins}m`;
  }
  return `${seconds}s`;
}

export function LiveLeaderboard({ roundId }: LiveLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInitial() {
      try {
        const { leaderboard: data } = await getLeaderboard(roundId);
        setLeaderboard(data);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchInitial();
  }, [roundId]);

  const handleLeaderboardUpdate = useCallback((data: LeaderboardUpdate) => {
    if (data.rankings) {
      setLeaderboard(data.rankings);
    }
  }, []);

  const { isConnected } = useWebSocket({
    roundId,
    onLeaderboard: handleLeaderboardUpdate,
  });

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-gray-400">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold">Live Leaderboard</h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-gray-500'
            }`}
          />
          <span className="text-xs text-gray-400">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-750">
            <tr>
              <th className="text-left px-4 py-3 text-sm text-gray-400">Rank</th>
              <th className="text-left px-4 py-3 text-sm text-gray-400">Agent</th>
              <th className="text-right px-4 py-3 text-sm text-gray-400">P&L</th>
              <th className="text-right px-4 py-3 text-sm text-gray-400">Balance</th>
              <th className="text-right px-4 py-3 text-sm text-gray-400">Tick</th>
              <th className="text-right px-4 py-3 text-sm text-gray-400">Trades</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr
                key={entry.agent_id}
                className="border-t border-gray-700 hover:bg-gray-750 transition"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {index === 0 && <span className="text-xl">🥇</span>}
                    {index === 1 && <span className="text-xl">🥈</span>}
                    {index === 2 && <span className="text-xl">🥉</span>}
                    <span className="font-medium">#{entry.rank || index + 1}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{entry.agent_name}</td>
                <td
                  className={`px-4 py-3 text-right font-semibold ${
                    entry.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {entry.total_pnl >= 0 ? '+' : ''}
                  ${entry.total_pnl.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">
                  ${entry.current_balance?.toFixed(2) || '0.00'}
                </td>
                <td className="px-4 py-3 text-right text-gray-400">
                  {entry.effective_tick_interval ? formatTickInterval(entry.effective_tick_interval) : '--'}
                </td>
                <td className="px-4 py-3 text-right text-gray-400">
                  {entry.total_trades}
                </td>
              </tr>
            ))}
            {leaderboard.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No participants yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
