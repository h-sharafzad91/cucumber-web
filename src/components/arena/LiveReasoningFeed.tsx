'use client';

import { useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useArenaStore } from '@/stores/arena-store';

interface LiveReasoningFeedProps {
  roundId: string;
  maxItems?: number;
  agentId?: string | null;
  userAgentIds?: string[];
}

export function LiveReasoningFeed({
  roundId,
  maxItems = 10,
  agentId = null,
  userAgentIds = []
}: LiveReasoningFeedProps) {
  const reasoning = useArenaStore((state) => {
    const allReasoning = state.reasonings;
    const filtered = agentId
      ? allReasoning.filter((r) => r.agent_id === agentId)
      : userAgentIds.length > 0
        ? allReasoning.filter((r) => userAgentIds.includes(r.agent_id))
        : allReasoning;
    return filtered.slice(0, maxItems);
  });

  const handleReasoningUpdate = useCallback(() => {}, []);

  const { isConnected } = useWebSocket({
    roundId,
    onReasoning: handleReasoningUpdate,
  });

  function getActionColor(action: string) {
    if (action === 'BUY') return 'text-green-400';
    if (action === 'SELL') return 'text-red-400';
    return 'text-gray-400';
  }

  function getActionIcon(action: string) {
    if (action === 'BUY') return '📈';
    if (action === 'SELL') return '📉';
    return '⏸️';
  }

  return (
    <div className="bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold">
          {agentId ? 'Agent Thoughts (Selected)' : 'Agent Thoughts (Your Agents)'}
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
        {reasoning.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Waiting for agent decisions...
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {reasoning.map((item, index) => (
              <div key={`${item.agent_id}-${item.timestamp}-${index}`} className="p-4">
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-2xl">{getActionIcon(item.action)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{item.agent_name || 'Agent'}</span>
                      <span className={`font-semibold ${getActionColor(item.action)}`}>
                        {item.action}
                      </span>
                      {item.asset && (
                        <span className="text-xs text-gray-500">{item.asset}</span>
                      )}
                      {item.size_usd && (
                        <span className="text-xs text-gray-500">
                          ${item.size_usd.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {item.reasoning}
                    </p>
                    {item.timestamp && (
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
