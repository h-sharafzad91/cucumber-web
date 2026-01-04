"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAgents, deleteAgent } from "@/lib/api";
import { useWallet } from "@/hooks/useWallet";
import type { Agent } from "@/types";

interface AgentStats {
  totalAgents: number;
  totalBattles: number;
  netEarnings: number;
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

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AgentStats>({
    totalAgents: 0,
    totalBattles: 0,
    netEarnings: 0,
  });
  const { address } = useWallet();

  useEffect(() => {
    fetchAgents();
  }, [address]);

  async function fetchAgents() {
    try {
      const res = await getAgents(address || undefined);
      setAgents(res.agents);

      setStats({
        totalAgents: res.agents.length,
        totalBattles: 0,
        netEarnings: 0,
      });
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, agent: Agent) {
    e.preventDefault();
    e.stopPropagation();
    if (agent.is_locked) {
      alert("Cannot delete agent while in an active round");
      return;
    }
    if (!confirm(`Delete agent "${agent.name}"? This cannot be undone.`)) return;

    try {
      await deleteAgent(agent.id);
      setAgents(agents.filter((a) => a.id !== agent.id));
    } catch (err) {
      console.error("Failed to delete agent:", err);
      alert("Failed to delete agent");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Agents</h1>
        <Link
          href="/agents/create"
          className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg font-medium transition"
        >
          Create Agent
        </Link>
      </div>

      <div className="bg-gradient-to-br from-primary-600/20 to-primary-800/20 border border-primary-500/30 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-primary-300">Performance Overview</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Agents</p>
            <p className="text-3xl font-bold">{stats.totalAgents}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Battles Joined</p>
            <p className="text-3xl font-bold">{stats.totalBattles}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Net Career Earnings</p>
            <p className={`text-3xl font-bold ${stats.netEarnings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.netEarnings >= 0 ? '+' : ''}${stats.netEarnings.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Link
            key={agent.id}
            href={`/agents/${agent.id}`}
            className="bg-gray-800 hover:bg-gray-750 rounded-lg p-5 space-y-4 border border-gray-700 hover:border-primary-500/50 transition group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center text-2xl">
                  🥒
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-primary-400 transition">{agent.name}</h3>
                  <p className="text-xs text-gray-500">Created {new Date(agent.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                agent.is_active
                  ? "bg-green-900/30 text-green-300"
                  : "bg-gray-700 text-gray-400"
              }`}>
                {agent.is_active ? "Ready" : "Idle"}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
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
                <span className="px-2 py-1 rounded text-xs bg-orange-900/30 text-orange-300">
                  {agent.leverage}x Leverage
                </span>
              )}
              <span className="px-2 py-1 rounded text-xs bg-purple-900/30 text-purple-300">
                {formatTickInterval(agent.tick_interval || 60)} tick
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div>
                <span className="text-gray-400">Strategy: </span>
                <span className="capitalize">{agent.persona_config.strategy?.replace("_", " ")}</span>
              </div>
              <div>
                <span className="text-gray-400">Risk: </span>
                <span className="capitalize">{agent.persona_config.risk_tolerance}</span>
              </div>
              <div>
                <span className="text-gray-400">Model: </span>
                <span className="text-xs">{agent.worker_config.model}</span>
              </div>
              <div>
                <span className="text-gray-400">Leverage: </span>
                <span>{agent.leverage || 1}x</span>
              </div>
              {agent.stop_loss_percent && (
                <div>
                  <span className="text-gray-400">Stop Loss: </span>
                  <span className="text-red-400">{agent.stop_loss_percent}%</span>
                </div>
              )}
              {agent.take_profit_percent && (
                <div>
                  <span className="text-gray-400">Take Profit: </span>
                  <span className="text-green-400">{agent.take_profit_percent}%</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-700">
              <div className="text-center">
                <p className="text-xs text-gray-500">Tick</p>
                <p className="text-sm font-semibold">{formatTickInterval(agent.tick_interval || 60)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Battles</p>
                <p className="text-sm font-semibold">0</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">PnL</p>
                <p className="text-sm font-semibold text-gray-400">$0</p>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <div className="flex-1 text-center py-2 px-4 bg-primary-600 group-hover:bg-primary-700 rounded-lg text-sm font-medium transition">
                View Details
              </div>
              <button
                onClick={(e) => handleDelete(e, agent)}
                disabled={agent.is_locked}
                className="py-2 px-3 bg-red-900/50 hover:bg-red-800 text-red-300 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </Link>
        ))}

        {agents.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            No agents yet.{" "}
            <Link href="/agents/create" className="text-primary-400 hover:underline">
              Create one
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
