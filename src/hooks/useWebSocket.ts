"use client";

import { useEffect, useState, useRef } from "react";
import {
  connect,
  disconnect,
  subscribeToRound,
  unsubscribeFromRound,
  onTick,
  onTrade,
  onLeaderboard,
  onReasoning,
  getSocket,
} from "@/lib/websocket";
import { useArenaStore } from "@/stores/arena-store";
import { getParticipants } from "@/lib/api";

const activeSubscriptions = new Set<string>();
let connectionRefCount = 0;

export interface TickUpdate {
  market_price: number;
  tick_number: number;
  timestamp: string;
}

export interface TradeUpdate {
  agent_id: string;
  action: string;
  asset: string;
  amount: number;
  price: number;
  status: string;
  timestamp: string;
}

export interface LeaderboardUpdate {
  rankings: Array<{
    agent_id: string;
    agent_name: string;
    total_pnl: number;
    rank: number;
  }>;
}

export interface ReasoningUpdate {
  agent_id: string;
  agent_name: string;
  reasoning: string;
  timestamp: string;
}

export interface UseWebSocketOptions {
  roundId: string;
  onTick?: (data: TickUpdate) => void;
  onTrade?: (data: TradeUpdate) => void;
  onLeaderboard?: (data: LeaderboardUpdate) => void;
  onReasoning?: (data: ReasoningUpdate) => void;
}

export function useWebSocket(options?: UseWebSocketOptions) {
  const { roundId, onTick: onTickCallback, onTrade: onTradeCallback, onLeaderboard: onLeaderboardCallback, onReasoning: onReasoningCallback } = options || {};
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<ReturnType<typeof getSocket> | null>(null);

  const {
    setTickData,
    addTrade,
    setLeaderboard,
    addReasoning,
    setConnected: setStoreConnected,
    setParticipants,
  } = useArenaStore();

  const callbacksRef = useRef({
    onTick: onTickCallback,
    onTrade: onTradeCallback,
    onLeaderboard: onLeaderboardCallback,
    onReasoning: onReasoningCallback,
  });

  useEffect(() => {
    callbacksRef.current = {
      onTick: onTickCallback,
      onTrade: onTradeCallback,
      onLeaderboard: onLeaderboardCallback,
      onReasoning: onReasoningCallback,
    };
  });

  useEffect(() => {
    connectionRefCount++;
    const isFirstConnection = connectionRefCount === 1;

    if (isFirstConnection) {
      connect();
    }

    const socketInstance = getSocket();
    setSocket(socketInstance);

    // If no roundId, just maintain connection for raw socket access
    if (!roundId) {
      const handleConnect = () => {
        setIsConnected(true);
        setStoreConnected(true);
      };
      const handleDisconnect = () => {
        setIsConnected(false);
        setStoreConnected(false);
      };

      if (socketInstance.connected) {
        handleConnect();
      }
      socketInstance.on("connect", handleConnect);
      socketInstance.on("disconnect", handleDisconnect);

      return () => {
        socketInstance.off("connect", handleConnect);
        socketInstance.off("disconnect", handleDisconnect);
        connectionRefCount--;
        if (connectionRefCount === 0) {
          disconnect();
        }
      };
    }

    const socket = socketInstance;
    let eventHandlersSetup = false;

    const setupConnection = () => {
      setIsConnected(true);
      setStoreConnected(true);

      if (!activeSubscriptions.has(roundId)) {
        activeSubscriptions.add(roundId);
        subscribeToRound(roundId);
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setStoreConnected(false);
    };

    if (socket.connected) {
      setupConnection();
    }

    socket.on("connect", setupConnection);
    socket.on("disconnect", handleDisconnect);

    if (!eventHandlersSetup) {
      eventHandlersSetup = true;

      const unsubTick = onTick((data) => {
        const tickUpdate: TickUpdate = {
          market_price: data.market_price || 0,
          tick_number: data.tick_number || 0,
          timestamp: data.timestamp || new Date().toISOString(),
        };

        setTickData(tickUpdate.market_price, tickUpdate.tick_number);

        if (callbacksRef.current.onTick) {
          callbacksRef.current.onTick(tickUpdate);
        }
      });

      const unsubTrade = onTrade(async (data) => {
        addTrade(data);

        if (callbacksRef.current.onTrade) {
          callbacksRef.current.onTrade(data);
        }

        if (data.status === 'confirmed' && data.action !== 'HOLD') {
          try {
            const res = await getParticipants(roundId);
            setParticipants(res.participants);
          } catch (err) {
            console.error('Failed to refresh participants:', err);
          }
        }
      });

      const unsubLeaderboard = onLeaderboard((data) => {
        setLeaderboard(data);

        if (callbacksRef.current.onLeaderboard) {
          callbacksRef.current.onLeaderboard(data);
        }
      });

      const unsubReasoning = onReasoning((data) => {
        addReasoning(data);

        if (callbacksRef.current.onReasoning) {
          callbacksRef.current.onReasoning(data);
        }
      });

      return () => {
        unsubTick();
        unsubTrade();
        unsubLeaderboard();
        unsubReasoning();

        socket.off("connect", setupConnection);
        socket.off("disconnect", handleDisconnect);

        connectionRefCount--;

        if (connectionRefCount === 0) {
          if (activeSubscriptions.has(roundId)) {
            activeSubscriptions.delete(roundId);
            unsubscribeFromRound(roundId);
          }
          disconnect();
        }
      };
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId]);

  return { isConnected, socket };
}
