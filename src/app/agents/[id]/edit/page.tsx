'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAgent, updateAgent } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Agent } from '@/types';

type TradingStyle = 'paper_hands' | 'normal' | 'degen';

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

export default function EditAgentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState('');
  const [strategy, setStrategy] = useState<'momentum' | 'mean_reversion' | 'breakout' | 'custom'>('momentum');
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [tradingStyle, setTradingStyle] = useState<TradingStyle>('normal');
  const [leverage, setLeverage] = useState(1);
  const [stopLossPercent, setStopLossPercent] = useState(5);
  const [stopLossClosePercent, setStopLossClosePercent] = useState(100);
  const [takeProfitPercent, setTakeProfitPercent] = useState(10);
  const [takeProfitClosePercent, setTakeProfitClosePercent] = useState(50);
  const [tickInterval, setTickInterval] = useState(60);
  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchAgent();
  }, [params.id]);

  async function fetchAgent() {
    try {
      const res = await getAgent(params.id);
      const a = res.agent;
      setAgent(a);

      // Populate form with existing values
      setName(a.name || '');
      setStrategy(a.persona_config?.strategy || 'momentum');
      setRiskTolerance(a.persona_config?.risk_tolerance || 'moderate');
      setTradingStyle(a.trading_style || 'normal');
      setLeverage(a.leverage || 1);
      setStopLossPercent(a.stop_loss_percent || 5);
      setStopLossClosePercent(a.stop_loss_position_close_percent || 100);
      setTakeProfitPercent(a.take_profit_percent || 10);
      setTakeProfitClosePercent(a.take_profit_position_close_percent || 50);
      setTickInterval(a.tick_interval || 60);
      setGoal(a.persona_config?.goal || '');
      setDescription(a.persona_config?.description || '');
    } catch (err) {
      console.error('Failed to fetch agent:', err);
      setError('Failed to load agent');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agent) return;

    setSaving(true);
    setError(null);

    try {
      await updateAgent(agent.id, {
        name,
        tick_interval: tickInterval,
        leverage,
        stop_loss_percent: stopLossPercent,
        stop_loss_position_close_percent: stopLossClosePercent,
        take_profit_percent: takeProfitPercent,
        take_profit_position_close_percent: takeProfitClosePercent,
        trading_style: tradingStyle,
        persona_config: {
          strategy,
          risk_tolerance: riskTolerance,
          goal: goal || undefined,
          description: description || undefined,
        },
      });
      router.push(`/agents/${agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agent');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading agent...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-gray-400 mb-4">Agent not found</div>
        <Link href="/agents" className="text-primary-400 hover:text-primary-300">
          Back to Agents
        </Link>
      </div>
    );
  }

  const strategies = [
    { value: 'momentum' as const, label: 'Momentum', desc: 'Follow price trends' },
    { value: 'mean_reversion' as const, label: 'Mean Reversion', desc: 'Trade price corrections' },
    { value: 'breakout' as const, label: 'Breakout', desc: 'Trade on price breakouts' },
    { value: 'custom' as const, label: 'Custom', desc: 'Custom strategy' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={`/agents/${agent.id}`}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
      >
        <span>&larr;</span> Back to Agent
      </Link>

      <div>
        <h1 className="text-2xl font-bold mb-2">Edit Agent: {agent.name}</h1>
        <p className="text-gray-400">
          Update your agent's configuration and trading parameters
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              required
            />
          </div>
        </div>

        {/* Strategy */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Strategy & Style</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Trading Strategy</label>
            <div className="grid grid-cols-2 gap-3">
              {strategies.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStrategy(s.value)}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition',
                    strategy === s.value
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  )}
                >
                  <div className="font-medium">{s.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Risk Tolerance</label>
            <div className="grid grid-cols-3 gap-3">
              {(['conservative', 'moderate', 'aggressive'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setRiskTolerance(level)}
                  className={cn(
                    'p-4 rounded-lg border-2 text-center transition',
                    riskTolerance === level
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  )}
                >
                  <div className="font-medium capitalize">{level}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Trading Style</label>
            <div className="grid grid-cols-3 gap-3">
              {(['paper_hands', 'normal', 'degen'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setTradingStyle(style)}
                  className={cn(
                    'p-4 rounded-lg border-2 text-center transition',
                    tradingStyle === style
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  )}
                >
                  <div className="font-medium capitalize">{style.replace('_', ' ')}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Management */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Risk Management</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Tick Interval</label>
            <input
              type="number"
              min={1}
              value={tickInterval}
              onChange={(e) => setTickInterval(Math.max(1, Number(e.target.value)))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
            />
            <div className="grid grid-cols-5 gap-2 mt-2">
              {[30, 60, 300, 600, 3600].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTickInterval(val)}
                  className={cn(
                    'px-2 py-1 text-xs rounded transition',
                    tickInterval === val
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-700 hover:bg-gray-600'
                  )}
                >
                  {formatTickInterval(val)}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">How often your agent receives market data</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Leverage</label>
              <input
                type="number"
                min={1}
                max={100}
                value={leverage}
                onChange={(e) => setLeverage(Math.max(1, Number(e.target.value)))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Stop Loss %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={stopLossPercent}
                onChange={(e) => setStopLossPercent(Number(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Close % on Stop Loss</label>
              <input
                type="number"
                min={0}
                max={100}
                value={stopLossClosePercent}
                onChange={(e) => setStopLossClosePercent(Number(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Take Profit %</label>
              <input
                type="number"
                min={0}
                max={1000}
                value={takeProfitPercent}
                onChange={(e) => setTakeProfitPercent(Number(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Close % on Take Profit</label>
              <input
                type="number"
                min={0}
                max={100}
                value={takeProfitClosePercent}
                onChange={(e) => setTakeProfitClosePercent(Number(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Goal & Instructions */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Goal & Instructions</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Agent Goal</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Maximize returns, Steady growth..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Custom Instructions (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add custom instructions for your agent's behavior..."
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href={`/agents/${agent.id}`}
            className="flex-1 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium transition text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
