import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function connect(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnect(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function subscribeToRound(roundId: string): void {
  const s = getSocket();
  s.emit("subscribe:round", roundId);
}

export function unsubscribeFromRound(roundId: string): void {
  const s = getSocket();
  s.emit("unsubscribe:round", roundId);
}

export function onTick(callback: (data: any) => void): () => void {
  const s = getSocket();
  s.on("tick", callback);
  return () => s.off("tick", callback);
}

export function onReasoning(callback: (data: any) => void): () => void {
  const s = getSocket();
  s.on("reasoning", callback);
  return () => s.off("reasoning", callback);
}

export function onTrade(callback: (data: any) => void): () => void {
  const s = getSocket();
  s.on("trade", callback);
  return () => s.off("trade", callback);
}

export function onLeaderboard(callback: (data: any) => void): () => void {
  const s = getSocket();
  s.on("leaderboard", callback);
  return () => s.off("leaderboard", callback);
}
