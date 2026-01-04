'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAgents } from '@/lib/api';
import { useWallet } from '@/hooks/useWallet';
import { useWebSocket } from '@/hooks/useWebSocket';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type EntryFee = 1 | 5 | 10;

interface Agent {
  id: string;
  name: string;
}

export default function ContestPage() {
  const router = useRouter();
  const { address } = useWallet();
  const { socket } = useWebSocket();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedFee, setSelectedFee] = useState<EntryFee>(5);
  const [inQueue, setInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      getAgents(address).then(res => setAgents(res.agents));
    }
  }, [address]);

  useEffect(() => {
    if (socket && address) {
      socket.emit('subscribe:user', address);

      socket.on('match_found', (data: { roundId: string }) => {
        router.push(`/arena/${data.roundId}`);
      });

      socket.on('queue_update', (data: { position: number }) => {
        setQueuePosition(data.position);
      });

      return () => {
        socket.emit('unsubscribe:user', address);
        socket.off('match_found');
        socket.off('queue_update');
      };
    }
  }, [socket, address, router]);

  async function handleJoinQueue() {
    if (!selectedAgent || !address) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/matchmaking/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgent,
          user_id: address,
          entry_fee: selectedFee,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInQueue(true);
        setQueuePosition(data.position);
      }
    } catch (err) {
      console.error('Failed to join queue:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLeaveQueue() {
    setLoading(true);
    try {
      await fetch(`${API_URL}/v1/matchmaking/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgent,
          entry_fee: selectedFee,
        }),
      });
      setInQueue(false);
      setQueuePosition(0);
    } catch (err) {
      console.error('Failed to leave queue:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Quick Contest</h1>
        <p className="text-gray-400">
          Fast 2-minute matches with 2-5 players
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Entry Fee</label>
          <div className="grid grid-cols-3 gap-3">
            {([1, 5, 10] as EntryFee[]).map(fee => (
              <button
                key={fee}
                onClick={() => !inQueue && setSelectedFee(fee)}
                disabled={inQueue}
                className={`p-4 rounded-lg border-2 text-center transition ${
                  selectedFee === fee
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                } ${inQueue ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-2xl font-bold">${fee}</div>
                <div className="text-xs text-gray-400">Entry</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Select Agent</label>
          <select
            value={selectedAgent}
            onChange={e => setSelectedAgent(e.target.value)}
            disabled={inQueue}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 disabled:opacity-50"
          >
            <option value="">Choose an agent...</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        {inQueue ? (
          <div className="space-y-4">
            <div className="bg-primary-900/20 border border-primary-500/30 rounded-lg p-6 text-center">
              <div className="text-lg mb-2">Searching for opponents...</div>
              <div className="text-3xl font-bold text-primary-400 mb-2">
                Position #{queuePosition}
              </div>
              <div className="text-sm text-gray-400">
                Match starts when 2+ players are ready
              </div>
            </div>
            <button
              onClick={handleLeaveQueue}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-3 rounded-lg font-medium transition"
            >
              {loading ? 'Leaving...' : 'Leave Queue'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleJoinQueue}
            disabled={!selectedAgent || loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition"
          >
            {loading ? 'Joining...' : 'Find Match'}
          </button>
        )}
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="font-medium mb-2">How it works</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Select your entry fee and agent</li>
          <li>• Join the matchmaking queue</li>
          <li>• Match starts with 2-5 players (max 30s wait)</li>
          <li>• Contest lasts 2 minutes</li>
          <li>• Winner takes 70%, 2nd place gets 30%</li>
        </ul>
      </div>
    </div>
  );
}
