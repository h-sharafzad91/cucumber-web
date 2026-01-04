'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Participant {
  agent_id: string;
  agent_name: string;
}

interface BettingPanelProps {
  roundId: string;
  participants: Participant[];
}

export function BettingPanel({ roundId, participants }: BettingPanelProps) {
  const { address } = useWallet();
  const [odds, setOdds] = useState<Record<string, number>>({});
  const [selectedAgent, setSelectedAgent] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [myBets, setMyBets] = useState<any[]>([]);

  useEffect(() => {
    fetchOdds();
    if (address) fetchMyBets();
  }, [roundId, address]);

  async function fetchOdds() {
    try {
      const res = await fetch(`${API_URL}/v1/betting/${roundId}/odds`);
      const data = await res.json();
      setOdds(data.odds || {});
    } catch (err) {
      console.error('Failed to fetch odds:', err);
    }
  }

  async function fetchMyBets() {
    if (!address) return;
    try {
      const res = await fetch(`${API_URL}/v1/betting/my-bets?user_id=${address}&round_id=${roundId}`);
      const data = await res.json();
      setMyBets(data.bets || []);
    } catch (err) {
      console.error('Failed to fetch bets:', err);
    }
  }

  async function handlePlaceBet() {
    if (!selectedAgent || !amount || !address) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/betting/${roundId}/bet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: address,
          agent_id: selectedAgent,
          amount: parseFloat(amount),
        }),
      });
      const data = await res.json();
      if (data.bet) {
        setAmount('');
        setSelectedAgent('');
        fetchMyBets();
        fetchOdds();
      }
    } catch (err) {
      console.error('Failed to place bet:', err);
    } finally {
      setLoading(false);
    }
  }

  const potentialPayout = selectedAgent && amount
    ? (parseFloat(amount) * (odds[selectedAgent] || 2)).toFixed(2)
    : '0.00';

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4">
      <h3 className="font-semibold">Spectator Betting</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Pick Winner</label>
          <div className="grid grid-cols-2 gap-2">
            {participants.map(p => (
              <button
                key={p.agent_id}
                onClick={() => setSelectedAgent(p.agent_id)}
                className={`p-2 rounded text-sm border transition ${
                  selectedAgent === p.agent_id
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="font-medium truncate">{p.agent_name}</div>
                <div className="text-xs text-primary-400">
                  {(odds[p.agent_id] || 2).toFixed(2)}x
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Amount ($)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="10"
            min="1"
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
          />
        </div>

        {selectedAgent && amount && (
          <div className="bg-gray-700/50 rounded p-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Potential Win:</span>
              <span className="text-green-400 font-medium">${potentialPayout}</span>
            </div>
          </div>
        )}

        <button
          onClick={handlePlaceBet}
          disabled={!selectedAgent || !amount || loading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 px-3 py-2 rounded text-sm font-medium transition"
        >
          {loading ? 'Placing...' : 'Place Bet'}
        </button>
      </div>

      {myBets.length > 0 && (
        <div className="border-t border-gray-700 pt-3">
          <h4 className="text-sm font-medium mb-2">Your Bets</h4>
          <div className="space-y-2">
            {myBets.map(bet => {
              const agent = participants.find(p => p.agent_id === bet.agent_id);
              return (
                <div key={bet.id} className="flex justify-between text-sm">
                  <span className="text-gray-400">{agent?.agent_name || 'Unknown'}</span>
                  <span className={
                    bet.status === 'won' ? 'text-green-400' :
                    bet.status === 'lost' ? 'text-red-400' :
                    'text-yellow-400'
                  }>
                    ${bet.amount} → ${bet.potential_payout.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
