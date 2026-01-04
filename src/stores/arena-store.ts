import { create } from "zustand";
import type {
  Round,
  Trade,
  LeaderboardEntry,
  TickEvent,
  ReasoningEvent,
  RoundParticipant,
} from "@/types";

interface ArenaState {
  round: Round | null;
  setRound: (round: Round | null) => void;

  participants: RoundParticipant[];
  setParticipants: (participants: RoundParticipant[]) => void;
  updateParticipant: (agentId: string, updates: Partial<RoundParticipant>) => void;

  currentPrice: number;
  tickNumber: number;
  setTickData: (price: number, tickNumber: number) => void;

  leaderboard: LeaderboardEntry[];
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;

  trades: Trade[];
  addTrade: (trade: Trade) => void;
  setTrades: (trades: Trade[]) => void;

  reasonings: ReasoningEvent[];
  addReasoning: (reasoning: ReasoningEvent) => void;
  setReasonings: (reasonings: ReasoningEvent[]) => void;
  clearReasonings: () => void;

  connected: boolean;
  setConnected: (connected: boolean) => void;

  reset: () => void;
}

export const useArenaStore = create<ArenaState>((set) => ({
  round: null,
  setRound: (round) => set({ round }),

  participants: [],
  setParticipants: (participants) => set({ participants }),
  updateParticipant: (agentId, updates) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.agent_id === agentId ? { ...p, ...updates } : p
      ),
    })),

  currentPrice: 0,
  tickNumber: 0,
  setTickData: (currentPrice, tickNumber) => set({ currentPrice, tickNumber }),

  leaderboard: [],
  setLeaderboard: (leaderboard) => set({ leaderboard }),

  trades: [],
  addTrade: (trade) =>
    set((state) => {
      const exists = state.trades.some((t) => t.id === trade.id);
      if (exists) return state;
      return {
        trades: [trade, ...state.trades].slice(0, 50),
      };
    }),
  setTrades: (trades) => set({ trades }),

  reasonings: [],
  addReasoning: (reasoning) =>
    set((state) => {
      const exists = state.reasonings.some(
        (r) => r.agent_id === reasoning.agent_id && r.timestamp === reasoning.timestamp
      );
      if (exists) return state;
      return {
        reasonings: [reasoning, ...state.reasonings].slice(0, 100),
      };
    }),
  setReasonings: (reasonings) => set({ reasonings }),
  clearReasonings: () => set({ reasonings: [] }),

  connected: false,
  setConnected: (connected) => set({ connected }),

  reset: () =>
    set({
      round: null,
      participants: [],
      currentPrice: 0,
      tickNumber: 0,
      leaderboard: [],
      trades: [],
      reasonings: [],
      connected: false,
    }),
}));
