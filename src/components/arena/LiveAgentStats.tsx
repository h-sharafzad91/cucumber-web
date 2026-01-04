'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useWebSocket, type LeaderboardUpdate } from '@/hooks/useWebSocket';
import { getAgentActiveRound, getLeaderboard, getAgentReasoning, type AgentActiveRound } from '@/lib/api';

interface LiveAgentStatsProps {
  agentId: string;
  initialActiveRound?: AgentActiveRound | null;
}

interface ReasoningEntry {
  reasoning: string;
  action: string;
  timestamp: string;
}

interface AgentLiveStats {
  agent_id: string;
  total_pnl: number;
  rank: number;
  current_balance: number;
  total_trades: number;
}

export function LiveAgentStats({ agentId, initialActiveRound }: LiveAgentStatsProps) {
  const [activeRound, setActiveRound] = useState<AgentActiveRound | null>(initialActiveRound || null);
  const [liveStats, setLiveStats] = useState<AgentLiveStats | null>(null);
  const [recentReasoning, setRecentReasoning] = useState<ReasoningEntry[]>([]);
  const [loading, setLoading] = useState(!initialActiveRound);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    async function fetchActiveRound() {
      if (initialActiveRound) {
        setActiveRound(initialActiveRound);

        if (initialActiveRound.is_in_arena && initialActiveRound.round_id) {
          try {
            const { leaderboard } = await getLeaderboard(initialActiveRound.round_id);
            const agentStats = leaderboard.find((e: any) => e.agent_id === agentId);
            if (agentStats) {
              setLiveStats(agentStats);
            }
          } catch {
          }

          try {
            const { reasoning } = await getAgentReasoning(agentId, initialActiveRound.round_id, 3);
            setRecentReasoning(reasoning);
          } catch {
          }
        }
        setLoading(false);
        return;
      }

      try {
        const data = await getAgentActiveRound(agentId);
        setActiveRound(data);

        if (data.is_in_arena && data.round_id) {
          const { leaderboard } = await getLeaderboard(data.round_id);
          const agentStats = leaderboard.find((e: any) => e.agent_id === agentId);
          if (agentStats) {
            setLiveStats(agentStats);
          }

          try {
            const { reasoning } = await getAgentReasoning(agentId, data.round_id, 3);
            setRecentReasoning(reasoning);
          } catch {
          }
        }
      } catch (err) {
        console.error('Failed to fetch active round:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchActiveRound();
  }, [agentId, initialActiveRound]);

  const handleLeaderboardUpdate = useCallback((data: LeaderboardUpdate) => {
    const agentStats = data.rankings?.find(e => e.agent_id === agentId);
    if (agentStats) {
      setLiveStats({
        agent_id: agentStats.agent_id,
        total_pnl: agentStats.total_pnl,
        rank: agentStats.rank,
        current_balance: 0,
        total_trades: 0,
      });
    }
  }, [agentId]);

  const handleReasoningUpdate = useCallback((data: any) => {
    if (data.agent_id === agentId) {
      setRecentReasoning(prev => [data, ...prev].slice(0, 3));
    }
  }, [agentId]);

  const roundId = activeRound?.is_in_arena ? activeRound?.round_id || '' : '';

  const { isConnected } = useWebSocket({
    roundId,
    onLeaderboard: handleLeaderboardUpdate,
    onReasoning: handleReasoningUpdate,
  });

  useEffect(() => {
    if (!activeRound?.end_time) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(activeRound.end_time!).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('Ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeRound?.end_time]);

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="text-gray-400">Checking arena status...</div>
      </div>
    );
  }

  if (!activeRound?.is_in_arena) {
    return null;
  }

  const pnl = liveStats?.total_pnl ?? activeRound.current_pnl ?? 0;
  const rank = liveStats?.rank ?? activeRound.current_rank ?? '-';
  const balance = liveStats?.current_balance ?? activeRound.current_balance ?? 0;
  const trades = liveStats?.total_trades ?? activeRound.total_trades ?? 0;

  return (
    <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="text-2xl">
              {activeRound.round_status === 'active' ? '' : ''}
            </span>
            {activeRound.round_status === 'active' && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-300">
              {activeRound.round_status === 'active' ? 'LIVE IN ARENA' : 'Waiting to Start'}
            </h3>
            <p className="text-sm text-gray-400">{activeRound.round_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-xs text-gray-400">{isConnected ? 'Live' : 'Connecting...'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400 mb-1">Current Rank</p>
          <p className="text-3xl font-bold">
            {rank === 1 && <span className="text-yellow-400">#{rank}</span>}
            {rank === 2 && <span className="text-gray-300">#{rank}</span>}
            {rank === 3 && <span className="text-orange-400">#{rank}</span>}
            {typeof rank === 'number' && rank > 3 && <span>#{rank}</span>}
            {rank === '-' && <span className="text-gray-500">-</span>}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400 mb-1">P&L</p>
          <p className={`text-3xl font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400 mb-1">Balance</p>
          <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400 mb-1">Trades</p>
          <p className="text-3xl font-bold">{trades}</p>
        </div>
      </div>

      {activeRound.round_status === 'active' && timeRemaining && (
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-400 mb-1">Time Remaining</p>
          <p className="text-2xl font-mono font-bold text-yellow-400">{timeRemaining}</p>
        </div>
      )}

      {recentReasoning.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-400">Recent Decisions</h4>
          <div className="space-y-2">
            {recentReasoning.map((r, i) => (
              <div key={i} className="bg-gray-800/50 rounded p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    r.action === 'BUY_MARKET' ? 'bg-green-900/50 text-green-300' :
                    r.action === 'SELL_MARKET' ? 'bg-red-900/50 text-red-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {r.action?.replace('_MARKET', '') || 'HOLD'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(r.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-300 line-clamp-2">{r.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href={`/arena/${activeRound.round_id}`}
        className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
      >
        View Live Arena
      </Link>
    </div>
  );
}
