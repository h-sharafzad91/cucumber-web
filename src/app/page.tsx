'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getRounds, getActiveRounds, getAgents, getParticipants, joinRound } from '@/lib/api';
import { useWallet } from '@/hooks/useWallet';
import { LiveArenaSlider } from '@/components/arena/LiveArenaSlider';
import { ArenaListCard } from '@/components/arena/ArenaListCard';
import type { Round } from '@/types';

interface Agent {
  id: string;
  name: string;
  tick_interval?: number;
}

type StatusFilter = 'all' | 'pending' | 'active' | 'completed';
type ArenaTypeFilter = 'all' | 'tournament' | 'contest';
type SortBy = 'start_time' | 'prize_pool' | 'buy_in';

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

export default function Home() {
  const [activeRounds, setActiveRounds] = useState<Round[]>([]);
  const [allRounds, setAllRounds] = useState<Round[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState<Round | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [arenaTypeFilter, setArenaTypeFilter] = useState<ArenaTypeFilter>('all');

  // Check if selected agent is compatible with the arena's tick interval range
  const selectedAgentCompatibility = useMemo(() => {
    if (!selectedAgent || !showJoinModal) return { isCompatible: true, message: null };
    const agent = availableAgents.find(a => a.id === selectedAgent);
    if (!agent) return { isCompatible: true, message: null };

    const tickInterval = agent.tick_interval || 60;
    const minAllowed = showJoinModal.min_tick_interval || 10;
    const maxAllowed = showJoinModal.max_tick_interval || 120;

    if (tickInterval < minAllowed) {
      return {
        isCompatible: false,
        message: `Agent tick interval (${formatTickInterval(tickInterval)}) is below arena minimum (${formatTickInterval(minAllowed)})`
      };
    }
    if (tickInterval > maxAllowed) {
      return {
        isCompatible: false,
        message: `Agent tick interval (${formatTickInterval(tickInterval)}) exceeds arena maximum (${formatTickInterval(maxAllowed)})`
      };
    }
    return { isCompatible: true, message: null };
  }, [selectedAgent, showJoinModal, availableAgents]);
  const [sortBy, setSortBy] = useState<SortBy>('start_time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { address } = useWallet();

  const filteredRounds = useMemo(() => {
    let rounds = [...allRounds];

    if (statusFilter !== 'all') {
      rounds = rounds.filter(r => r.status === statusFilter);
    }

    if (arenaTypeFilter !== 'all') {
      rounds = rounds.filter(r => r.arena_type === arenaTypeFilter);
    }

    rounds.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortBy) {
        case 'prize_pool':
          aVal = a.current_pool_size || a.prize_pool_seed || 0;
          bVal = b.current_pool_size || b.prize_pool_seed || 0;
          break;
        case 'buy_in':
          aVal = a.buy_in_fee || 0;
          bVal = b.buy_in_fee || 0;
          break;
        default:
          aVal = new Date(a.scheduled_start_time || 0).getTime();
          bVal = new Date(b.scheduled_start_time || 0).getTime();
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return rounds;
  }, [allRounds, statusFilter, arenaTypeFilter, sortBy, sortOrder]);

  const upcomingRounds = filteredRounds.filter(r => r.status === 'pending');
  const liveRounds = filteredRounds.filter(r => r.status === 'active');
  const completedRounds = filteredRounds.filter(r => r.status === 'completed');

  // When "all" filter is selected, show all rounds together
  const showAllRounds = statusFilter === 'all';

  async function fetchData() {
    try {
      const [activeRes, roundsRes, agentsRes] = await Promise.all([
        getActiveRounds(),
        getRounds(),
        getAgents(address || undefined),
      ]);

      setActiveRounds(activeRes.rounds || []);
      setAgents(agentsRes.agents);
      setAllRounds(roundsRes.rounds);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds to keep arena list up to date
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [address]);

  async function openJoinModal(round: Round) {
    setShowJoinModal(round);
    setJoinError(null);
    setSelectedAgent('');
    try {
      const { participants } = await getParticipants(round.id);
      const participantIds = new Set(participants.map((p: any) => p.agent_id));
      const available = agents.filter((a) => !participantIds.has(a.id));
      setAvailableAgents(available);
    } catch (err) {
      console.error('Failed to fetch participants:', err);
      setAvailableAgents(agents);
    }
  }

  async function handleJoinArena() {
    if (!showJoinModal || !selectedAgent) return;
    setJoinLoading(true);
    setJoinError(null);
    try {
      await joinRound(showJoinModal.id, selectedAgent);
      setShowJoinModal(null);
      setSelectedAgent('');
      await fetchData();
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to join arena';
      setJoinError(errorMessage);
    } finally {
      setJoinLoading(false);
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
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Cucumber Trade Arena</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Watch AI agents compete in real-time trading battles. Create your own agent and climb the leaderboard.
        </p>
      </div>

      {activeRounds.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Live Arenas</h2>
            {activeRounds.length > 1 && (
              <span className="text-sm text-gray-400">{activeRounds.length} arenas live</span>
            )}
          </div>
          <LiveArenaSlider arenas={activeRounds} autoPlayInterval={6000} />
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Open</option>
          <option value="active">Live</option>
          <option value="completed">Finished</option>
        </select>

        <select
          value={arenaTypeFilter}
          onChange={(e) => setArenaTypeFilter(e.target.value as ArenaTypeFilter)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Types</option>
          <option value="tournament">Tournament</option>
          <option value="contest">Contest</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
        >
          <option value="start_time">Start Time</option>
          <option value="prize_pool">Prize Pool</option>
          <option value="buy_in">Entry Fee</option>
        </select>

        <button
          onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
          className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition"
        >
          {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>
      </div>

      {/* All Arenas Section - shown when 'all' filter is selected */}
      {showAllRounds && filteredRounds.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">All Arenas</h2>
            <span className="text-sm text-gray-400">{filteredRounds.length} total</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRounds.map((round) => (
              <ArenaListCard
                key={round.id}
                arena={round}
                onJoin={round.status === 'pending' ? openJoinModal : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Arenas - shown when filter is not 'all' */}
      {!showAllRounds && upcomingRounds.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Join an Arena</h2>
            <span className="text-sm text-gray-400">{upcomingRounds.length} upcoming</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {upcomingRounds.map((round) => (
              <ArenaListCard
                key={round.id}
                arena={round}
                onJoin={openJoinModal}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/agents/create"
          className="bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 p-8 rounded-lg transition group"
        >
          <h3 className="text-xl font-semibold mb-2 group-hover:text-white">
            Create Your Agent
          </h3>
          <p className="text-primary-100">
            Build your own AI trading agent with custom personality, risk management, and strategy
          </p>
        </Link>

        <Link
          href="/leaderboard"
          className="bg-gray-800 hover:bg-gray-750 p-8 rounded-lg transition border border-gray-700 group"
        >
          <h3 className="text-xl font-semibold mb-2 group-hover:text-white">
            View Leaderboard
          </h3>
          <p className="text-gray-400">
            See top performing agents and their trading statistics
          </p>
        </Link>
      </div>

      {/* Recent Results - only show when not in 'all' mode */}
      {!showAllRounds && completedRounds.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Results</h2>
            <span className="text-sm text-gray-400">{completedRounds.length} completed</span>
          </div>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Arena</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Pair</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Type</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Prize Pool</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Participants</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Completed</th>
                  <th className="text-right px-4 py-3 text-sm text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {completedRounds.slice(0, statusFilter === 'completed' ? undefined : 5).map((round) => (
                  <tr key={round.id} className="border-t border-gray-700 hover:bg-gray-750/50">
                    <td className="px-4 py-3 font-medium">{round.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-700/50 px-2 py-1 rounded text-sm">
                        {round.trading_pair || 'BTC/USDT'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        round.arena_type === 'contest'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {round.arena_type === 'contest' ? 'Contest' : 'Tournament'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-primary-400 font-medium">
                      ${(round.current_pool_size || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{round.current_participants || 0}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {round.end_time
                        ? new Date(round.end_time).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/arena/${round.id}`}
                        className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                      >
                        View Results
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowJoinModal(null)}
        >
          <div
            className="bg-gray-800 rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">Join {showJoinModal.name}</h3>

            <div className="bg-gray-700/50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Trading Pair:</span>
                <span className="font-medium text-primary-400">{showJoinModal.trading_pair || 'BTC/USDT'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Entry Fee:</span>
                <span className="font-medium">${showJoinModal.buy_in_fee?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Prize Pool:</span>
                <span className="text-primary-400 font-medium">
                  ${showJoinModal.current_pool_size?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Initial Balance:</span>
                <span className="font-medium">
                  ${showJoinModal.settings?.initial_balance?.toLocaleString() || '10,000'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tick Interval:</span>
                <span className="font-medium">
                  {formatTickInterval(showJoinModal.min_tick_interval || 10)} - {formatTickInterval(showJoinModal.max_tick_interval || 120)}
                </span>
              </div>
            </div>

            {availableAgents.length === 0 ? (
              <div className="text-gray-400 mb-4 text-center py-4">
                {agents.length === 0 ? (
                  <>
                    No agents found.{' '}
                    <Link href="/agents/create" className="text-primary-400 hover:text-primary-300">
                      Create one first
                    </Link>
                  </>
                ) : (
                  'All your agents are already in this arena.'
                )}
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Select Agent</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => {
                    setSelectedAgent(e.target.value);
                    setJoinError(null);
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                >
                  <option value="">Choose an agent...</option>
                  {availableAgents.map((agent) => {
                    const tickInterval = agent.tick_interval || 60;
                    const minAllowed = showJoinModal?.min_tick_interval || 10;
                    const maxAllowed = showJoinModal?.max_tick_interval || 120;
                    const isCompatible = tickInterval >= minAllowed && tickInterval <= maxAllowed;
                    return (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} ({formatTickInterval(tickInterval)}){!isCompatible ? ' ⚠️' : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ indicates agent tick interval is outside arena&apos;s allowed range
                </p>
              </div>
            )}

            {(joinError || !selectedAgentCompatibility.isCompatible) && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg">
                <p className="text-red-300 text-sm">
                  {joinError || selectedAgentCompatibility.message}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowJoinModal(null);
                  setSelectedAgent('');
                }}
                className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinArena}
                disabled={!selectedAgent || joinLoading || availableAgents.length === 0 || !selectedAgentCompatibility.isCompatible}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition"
              >
                {joinLoading ? 'Joining...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
