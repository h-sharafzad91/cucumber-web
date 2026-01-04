'use client';

interface LeverageSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function LeverageSlider({ value, onChange }: LeverageSliderProps) {
  function getLeverageColor(leverage: number) {
    if (leverage <= 5) return 'text-green-400';
    if (leverage <= 10) return 'text-yellow-400';
    if (leverage <= 20) return 'text-orange-400';
    return 'text-red-400';
  }

  function getLeverageRisk(leverage: number) {
    if (leverage <= 5) return 'Low Risk';
    if (leverage <= 10) return 'Moderate Risk';
    if (leverage <= 20) return 'High Risk';
    return 'Very High Risk';
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-400">Leverage</label>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${getLeverageColor(value)}`}>
            {value}x
          </span>
          <span className="text-xs text-gray-500">{getLeverageRisk(value)}</span>
        </div>
      </div>
      <input
        type="range"
        min="1"
        max="50"
        step="1"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>1x (Spot)</span>
        <span>25x</span>
        <span>50x (Max)</span>
      </div>
      <div className="bg-gray-700/50 rounded p-3 text-xs text-gray-400">
        <span className="font-medium">Note:</span> Higher leverage multiplies both gains and
        losses. A {value}x position can be liquidated with a{' '}
        {(100 / value).toFixed(1)}% price move against you.
      </div>
    </div>
  );
}
