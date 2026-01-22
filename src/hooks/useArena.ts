"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getRound,
  getParticipants,
  getTrades,
  getLeaderboard,
  getAllReasoning,
  getMarketPrice,
} from "@/lib/api";
import { useArenaStore } from "@/stores/arena-store";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { RoundParticipant } from "@/types";

export function useArena(roundId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    setRound,
    setParticipants,
    setTrades,
    setLeaderboard,
    setReasonings,
    setTickData,
    updateParticipant,
  } = useArenaStore();

  // Connect to WebSocket for live updates
  const { isConnected } = useWebSocket({
    roundId,
    onLeaderboard: (data) => {
      // Also update participants with PnL from leaderboard
      if (data.rankings) {
        data.rankings.forEach((entry) => {
          updateParticipant(entry.agent_id, {
            total_pnl: entry.total_pnl,
          });
        });
      }
    },
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch round first to get trading pair
      const roundRes = await getRound(roundId);
      setRound(roundRes.round);
      const tradingPair = roundRes.round?.trading_pair || 'BTC/USDT';

      // Now fetch remaining data with correct trading pair
      const [participantsRes, tradesRes, leaderboardRes, priceRes] =
        await Promise.all([
          getParticipants(roundId),
          getTrades(roundId),
          getLeaderboard(roundId),
          getMarketPrice(tradingPair),
        ]);

      setParticipants(participantsRes.participants);
      setTrades(tradesRes.trades);
      setLeaderboard(leaderboardRes.leaderboard);

      setTickData(priceRes.price, 0);

      if (participantsRes.participants.length > 0) {
        const agentIds = participantsRes.participants.map((p: RoundParticipant) => p.agent_id);
        const reasoningRes = await getAllReasoning(roundId, agentIds);
        setReasonings(reasoningRes.reasoning);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load arena");
    } finally {
      setLoading(false);
    }
  }, [roundId, setRound, setParticipants, setTrades, setLeaderboard, setTickData, setReasonings]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll for participants data every 15 seconds as backup for PnL updates
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const [participantsRes, leaderboardRes] = await Promise.all([
          getParticipants(roundId),
          getLeaderboard(roundId),
        ]);
        setParticipants(participantsRes.participants);
        setLeaderboard(leaderboardRes.leaderboard);
      } catch (err) {
        console.error("Failed to poll participants:", err);
      }
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [roundId, setParticipants, setLeaderboard]);

  return {
    loading,
    error,
    refetch: fetchData,
    isConnected,
  };
}
