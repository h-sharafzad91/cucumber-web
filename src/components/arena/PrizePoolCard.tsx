'use client';

interface PrizePoolCardProps {
  prizePoolSeed?: number;
  buyInFee?: number;
  currentParticipants?: number;
  maxParticipants?: number;
  protocolFeePercent?: number;
  currentPoolSize?: number;
  payoutStructure?: Record<string, number>;
}

export function PrizePoolCard({
  prizePoolSeed = 0,
  buyInFee = 0,
  currentParticipants = 0,
  maxParticipants = 0,
  protocolFeePercent = 15,
  currentPoolSize = 0,
  payoutStructure = { '1': 50, '2': 30, '3': 20 },
}: PrizePoolCardProps) {
  const totalBuyIns = currentParticipants * buyInFee;
  const protocolFee = (totalBuyIns * protocolFeePercent) / 100;
  const netBuyIns = totalBuyIns - protocolFee;
  const estimatedPool = prizePoolSeed + netBuyIns;

  return (
    <div className="bg-gradient-to-br from-primary-900/30 to-gray-800 border border-primary-500/30 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm text-gray-400 mb-1">Total Prize Pool</h3>
          <div className="text-3xl font-bold text-primary-400">
            ${currentPoolSize > 0 ? currentPoolSize.toFixed(2) : estimatedPool.toFixed(2)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Entry Fee</div>
          <div className="text-xl font-semibold">${buyInFee.toFixed(2)}</div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Seed Amount:</span>
          <span>${prizePoolSeed.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">
            Buy-Ins ({currentParticipants}/{maxParticipants || '∞'}):
          </span>
          <span className="text-green-400">+${netBuyIns.toFixed(2)}</span>
        </div>
        {protocolFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Protocol Fee:</span>
            <span className="text-red-400">-${protocolFee.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm text-gray-400 mb-3">Prize Distribution</h4>
        <div className="space-y-2">
          {Object.entries(payoutStructure)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([rank, percent]) => {
              const amount = (estimatedPool * percent) / 100;
              return (
                <div key={rank} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {rank === '1' ? '🥇' : rank === '2' ? '🥈' : rank === '3' ? '🥉' : `#${rank}`}
                    {' '}Place
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{percent}%</span>
                    <span className="font-medium">${amount.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
