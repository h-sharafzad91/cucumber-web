const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export async function getAgents(userId?: string) {
  const endpoint = userId ? `/v1/agents?user_id=${userId}` : "/v1/agents";
  return fetchAPI<{ agents: any[] }>(endpoint);
}

export async function getAgent(id: string) {
  return fetchAPI<{ agent: any }>(`/v1/agents/${id}`);
}

export type LLMModel =
  | 'gpt-4o-mini'
  | 'gpt-4o'
  | 'claude-sonnet-4-20250514'
  | 'claude-3-5-sonnet-20241022'
  | 'gemini-2.0-flash'
  | 'gemini-1.5-pro'
  | 'grok-3'
  | 'grok-3-fast';

export async function createAgent(data: {
  name: string;
  persona_config: any;
  worker_config?: any;
  tick_interval?: number;
  leverage?: number;
  stop_loss_percent?: number;
  stop_loss_position_close_percent?: number;
  take_profit_percent?: number;
  take_profit_position_close_percent?: number;
  risk_reward_ratio?: number;
  avatar_id?: string;
  llm_model?: LLMModel;
  trading_style?: 'paper_hands' | 'normal' | 'degen';
}) {
  return fetchAPI<{ agent: any }>("/v1/agents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAgent(id: string, data: any) {
  return fetchAPI<{ agent: any }>(`/v1/agents/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAgent(id: string) {
  const response = await fetch(`${API_URL}/v1/agents/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Failed to delete agent: ${response.status}`);
  }
}

export async function getRounds() {
  return fetchAPI<{ rounds: any[] }>("/v1/rounds");
}

export async function getRound(id: string) {
  return fetchAPI<{ round: any }>(`/v1/rounds/${id}`);
}

export async function getActiveRound() {
  return fetchAPI<{ round: any | null }>("/v1/rounds/active");
}

export async function getActiveRounds() {
  return fetchAPI<{ rounds: any[] }>("/v1/rounds/active-all");
}

export async function createRound(data: {
  name?: string;
  settings?: any;
  arena_type?: 'tournament' | 'contest';
  prize_pool_seed?: number;
  buy_in_fee?: number;
  protocol_fee_percent?: number;
  payout_structure?: Record<string, number>;
  max_participants?: number;
}) {
  return fetchAPI<{ round: any }>("/v1/rounds", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPoolInfo(roundId: string) {
  return fetchAPI<{ pool: any }>(`/v1/rounds/${roundId}/pool-info`);
}

export async function settleRound(roundId: string) {
  return fetchAPI<{ settlement: any }>(`/v1/rounds/${roundId}/settle`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function getPayouts(roundId: string) {
  return fetchAPI<{ payouts: any[] }>(`/v1/rounds/${roundId}/payouts`);
}

export async function startRound(id: string) {
  return fetchAPI<{ round: any }>(`/v1/rounds/${id}/start`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function stopRound(id: string) {
  return fetchAPI<{ round: any }>(`/v1/rounds/${id}/stop`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function deleteRound(id: string) {
  const response = await fetch(`${API_URL}/v1/rounds/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(`Failed to delete round: ${response.status}`);
  }
}

export async function resumeRound(id: string) {
  return fetchAPI<{ round: any; resumed: boolean }>(`/v1/rounds/${id}/resume`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function pauseRound(id: string) {
  return fetchAPI<{ round: any; paused: boolean }>(`/v1/rounds/${id}/pause`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function joinRound(roundId: string, agentId: string) {
  return fetchAPI<{ participant: any }>(`/v1/rounds/${roundId}/join`, {
    method: "POST",
    body: JSON.stringify({ agent_id: agentId }),
  });
}

export async function getParticipants(roundId: string) {
  return fetchAPI<{ participants: any[] }>(`/v1/rounds/${roundId}/participants`);
}

export async function getSchedulerStatus(roundId: string) {
  return fetchAPI<{
    round_id: string;
    round_status: string;
    scheduler_running: boolean;
    tick_interval: number;
  }>(`/v1/rounds/${roundId}/scheduler-status`);
}

export async function getTrades(roundId: string) {
  return fetchAPI<{ trades: any[] }>(`/v1/arena/${roundId}/trades`);
}

export async function getPositions(roundId: string, agentId: string) {
  return fetchAPI<{ positions: any[] }>(
    `/v1/arena/${roundId}/positions/${agentId}`
  );
}

export async function getLeaderboard(roundId: string) {
  return fetchAPI<{ leaderboard: any[] }>(`/v1/leaderboard/${roundId}`);
}

export async function getAgentStats(roundId: string, agentId: string) {
  return fetchAPI<{ agent: any }>(`/v1/leaderboard/${roundId}/agent/${agentId}`);
}

export async function getAgentReasoning(agentId: string, roundId: string, limit: number = 20) {
  return fetchAPI<{ reasoning: any[] }>(`/v1/agents/${agentId}/reasoning/${roundId}?limit=${limit}`);
}

export async function getAllReasoning(roundId: string, agentIds: string[]) {
  const results = await Promise.all(
    agentIds.map((agentId) => getAgentReasoning(agentId, roundId, 5))
  );

  const allReasoning = results
    .flatMap((r, i) =>
      r.reasoning.map((item: any) => ({ ...item, agent_id: agentIds[i] }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  return { reasoning: allReasoning };
}

export async function getMarketPrice(tradingPair?: string) {
  const params = tradingPair ? `?trading_pair=${encodeURIComponent(tradingPair)}` : '';
  return fetchAPI<{ price: number; source: string; trading_pair: string; timestamp: string }>(`/v1/market/price${params}`);
}

export interface TradePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function getAgentTrades(agentId: string, page: number = 1, limit: number = 20) {
  return fetchAPI<{ trades: any[]; pagination: TradePagination }>(
    `/v1/agents/${agentId}/trades?page=${page}&limit=${limit}`
  );
}

export async function getAgentBattleHistory(agentId: string) {
  return fetchAPI<{ battles: any[] }>(`/v1/agents/${agentId}/battles`);
}

export async function getAgentPerformance(agentId: string) {
  return fetchAPI<{
    total_trades: number;
    total_pnl: number;
    win_rate: number;
    battles_won: number;
    total_battles: number;
    total_winnings: number;
  }>(`/v1/agents/${agentId}/performance`);
}

export interface AgentActiveRound {
  is_in_arena: boolean;
  round_id: string | null;
  round_name: string | null;
  round_status: 'pending' | 'active' | 'completed' | null;
  current_rank: number | null;
  current_pnl: number | null;
  current_balance: number | null;
  total_trades: number | null;
  time_remaining: string | null;
  start_time: string | null;
  end_time: string | null;
}

export async function getAgentActiveRound(agentId: string) {
  return fetchAPI<AgentActiveRound>(`/v1/agents/${agentId}/active-round`);
}

export async function summarizeStrategy(config: {
  name: string;
  strategy: string;
  risk_tolerance: string;
  trading_style: string;
  leverage: number;
  stop_loss_percent: number;
  take_profit_percent: number;
  goal?: string;
}) {
  return fetchAPI<{ summary: string[] }>('/v1/agents/summarize-strategy', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function getAgentLiveStats(agentId: string, roundId: string) {
  return fetchAPI<{
    rank: number;
    total_pnl: number;
    current_balance: number;
    initial_balance: number;
    total_trades: number;
    win_rate: number;
    unrealized_pnl: number;
    realized_pnl: number;
    positions: any[];
  }>(`/v1/leaderboard/${roundId}/agent/${agentId}/live`);
}

export interface PerformanceDataPoint {
  tick_number: number;
  timestamp: string;
  realized_pnl: number;
  pnl_impact: number;
  balance: number;
  portfolio_value: number;
  action: string;
  asset?: string;
  size_usd?: number;
}

export async function getAgentPerformanceHistory(roundId: string, agentId: string) {
  return fetchAPI<{
    performance: PerformanceDataPoint[];
    initial_balance: number;
    current_balance: number;
    total_pnl: number;
  }>(`/v1/arena/${roundId}/performance/${agentId}`);
}
