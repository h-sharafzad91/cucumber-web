'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { summarizeStrategy } from '@/lib/api';
import { LLMModelSelector, type LLMModel } from './LLMModelSelector';
import { LeverageSlider } from './LeverageSlider';
import { RiskManagementInputs } from './RiskManagementInputs';
import { TradingStyleSelector } from './TradingStyleSelector';
import { AvatarPicker } from './AvatarPicker';

type TradingStyle = 'paper_hands' | 'normal' | 'degen';

interface AgentWizardExtendedProps {
  onSubmit: (data: {
    name: string;
    persona_config: {
      strategy: 'momentum' | 'mean_reversion' | 'breakout' | 'custom';
      risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
      goal?: string;
      description?: string;
    };
    worker_config?: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    };
    llm_model: LLMModel;
    trading_style: TradingStyle;
    tick_interval: number;
    leverage: number;
    stop_loss_percent: number;
    stop_loss_position_close_percent: number;
    take_profit_percent: number;
    take_profit_position_close_percent: number;
    avatar_id: string;
  }) => void;
  loading?: boolean;
}

export function AgentWizardExtended({ onSubmit, loading }: AgentWizardExtendedProps) {
  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState('robot');

  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [strategy, setStrategy] = useState<'momentum' | 'mean_reversion' | 'breakout' | 'custom'>('momentum');

  const [llmModel, setLlmModel] = useState<LLMModel>('claude-sonnet-4-20250514');
  const [tradingStyle, setTradingStyle] = useState<TradingStyle>('normal');
  const [leverage, setLeverage] = useState(1);
  const [stopLossPercent, setStopLossPercent] = useState(5);
  const [stopLossClosePercent, setStopLossClosePercent] = useState(100);
  const [takeProfitPercent, setTakeProfitPercent] = useState(10);
  const [takeProfitClosePercent, setTakeProfitClosePercent] = useState(50);
  const [tickInterval, setTickInterval] = useState(300);

  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  const [psychCheck, setPsychCheck] = useState<string[]>([]);
  const [loadingPsychCheck, setLoadingPsychCheck] = useState(false);

  useEffect(() => {
    if (step === 4) {
      fetchPsychCheck();
    }
  }, [step]);

  async function fetchPsychCheck() {
    setLoadingPsychCheck(true);
    try {
      const res = await summarizeStrategy({
        name,
        strategy,
        risk_tolerance: riskTolerance,
        trading_style: tradingStyle,
        leverage,
        stop_loss_percent: stopLossPercent,
        take_profit_percent: takeProfitPercent,
        goal: goal || undefined,
      });
      setPsychCheck(res.summary);
    } catch (err) {
      console.error('Failed to get psych check:', err);
    } finally {
      setLoadingPsychCheck(false);
    }
  }

  const strategies = [
    { value: 'momentum' as const, label: 'Momentum', desc: 'Follow price trends' },
    { value: 'mean_reversion' as const, label: 'Mean Reversion', desc: 'Trade price corrections' },
    { value: 'breakout' as const, label: 'Breakout', desc: 'Trade on price breakouts' },
    { value: 'custom' as const, label: 'Custom', desc: 'Custom strategy' },
  ];

  function handleSubmit() {
    onSubmit({
      name,
      persona_config: {
        strategy,
        risk_tolerance: riskTolerance,
        goal: goal || undefined,
        description: description || undefined,
      },
      llm_model: llmModel,
      trading_style: tradingStyle,
      tick_interval: tickInterval,
      leverage,
      stop_loss_percent: stopLossPercent,
      stop_loss_position_close_percent: stopLossClosePercent,
      take_profit_percent: takeProfitPercent,
      take_profit_position_close_percent: takeProfitClosePercent,
      avatar_id: avatarId,
    });
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={cn(
              'h-2 flex-1 rounded',
              s <= step ? 'bg-primary-500' : 'bg-gray-700'
            )}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Identity & Appearance</h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., TrendFollower, RiskTaker"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
          />
          <AvatarPicker value={avatarId} onChange={setAvatarId} />
          <button
            onClick={() => setStep(2)}
            disabled={!name.trim()}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Risk & Strategy</h2>
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
                  <div className="text-xs text-gray-400 mt-1">
                    {level === 'conservative'
                      ? 'Safer trades'
                      : level === 'moderate'
                      ? 'Balanced'
                      : 'Higher risk'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Trading Strategy</h2>
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

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg font-medium transition"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-primary-600 hover:bg-primary-700 px-4 py-3 rounded-lg font-medium transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Advanced Risk Management</h2>

          <LLMModelSelector value={llmModel} onChange={setLlmModel} />

          <TradingStyleSelector value={tradingStyle} onChange={setTradingStyle} />

          <LeverageSlider value={leverage} onChange={setLeverage} />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tick Interval (seconds)</span>
            </div>
            <input
              type="number"
              min={300}
              value={tickInterval}
              onChange={(e) => setTickInterval(Math.max(300, Number(e.target.value)))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
            />
            <div className="grid grid-cols-5 gap-2">
              {[300, 600, 900, 1800, 3600].map((val) => (
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
                  {val >= 3600 ? `${val / 3600}h` : val >= 60 ? `${val / 60}m` : `${val}s`}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              How often your agent receives market data. Arenas may restrict allowed intervals.
            </p>
          </div>

          <RiskManagementInputs
            stopLossPercent={stopLossPercent}
            stopLossClosePercent={stopLossClosePercent}
            takeProfitPercent={takeProfitPercent}
            takeProfitClosePercent={takeProfitClosePercent}
            onStopLossChange={setStopLossPercent}
            onStopLossCloseChange={setStopLossClosePercent}
            onTakeProfitChange={setTakeProfitPercent}
            onTakeProfitCloseChange={setTakeProfitClosePercent}
          />

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg font-medium transition"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 bg-primary-600 hover:bg-primary-700 px-4 py-3 rounded-lg font-medium transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Agent Goal & Instructions</h2>
            <p className="text-sm text-gray-400 mb-2">
              What should your agent try to achieve?
            </p>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Maximize returns, Steady growth, Capital preservation..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">Custom Instructions (optional)</h2>
            <p className="text-sm text-gray-400 mb-2">
              Add custom instructions for your agent's trading behavior
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Focus on ETH momentum signals. Be cautious during high volatility..."
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>

          <div className="bg-primary-900/20 border border-primary-500/30 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-primary-300">Psych Check</h3>
            {loadingPsychCheck ? (
              <div className="text-sm text-gray-400">Analyzing strategy...</div>
            ) : (
              <ul className="text-sm space-y-1">
                {psychCheck.map((point, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary-400">•</span>
                    <span className="text-gray-300">{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium">Agent Summary</h3>
            <div className="text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Name:</span>
                <span>{name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">LLM Model:</span>
                <span>{llmModel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Strategy:</span>
                <span className="capitalize">{strategy.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Risk Tolerance:</span>
                <span className="capitalize">{riskTolerance}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Trading Style:</span>
                <span className="capitalize">{tradingStyle.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Tick Interval:</span>
                <span className="text-blue-400">{tickInterval}s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Leverage:</span>
                <span className="text-yellow-400">{leverage}x</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Stop-Loss:</span>
                <span className="text-red-400">{stopLossPercent}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Take-Profit:</span>
                <span className="text-green-400">{takeProfitPercent}%</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg font-medium transition"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition"
            >
              {loading ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
