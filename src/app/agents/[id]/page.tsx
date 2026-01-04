"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAgents, deleteAgent, getAgentTrades, getAgentBattleHistory, getAgentPerformance, getAgentActiveRound, type AgentActiveRound, type TradePagination } from "@/lib/api";
import { useWallet } from "@/hooks/useWallet";
import { LiveAgentStats } from "@/components/arena/LiveAgentStats";
import type { Agent, Trade } from "@/types";

interface BattleHistoryEntry {
  id: string;
  arena_name: string;
  date: string;
  rank: number;
  pnl_percent: number;
  prize: number;
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

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [battleHistory, setBattleHistory] = useState<BattleHistoryEntry[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [tradePage, setTradePage] = useState(1);
  const [tradePagination, setTradePagination] = useState<TradePagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [activeRound, setActiveRound] = useState<AgentActiveRound | null>(null);
  const { address } = useWallet();
  const router = useRouter();

  useEffect(() => {
    fetchAgentData();
  }, [params.id, address]);

  useEffect(() => {
    if (agent) {
      fetchTrades();
    }
  }, [tradePage]);

  async function fetchTrades() {
    try {
      const tradesRes = await getAgentTrades(params.id, tradePage, 20);
      setTradeHistory(tradesRes.trades || []);
      setTradePagination(tradesRes.pagination);
    } catch (err) {
      console.error("Failed to fetch trades:", err);
    }
  }

  async function fetchAgentData() {
    try {
      const res = await getAgents(address || undefined);
      const foundAgent = res.agents.find((a: Agent) => a.id === params.id);

      if (!foundAgent) {
        router.push("/agents");
        return;
      }

      setAgent(foundAgent);

      const [tradesRes, battlesRes, performanceRes, activeRoundRes] = await Promise.allSettled([
        getAgentTrades(params.id),
        getAgentBattleHistory(params.id),
        getAgentPerformance(params.id),
        getAgentActiveRound(params.id),
      ]);

      if (tradesRes.status === "fulfilled") {
        setTradeHistory(tradesRes.value.trades || []);
        setTradePagination(tradesRes.value.pagination);
      }

      if (battlesRes.status === "fulfilled") {
        setBattleHistory(battlesRes.value.battles || []);
      }

      if (performanceRes.status === "fulfilled") {
        setTotalWinnings(performanceRes.value.total_winnings || 0);
      }

      if (activeRoundRes.status === "fulfilled") {
        setActiveRound(activeRoundRes.value);
      }
    } catch (err) {
      console.error("Failed to fetch agent data:", err);
      router.push("/agents");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!agent) return;

    if (!confirm(`Are you sure you want to delete ${agent.name}? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAgent(agent.id);
      router.push("/agents");
    } catch (err) {
      console.error("Failed to delete agent:", err);
      alert("Failed to delete agent. Please try again.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading agent details...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Agent not found</div>
      </div>
    );
  }

  const isInArena = activeRound?.is_in_arena && activeRound?.round_status === 'active';

  return (
    <div className="space-y-6">
      <Link
        href="/agents"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
      >
        <span>←</span> Back to Agents
      </Link>

      <div className="bg-gradient-to-br from-primary-600/20 to-primary-800/20 border border-primary-500/30 rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center text-4xl">
              🥒
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{agent.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>Created {new Date(agent.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>Model: {agent.worker_config.model}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 mb-1">Total Winnings</p>
            <p className={`text-3xl font-bold ${totalWinnings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalWinnings >= 0 ? '+' : ''}${totalWinnings.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded text-sm font-medium ${
            agent.is_active
              ? "bg-green-900/30 text-green-300"
              : "bg-gray-700 text-gray-400"
          }`}>
            {agent.is_active ? "Ready" : "Idle"}
          </span>
          {isInArena && (
            <span className="px-3 py-1 rounded text-sm font-medium bg-blue-900/30 text-blue-300">
              In Arena
            </span>
          )}
          <span className={`px-3 py-1 rounded text-sm font-medium ${
            agent.trading_style === "degen"
              ? "bg-red-900/30 text-red-300"
              : agent.trading_style === "paper_hands"
              ? "bg-blue-900/30 text-blue-300"
              : "bg-yellow-900/30 text-yellow-300"
          }`}>
            {agent.trading_style === "paper_hands" ? "Paper Hands" :
             agent.trading_style === "degen" ? "Degen" : "Normal"}
          </span>
          {(agent.leverage || 1) > 1 && (
            <span className="px-3 py-1 rounded text-sm font-medium bg-orange-900/30 text-orange-300">
              {agent.leverage}x Leverage
            </span>
          )}
          <span className="px-3 py-1 rounded text-sm font-medium bg-purple-900/30 text-purple-300">
            {formatTickInterval(agent.tick_interval || 60)} tick
          </span>
        </div>
      </div>

      <LiveAgentStats agentId={agent.id} initialActiveRound={activeRound} />

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-primary-300">Strategy & Style</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Strategy</label>
                <p className="text-base capitalize">
                  {agent.persona_config.strategy?.replace("_", " ") || "Momentum"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Trading Style</label>
                <p className="text-base">
                  <span className={`px-2 py-1 rounded text-sm ${
                    agent.trading_style === "degen"
                      ? "bg-red-900/30 text-red-300"
                      : agent.trading_style === "paper_hands"
                      ? "bg-blue-900/30 text-blue-300"
                      : "bg-yellow-900/30 text-yellow-300"
                  }`}>
                    {agent.trading_style === "paper_hands" ? "Paper Hands" :
                     agent.trading_style === "degen" ? "Degen" : "Normal"}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Tick Interval</label>
                <p className="text-base font-semibold text-purple-400">
                  {formatTickInterval(agent.tick_interval || 60)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Risk Tolerance</label>
                <p className="text-base capitalize">{agent.persona_config.risk_tolerance}</p>
              </div>
              {agent.persona_config.goal && (
                <div>
                  <label className="text-sm text-gray-400">Goal</label>
                  <p className="text-base">{agent.persona_config.goal}</p>
                </div>
              )}
              {agent.persona_config.description && (
                <div>
                  <label className="text-sm text-gray-400">Custom Instructions</label>
                  <p className="text-base text-gray-300">{agent.persona_config.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-primary-300">Risk Management</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Leverage</label>
                <p className="text-base font-semibold text-yellow-400">
                  {agent.leverage || 1}x
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Stop Loss</label>
                <p className="text-base text-red-400">
                  {agent.stop_loss_percent ? `${agent.stop_loss_percent}%` : 'Not set'}
                  {agent.stop_loss_percent && (
                    <span className="text-gray-500 text-sm ml-1">
                      (close {agent.stop_loss_position_close_percent || 100}%)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Take Profit</label>
                <p className="text-base text-green-400">
                  {agent.take_profit_percent ? `${agent.take_profit_percent}%` : 'Not set'}
                  {agent.take_profit_percent && (
                    <span className="text-gray-500 text-sm ml-1">
                      (close {agent.take_profit_position_close_percent || 50}%)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-primary-300">AI Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Model</label>
                <p className="text-base">{agent.worker_config.model}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Temperature</label>
                <p className="text-base">{agent.worker_config.temperature}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Max Tokens</label>
                <p className="text-base">{agent.worker_config.max_tokens}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">MMR Rating</label>
                <p className="text-base font-semibold text-yellow-400">{agent.mmr}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Battle History</h2>

        {battleHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No battles yet. Join an arena to start competing!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Arena Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Rank</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">PnL %</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Prize</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {battleHistory.map((battle) => (
                  <tr key={battle.id} className="hover:bg-gray-750">
                    <td className="py-3 px-4">{battle.arena_name}</td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(battle.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${
                        battle.rank === 1 ? 'text-yellow-400' :
                        battle.rank <= 3 ? 'text-blue-400' :
                        'text-gray-300'
                      }`}>
                        #{battle.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={battle.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {battle.pnl_percent >= 0 ? '+' : ''}{battle.pnl_percent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={battle.prize > 0 ? 'text-green-400' : 'text-gray-400'}>
                        ${battle.prize.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Trade Log History</h2>

        {tradeHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No trades yet. This agent hasn't made any trades.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Date/Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Context</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Pair & Side</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Size</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Execution</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {tradeHistory.map((trade, index) => (
                    <tr key={trade.id || index} className="hover:bg-gray-750">
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {new Date(trade.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm">Arena</td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${
                          trade.action === 'BUY_MARKET' ? 'text-green-400' :
                          trade.action === 'SELL_MARKET' ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {trade.asset} {trade.action.replace('_MARKET', '')}
                        </span>
                      </td>
                      <td className="py-3 px-4">${trade.size_usd.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        ${trade.execution_price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded ${
                          trade.status === 'confirmed' ? 'bg-green-900/30 text-green-300' :
                          trade.status === 'failed' ? 'bg-red-900/30 text-red-300' :
                          'bg-yellow-900/30 text-yellow-300'
                        }`}>
                          {trade.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {tradePagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                <span className="text-sm text-gray-400">
                  Showing {tradeHistory.length} of {tradePagination.total} trades
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTradePage(p => Math.max(1, p - 1))}
                    disabled={tradePage === 1}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    {tradePage} / {tradePagination.totalPages}
                  </span>
                  <button
                    onClick={() => setTradePage(p => Math.min(tradePagination.totalPages, p + 1))}
                    disabled={tradePage >= tradePagination.totalPages}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Link
          href={`/agents/${agent.id}/edit`}
          className={`px-6 py-3 rounded-lg font-medium transition ${
            isInArena
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-primary-600 hover:bg-primary-700 text-white"
          }`}
          onClick={(e) => isInArena && e.preventDefault()}
        >
          Edit Agent
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting || isInArena}
          className={`px-6 py-3 rounded-lg font-medium transition ${
            deleting || isInArena
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {deleting ? "Deleting..." : "Delete Agent"}
        </button>
        {isInArena && (
          <span className="text-sm text-gray-400">
            Agent is currently in an arena. Wait for the round to complete before editing or deleting.
          </span>
        )}
      </div>
    </div>
  );
}
