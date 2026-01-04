'use client';

import { cn } from '@/lib/utils';

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'xai';

export type LLMModel =
  | 'gpt-4o-mini'
  | 'gpt-4o'
  | 'claude-sonnet-4-20250514'
  | 'claude-3-5-sonnet-20241022'
  | 'gemini-2.0-flash'
  | 'gemini-1.5-pro'
  | 'grok-3'
  | 'grok-3-fast';

interface LLMModelSelectorProps {
  value: LLMModel;
  onChange: (model: LLMModel) => void;
}

interface ModelConfig {
  value: LLMModel;
  label: string;
  desc: string;
  provider: string;
  inputPricePerM: number;
  outputPricePerM: number;
  isFree?: boolean;
  freeLimit?: string;
}

const TOKENS_PER_TICK = {
  input: 200,
  output: 120,
};

const TICKS_PER_HOUR = 60;

function calculateHourlyCost(model: ModelConfig): number {
  const inputTokensPerHour = TOKENS_PER_TICK.input * TICKS_PER_HOUR;
  const outputTokensPerHour = TOKENS_PER_TICK.output * TICKS_PER_HOUR;

  const inputCost = (inputTokensPerHour / 1_000_000) * model.inputPricePerM;
  const outputCost = (outputTokensPerHour / 1_000_000) * model.outputPricePerM;

  return inputCost + outputCost;
}

function formatCost(hourlyCost: number): string {
  if (hourlyCost < 0.01) {
    return `$${(hourlyCost * 24).toFixed(2)}/day`;
  }
  return `$${hourlyCost.toFixed(2)}/hr`;
}

const models: ModelConfig[] = [
  {
    value: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    desc: 'Cheapest option, free tier available',
    provider: 'Google',
    inputPricePerM: 0.10,
    outputPricePerM: 0.40,
    isFree: true,
    freeLimit: '15 RPM',
  },
  {
    value: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    desc: 'Best value for performance',
    provider: 'OpenAI',
    inputPricePerM: 0.15,
    outputPricePerM: 0.60,
  },
  {
    value: 'gpt-4o',
    label: 'GPT-4o',
    desc: 'Most capable OpenAI model',
    provider: 'OpenAI',
    inputPricePerM: 2.50,
    outputPricePerM: 10.00,
  },
  {
    value: 'claude-sonnet-4-20250514',
    label: 'Claude Sonnet 4',
    desc: 'Best reasoning & analysis',
    provider: 'Anthropic',
    inputPricePerM: 3.00,
    outputPricePerM: 15.00,
  },
  {
    value: 'grok-3',
    label: 'Grok 3',
    desc: 'Real-time market insights',
    provider: 'xAI',
    inputPricePerM: 3.00,
    outputPricePerM: 15.00,
  },
  {
    value: 'grok-3-fast',
    label: 'Grok 3 Fast',
    desc: 'Quick responses',
    provider: 'xAI',
    inputPricePerM: 3.00,
    outputPricePerM: 15.00,
  },
];

export function LLMModelSelector({ value, onChange }: LLMModelSelectorProps) {
  const selectedModel = models.find((m) => m.value === value);
  const selectedCost = selectedModel ? calculateHourlyCost(selectedModel) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm text-gray-400">
          AI Model
        </label>
        <div className="text-xs text-gray-500">
          Cost based on 60 ticks/hour (~320 tokens/tick)
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {models.map((model) => {
          const hourlyCost = calculateHourlyCost(model);
          const costDisplay = formatCost(hourlyCost);

          return (
            <button
              key={model.value}
              type="button"
              onClick={() => onChange(model.value)}
              className={cn(
                'p-4 rounded-lg border-2 text-left transition relative',
                value === model.value
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              )}
            >
              {model.isFree && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  FREE TIER
                </span>
              )}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{model.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{model.desc}</div>
                </div>
                <div className="text-right ml-2">
                  <div className="text-xs text-gray-500">{model.provider}</div>
                  <div className={cn(
                    'text-xs font-medium mt-1',
                    model.isFree ? 'text-green-400' : 'text-yellow-400'
                  )}>
                    {model.isFree ? model.freeLimit : costDisplay}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedModel && (
        <div className="bg-gray-800/50 rounded-lg p-4 mt-4">
          <div className="text-sm font-medium mb-2">Estimated Cost for {selectedModel.label}</div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary-400">
                {selectedModel.isFree ? 'Free' : `$${selectedCost.toFixed(3)}`}
              </div>
              <div className="text-xs text-gray-500">Per Hour</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary-400">
                {selectedModel.isFree ? 'Free' : `$${(selectedCost * 24).toFixed(2)}`}
              </div>
              <div className="text-xs text-gray-500">Per Day</div>
            </div>
            <div>
              <div className="text-lg font-bold text-primary-400">
                {selectedModel.isFree ? 'Free' : `$${(selectedCost * 24 * 30).toFixed(2)}`}
              </div>
              <div className="text-xs text-gray-500">Per Month</div>
            </div>
          </div>
          {selectedModel.isFree && (
            <div className="text-xs text-green-400 mt-2 text-center">
              Free tier: {selectedModel.freeLimit} (rate limited)
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2 text-center">
            Based on ~200 input + ~120 output tokens per tick
          </div>
        </div>
      )}
    </div>
  );
}
