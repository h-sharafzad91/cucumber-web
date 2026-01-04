"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useArena } from "@/hooks/useArena";
import { useArenaStore } from "@/stores/arena-store";
import { useWallet } from "@/hooks/useWallet";
import { getAgents } from "@/lib/api";
import { AgentCard } from "@/components/arena/AgentCard";
import { AutoTradeControl } from "@/components/arena/AutoTradeControl";
import { PerformanceChart } from "@/components/arena/PerformanceChart";
import { LiveLeaderboard } from "@/components/arena/LiveLeaderboard";
import { LiveTradeFeed } from "@/components/arena/LiveTradeFeed";
import { LiveReasoningFeed } from "@/components/arena/LiveReasoningFeed";
import { LiveMarketPrice } from "@/components/arena/LiveMarketPrice";
import { BettingPanel } from "@/components/arena/BettingPanel";
import { formatUSD } from "@/lib/utils";

function formatTimeRemaining(endTime: string | null): string {
  if (!endTime) return '--';
  const end = new Date(endTime).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function useCountdown(endTime: string | null): string {
  const [timeLeft, setTimeLeft] = useState(() => formatTimeRemaining(endTime));

  useEffect(() => {
    if (!endTime) {
      setTimeLeft('--');
      return;
    }

    const updateTimer = () => {
      setTimeLeft(formatTimeRemaining(endTime));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return timeLeft;
}

export default function ArenaPage() {
  const params = useParams();
  const roundId = params.roundId as string;
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [userAgentIds, setUserAgentIds] = useState<string[]>([]);
  const { address } = useWallet();

  const { loading, error } = useArena(roundId);

  const { round, currentPrice, tickNumber, participants, trades } =
    useArenaStore();

  const effectiveEndTime = useMemo(() => {
    if (round?.end_time) return round.end_time;
    if (round?.start_time && round?.settings?.duration_minutes) {
      const startTime = new Date(round.start_time);
      const endTime = new Date(startTime.getTime() + round.settings.duration_minutes * 60 * 1000);
      return endTime.toISOString();
    }
    return null;
  }, [round?.end_time, round?.start_time, round?.settings?.duration_minutes]);

  const timeLeft = useCountdown(effectiveEndTime);

  // Fetch user's agents to filter participants
  useEffect(() => {
    async function fetchUserAgents() {
      if (!address) {
        setUserAgentIds([]);
        return;
      }
      try {
        const { agents } = await getAgents(address);
        setUserAgentIds(agents.map((a) => a.id));
      } catch (err) {
        console.error("Failed to fetch user agents:", err);
        setUserAgentIds([]);
      }
    }
    fetchUserAgents();
  }, [address]);

  // Filter participants to only show user's agents
  const filteredParticipants = useMemo(() => {
    if (userAgentIds.length === 0) return [];
    return participants.filter((p) => userAgentIds.includes(p.agent_id));
  }, [participants, userAgentIds]);

  // Filter trades to only show user's agents' trades (excluding HOLD)
  const userTrades = useMemo(() => {
    if (userAgentIds.length === 0) return [];
    return trades.filter((t) => userAgentIds.includes(t.agent_id) && t.action !== 'HOLD');
  }, [trades, userAgentIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading arena...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const isContest = round?.arena_type === 'contest';
  const isTournament = round?.arena_type === 'tournament' || !round?.arena_type;
  const prizePool = round?.prize_pool_seed || 0;
  const buyIn = round?.buy_in_fee || 0;
  const totalPool = prizePool + (participants.length * buyIn * 0.85);

  return (
    <div className="space-y-6">
      <div className={`rounded-lg p-4 ${isContest ? 'bg-purple-900/20 border border-purple-500/30' : 'bg-primary-900/20 border border-primary-500/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{round?.name || "Arena"}</h1>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  isContest
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                }`}>
                  {isContest ? 'CONTEST' : 'TOURNAMENT'}
                </span>
                {round?.status === 'active' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-300">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {isContest
                  ? 'Quick 2-min match • 2-5 players • Winner takes 70%'
                  : `${round?.trading_pair || 'BTC/USDT'} • Entry: ${formatUSD(buyIn)}`
                }
              </p>
            </div>
          </div>
          <LiveMarketPrice roundId={roundId} initialPrice={currentPrice} />
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-xs text-gray-400">Prize Pool</div>
            <div className="text-lg font-bold text-green-400">{formatUSD(totalPool)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Participants</div>
            <div className="text-lg font-bold">{participants.length}{!isContest && `/${round?.agent_limit || '∞'}`}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Time Left</div>
            <div className="text-lg font-bold">{timeLeft}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">{isContest ? 'Duration' : 'Tick Range'}</div>
            <div className="text-lg font-bold">
              {isContest ? '2 min' : `${round?.min_tick_interval || 10}s - ${round?.max_tick_interval || 120}s`}
            </div>
          </div>
        </div>
      </div>

      {round && (
        <AutoTradeControl
          roundId={roundId}
          roundStatus={round.status}
          minTickInterval={round.min_tick_interval || 10}
          maxTickInterval={round.max_tick_interval || 120}
        />
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <span className="text-gray-400 text-sm">Your Agents in Arena</span>
          <p className="text-lg font-semibold">{filteredParticipants.length}</p>
          {filteredParticipants.length > 0 && (
            <div className="mt-2 space-y-1">
              {filteredParticipants.map((p) => (
                <div key={p.agent_id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 truncate max-w-[120px]">{p.agent_name || p.agent_id.slice(0, 8)}</span>
                  <span className="text-purple-400 font-medium">
                    {p.effective_tick_interval ? `${p.effective_tick_interval}s` : '--'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <span className="text-gray-400 text-sm">Your Total Trades</span>
          <p className="text-lg font-semibold">{userTrades.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <span className="text-gray-400 text-sm">Your Total PnL</span>
          <p className={`text-lg font-semibold ${
            filteredParticipants.reduce((sum, p) => sum + (p.total_pnl || 0), 0) >= 0
              ? 'text-green-400'
              : 'text-red-400'
          }`}>
            {formatUSD(filteredParticipants.reduce((sum, p) => sum + (p.total_pnl || 0), 0))}
          </p>
        </div>
      </div>

      {filteredParticipants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredParticipants.slice(0, 2).map((p) => (
            <PerformanceChart
              key={p.agent_id}
              data={trades
                .filter((t) => t.agent_id === p.agent_id && t.status === "confirmed")
                .slice(0, 20)
                .reverse()
                .map((t, i, arr) => ({
                  timestamp: t.created_at,
                  value: p.initial_balance + (p.total_pnl * (i + 1)) / Math.max(arr.length, 1),
                  pnl: (p.total_pnl * (i + 1)) / Math.max(arr.length, 1),
                }))}
              initialBalance={p.initial_balance}
              height={100}
              className="bg-gray-800/50"
            />
          ))}
        </div>
      )}

      {filteredParticipants.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-2">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedAgentId(null)}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                selectedAgentId === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All Your Agents
            </button>
            {filteredParticipants.map((p) => {
              const realizedPnl = p.realized_pnl || 0;
              const returnPct = p.initial_balance > 0 ? ((realizedPnl / p.initial_balance) * 100) : 0;
              return (
                <button
                  key={p.agent_id}
                  onClick={() => setSelectedAgentId(p.agent_id)}
                  className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                    selectedAgentId === p.agent_id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {p.agent_name || p.agent_id.slice(0, 8)}
                  <span className={`ml-2 text-sm ${realizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatUSD(realizedPnl)} ({returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 space-y-4">
          <h2 className="font-semibold text-gray-300">
            {selectedAgentId ? 'Selected Agent' : 'Your Agents'}
          </h2>
          {selectedAgentId ? (
            filteredParticipants
              .filter((p) => p.agent_id === selectedAgentId)
              .map((p) => (
                <AgentCard
                  key={p.agent_id}
                  agentId={p.agent_id}
                  agentName={p.agent_name}
                  roundId={roundId}
                  initialBalance={p.initial_balance}
                  balance={p.current_balance}
                  pnl={p.total_pnl}
                  realizedPnl={p.realized_pnl}
                  unrealizedPnl={p.unrealized_pnl}
                  trades={p.total_trades}
                  currentPrice={currentPrice}
                />
              ))
          ) : (
            filteredParticipants.map((p) => (
              <AgentCard
                key={p.agent_id}
                agentId={p.agent_id}
                agentName={p.agent_name}
                roundId={roundId}
                initialBalance={p.initial_balance}
                balance={p.current_balance}
                pnl={p.total_pnl}
                realizedPnl={p.realized_pnl}
                unrealizedPnl={p.unrealized_pnl}
                trades={p.total_trades}
                currentPrice={currentPrice}
              />
            ))
          )}
          {filteredParticipants.length === 0 && (
            <p className="text-gray-500 text-sm">No agents from your wallet in this arena</p>
          )}
        </div>

        <div className="col-span-5">
          <LiveReasoningFeed
            roundId={roundId}
            maxItems={50}
            agentId={selectedAgentId}
            userAgentIds={userAgentIds}
          />
        </div>

        <div className="col-span-4 space-y-6">
          <LiveLeaderboard roundId={roundId} />

          {isTournament && round?.status === 'active' && (
            <BettingPanel
              roundId={roundId}
              participants={participants.map(p => ({
                agent_id: p.agent_id,
                agent_name: p.agent_name || p.agent_id.slice(0, 8)
              }))}
            />
          )}

          <LiveTradeFeed
            roundId={roundId}
            maxItems={15}
            agentId={selectedAgentId}
            userAgentIds={userAgentIds}
          />
        </div>
      </div>
    </div>
  );
}
