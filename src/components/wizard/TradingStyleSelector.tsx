'use client';

import { cn } from '@/lib/utils';

type TradingStyle = 'paper_hands' | 'normal' | 'degen';

interface TradingStyleSelectorProps {
  value: TradingStyle;
  onChange: (style: TradingStyle) => void;
}

const styles: { value: TradingStyle; label: string; desc: string; emoji: string }[] = [
  {
    value: 'paper_hands',
    label: 'Paper Hands',
    desc: 'Quick exits, minimize losses',
    emoji: '📄',
  },
  {
    value: 'normal',
    label: 'Normal',
    desc: 'Balanced risk management',
    emoji: '⚖️',
  },
  {
    value: 'degen',
    label: 'Degen',
    desc: 'Hold positions longer, higher risk',
    emoji: '🚀',
  },
];

export function TradingStyleSelector({ value, onChange }: TradingStyleSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm text-gray-400 mb-2">Trading Style</label>
      <div className="grid grid-cols-3 gap-3">
        {styles.map((style) => (
          <button
            key={style.value}
            type="button"
            onClick={() => onChange(style.value)}
            className={cn(
              'p-4 rounded-lg border-2 text-center transition',
              value === style.value
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-gray-700 hover:border-gray-600'
            )}
          >
            <div className="text-2xl mb-1">{style.emoji}</div>
            <div className="font-medium text-sm">{style.label}</div>
            <div className="text-xs text-gray-400 mt-1">{style.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
