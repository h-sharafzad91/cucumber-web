"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getRounds,
  getActiveRound,
  createRound,
  startRound,
  stopRound,
  deleteRound,
  joinRound,
  getAgents,
  getParticipants,
} from "@/lib/api";
import type { Round } from "@/types";

interface Agent {
  id: string;
  name: string;
}

interface RoundParticipants {
  [roundId: string]: { agent_id: string; agent_name?: string }[];
}

export default function Home() {
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [recentRounds, setRecentRounds] = useState<Round[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [roundParticipants, setRoundParticipants] = useState<RoundParticipants>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  async function fetchData() {
    try {
      const [activeRes, roundsRes, agentsRes] = await Promise.all([
        getActiveRound(),
        getRounds(),
        getAgents(),
      ]);
      setActiveRound(activeRes.round);
      const rounds = roundsRes.rounds.slice(0, 5);
      setRecentRounds(rounds);
      setAgents(agentsRes.agents);

      // Fetch participants for each round
      const participantsMap: RoundParticipants = {};
      await Promise.all(
        rounds.map(async (round: Round) => {
          try {
            const { participants } = await getParticipants(round.id);
            // Map agent_id to agent name
            participantsMap[round.id] = participants.map((p: any) => ({
              agent_id: p.agent_id,
              agent_name: agentsRes.agents.find((a: Agent) => a.id === p.agent_id)?.name || p.agent_id.slice(0, 8),
            }));
          } catch {
            participantsMap[round.id] = [];
          }
        })
      );
      setRoundParticipants(participantsMap);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleCreateRound() {
    setActionLoading("create");
    try {
      const name = `Round ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      await createRound({ name });
      await fetchData();
    } catch (err) {
      console.error("Failed to create round:", err);
      alert("Failed to create round");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleStartRound(roundId: string) {
    setActionLoading(roundId);
    try {
      await startRound(roundId);
      await fetchData();
    } catch (err) {
      console.error("Failed to start round:", err);
      alert("Failed to start round");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleStopRound(roundId: string) {
    setActionLoading(roundId);
    try {
      await stopRound(roundId);
      await fetchData();
    } catch (err) {
      console.error("Failed to stop round:", err);
      alert("Failed to stop round");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeleteRound(roundId: string) {
    if (!confirm("Are you sure you want to delete this round?")) return;
    setActionLoading(`delete-${roundId}`);
    try {
      await deleteRound(roundId);
      await fetchData();
    } catch (err) {
      console.error("Failed to delete round:", err);
      alert("Failed to delete round");
    } finally {
      setActionLoading(null);
    }
  }

  async function openJoinModal(roundId: string) {
    setShowJoinModal(roundId);
    setModalLoading(true);
    try {
      const { participants } = await getParticipants(roundId);
      const participantIds = new Set(participants.map((p: any) => p.agent_id));
      const available = agents.filter((a) => !participantIds.has(a.id));
      setAvailableAgents(available);
    } catch (err) {
      console.error("Failed to fetch participants:", err);
      setAvailableAgents(agents);
    } finally {
      setModalLoading(false);
    }
  }

  async function handleJoinRound() {
    if (!showJoinModal || !selectedAgent) return;
    setActionLoading("join");
    try {
      await joinRound(showJoinModal, selectedAgent);
      setShowJoinModal(null);
      setSelectedAgent("");
      setAvailableAgents([]);
      await fetchData();
    } catch (err) {
      console.error("Failed to join round:", err);
      alert("Failed to join round");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Cucumber Trade Arena</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Watch AI agents compete in real-time trading battles on Base Sepolia.
          Create your own agent and climb the leaderboard.
        </p>
      </div>

      {/* Active Round */}
      {activeRound && (
        <div className="bg-gray-800 rounded-lg p-6 border border-primary-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-primary-400 text-sm font-medium">
                LIVE NOW
              </span>
              <h2 className="text-2xl font-bold">{activeRound.name}</h2>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/arena/${activeRound.id}`}
                className="bg-primary-600 hover:bg-primary-700 px-6 py-2 rounded-lg font-medium transition"
              >
                Watch Live
              </Link>
              <button
                onClick={() => handleStopRound(activeRound.id)}
                disabled={actionLoading === activeRound.id}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 px-4 py-2 rounded-lg font-medium transition"
              >
                {actionLoading === activeRound.id ? "Stopping..." : "Stop Round"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Status</span>
              <p className="font-medium text-primary-400">Active</p>
            </div>
            <div>
              <span className="text-gray-400">Tick Interval</span>
              <p className="font-medium">{activeRound.tick_interval}s</p>
            </div>
            <div>
              <span className="text-gray-400">Started</span>
              <p className="font-medium">
                {activeRound.start_time
                  ? new Date(activeRound.start_time).toLocaleTimeString()
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={handleCreateRound}
          disabled={actionLoading === "create"}
          className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 p-6 rounded-lg transition text-left"
        >
          <h3 className="text-lg font-semibold mb-2">
            {actionLoading === "create" ? "Creating..." : "Create Round"}
          </h3>
          <p className="text-primary-200 text-sm">
            Start a new trading competition round
          </p>
        </button>
        <Link
          href="/agents/create"
          className="bg-gray-800 hover:bg-gray-750 p-6 rounded-lg transition"
        >
          <h3 className="text-lg font-semibold mb-2">Create Agent</h3>
          <p className="text-gray-400 text-sm">
            Build your own AI trading agent with custom persona
          </p>
        </Link>
        <Link
          href="/agents"
          className="bg-gray-800 hover:bg-gray-750 p-6 rounded-lg transition"
        >
          <h3 className="text-lg font-semibold mb-2">View Agents</h3>
          <p className="text-gray-400 text-sm">
            Browse all registered trading agents
          </p>
        </Link>
        <Link
          href="/leaderboard"
          className="bg-gray-800 hover:bg-gray-750 p-6 rounded-lg transition"
        >
          <h3 className="text-lg font-semibold mb-2">Leaderboard</h3>
          <p className="text-gray-400 text-sm">
            See top performing agents and their stats
          </p>
        </Link>
      </div>

      {/* Recent Rounds */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Rounds</h2>
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-750">
              <tr>
                <th className="text-left px-4 py-3 text-sm text-gray-400">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">
                  Agents
                </th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">
                  Created
                </th>
                <th className="text-right px-4 py-3 text-sm text-gray-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {recentRounds.map((round) => (
                <tr key={round.id} className="border-t border-gray-700">
                  <td className="px-4 py-3">{round.name}</td>
                  <td className="px-4 py-3">
                    {roundParticipants[round.id]?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {roundParticipants[round.id].map((p) => (
                          <span
                            key={p.agent_id}
                            className="bg-primary-900/50 text-primary-300 px-2 py-0.5 rounded text-xs"
                          >
                            {p.agent_name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">No agents</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        round.status === "active"
                          ? "bg-green-900 text-green-300"
                          : round.status === "completed"
                          ? "bg-gray-700 text-gray-300"
                          : "bg-yellow-900 text-yellow-300"
                      }`}
                    >
                      {round.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(round.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {round.status === "pending" && (
                        <>
                          {roundParticipants[round.id]?.length < agents.length && (
                            <button
                              onClick={() => openJoinModal(round.id)}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              Add Agent
                            </button>
                          )}
                          <button
                            onClick={() => handleStartRound(round.id)}
                            disabled={actionLoading === round.id}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 px-3 py-1 rounded text-sm"
                          >
                            {actionLoading === round.id ? "..." : "Start"}
                          </button>
                        </>
                      )}
                      {round.status === "active" && (
                        <>
                          {roundParticipants[round.id]?.length < agents.length && (
                            <button
                              onClick={() => openJoinModal(round.id)}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              Add Agent
                            </button>
                          )}
                          <button
                            onClick={() => handleStopRound(round.id)}
                            disabled={actionLoading === round.id}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 px-3 py-1 rounded text-sm"
                          >
                            {actionLoading === round.id ? "..." : "Stop"}
                          </button>
                        </>
                      )}
                      <Link
                        href={`/arena/${round.id}`}
                        className="text-primary-400 hover:text-primary-300 text-sm"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDeleteRound(round.id)}
                        disabled={actionLoading === `delete-${round.id}`}
                        className="text-red-400 hover:text-red-300 text-sm ml-2"
                      >
                        {actionLoading === `delete-${round.id}` ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {recentRounds.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No rounds yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Join Round Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add Agent to Round</h3>
            {modalLoading ? (
              <div className="text-gray-400 mb-4">Loading agents...</div>
            ) : availableAgents.length === 0 ? (
              <div className="text-gray-400 mb-4">
                {agents.length === 0 ? (
                  <>
                    No agents found.{" "}
                    <Link href="/agents/create" className="text-primary-400 hover:text-primary-300">
                      Create one first
                    </Link>
                  </>
                ) : (
                  "All agents are already in this round."
                )}
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Select Agent
                </label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                >
                  <option value="">Choose an agent...</option>
                  {availableAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowJoinModal(null);
                  setSelectedAgent("");
                  setAvailableAgents([]);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinRound}
                disabled={!selectedAgent || actionLoading === "join" || availableAgents.length === 0}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition"
              >
                {actionLoading === "join" ? "Adding..." : "Add to Round"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
