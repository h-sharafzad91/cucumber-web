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
import type { Round, RoundParticipant } from "@/types";

export function useArena(roundId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { setRound, setParticipants, setTrades, setLeaderboard, setReasonings, setTickData } = useArenaStore();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [roundRes, participantsRes, tradesRes, leaderboardRes, priceRes] =
        await Promise.all([
          getRound(roundId),
          getParticipants(roundId),
          getTrades(roundId),
          getLeaderboard(roundId),
          getMarketPrice(),
        ]);

      setRound(roundRes.round);
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
  }, [roundId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    refetch: fetchData,
  };
}
