'use client';

import { useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useArenaStore } from '@/stores/arena-store';

interface LiveTradeFeedProps {
  roundId: string;
  maxItems?: number;
  agentId?: string | null;
  userAgentIds?: string[];
}

export function LiveTradeFeed({
  roundId,
  maxItems = 20,
  agentId = null,
  userAgentIds = []
}: LiveTradeFeedProps) {
  const trades = useArenaStore((state) => {
    const allTrades = state.trades;
    const filtered = agentId
      ? allTrades.filter((t) => t.agent_id === agentId)
      : userAgentIds.length > 0
        ? allTrades.filter((t) => userAgentIds.includes(t.agent_id))
        : allTrades;
    return filtered.slice(0, maxItems);
  });

  const handleTradeUpdate = useCallback(() => {}, []);

  const { isConnected } = useWebSocket({
    roundId,
    onTrade: handleTradeUpdate,
  });

  function getTradeColor(action: string) {
    if (action === 'BUY_MARKET') return 'text-green-400';
    if (action === 'SELL_MARKET') return 'text-red-400';
    return 'text-gray-400';
  }

  return (
    <div className="bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold">
          {agentId ? 'Live Trades (Selected)' : 'Live Trades (Your Agents)'}
        </h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
            }`}
          />
          <span className="text-xs text-gray-400">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {trades.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Waiting for trades...
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {trades.map((trade, index) => (
              <div key={trade.id || `trade-${trade.agent_id}-${trade.created_at}-${index}`} className="p-4 hover:bg-gray-750 transition">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-300">{trade.agent_id.slice(0, 8)}...</span>
                      <span className={`font-semibold ${getTradeColor(trade.action)}`}>
                        {trade.action}
                      </span>
                      {trade.asset && <span className="text-gray-400">{trade.asset}</span>}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {trade.size_usd > 0 && `$${trade.size_usd.toFixed(2)}`}
                      {trade.execution_price > 0 && ` @ $${trade.execution_price.toFixed(2)}`}
                      {trade.size_usd === 0 && 'No position change'}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    trade.status === 'confirmed' ? 'bg-green-900/30 text-green-300' :
                    trade.status === 'failed' ? 'bg-red-900/30 text-red-300' :
                    'bg-yellow-900/30 text-yellow-300'
                  }`}>
                    {trade.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(trade.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
