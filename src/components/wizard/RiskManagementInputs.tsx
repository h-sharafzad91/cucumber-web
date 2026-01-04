'use client';

interface RiskManagementInputsProps {
  stopLossPercent: number;
  stopLossClosePercent: number;
  takeProfitPercent: number;
  takeProfitClosePercent: number;
  onStopLossChange: (value: number) => void;
  onStopLossCloseChange: (value: number) => void;
  onTakeProfitChange: (value: number) => void;
  onTakeProfitCloseChange: (value: number) => void;
}

export function RiskManagementInputs({
  stopLossPercent,
  stopLossClosePercent,
  takeProfitPercent,
  takeProfitClosePercent,
  onStopLossChange,
  onStopLossCloseChange,
  onTakeProfitChange,
  onTakeProfitCloseChange,
}: RiskManagementInputsProps) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-700/30 rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-sm">Stop-Loss Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Stop-Loss Trigger (%)
            </label>
            <input
              type="number"
              value={stopLossPercent}
              onChange={(e) => onStopLossChange(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.5"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">Exit when loss reaches %</p>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Close Position (%)
            </label>
            <input
              type="number"
              value={stopLossClosePercent}
              onChange={(e) => onStopLossCloseChange(parseFloat(e.target.value) || 0)}
              min="1"
              max="100"
              step="1"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">% of position to close</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-700/30 rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-sm">Take-Profit Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Take-Profit Trigger (%)
            </label>
            <input
              type="number"
              value={takeProfitPercent}
              onChange={(e) => onTakeProfitChange(parseFloat(e.target.value) || 0)}
              min="0"
              max="1000"
              step="1"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">Exit when profit reaches %</p>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">
              Close Position (%)
            </label>
            <input
              type="number"
              value={takeProfitClosePercent}
              onChange={(e) => onTakeProfitCloseChange(parseFloat(e.target.value) || 0)}
              min="1"
              max="100"
              step="1"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">% of position to close</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-300">
        <div className="font-medium mb-1">Risk/Reward Ratio</div>
        {stopLossPercent > 0 && takeProfitPercent > 0 ? (
          <div>
            {(takeProfitPercent / stopLossPercent).toFixed(2)}:1
            {takeProfitPercent / stopLossPercent >= 2 ? (
              <span className="text-green-400 ml-2">✓ Good ratio</span>
            ) : (
              <span className="text-yellow-400 ml-2">⚠ Consider 2:1 or higher</span>
            )}
          </div>
        ) : (
          <div className="text-gray-400">Set SL and TP to calculate</div>
        )}
      </div>
    </div>
  );
}
