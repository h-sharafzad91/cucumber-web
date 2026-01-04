export interface Agent {
  id: string;
  name: string;
  user_id?: string;
  persona_config: PersonaConfig;
  worker_config: WorkerConfig;
  mmr: number;
  is_active?: boolean;
  tick_interval?: number;
  leverage?: number;
  stop_loss_percent?: number;
  stop_loss_position_close_percent?: number;
  take_profit_percent?: number;
  take_profit_position_close_percent?: number;
  trading_style?: "paper_hands" | "normal" | "degen";
  created_at: string;
  updated_at?: string;
}

export interface PersonaConfig {
  strategy: "momentum" | "mean_reversion" | "breakout" | "custom";
  risk_tolerance: "conservative" | "moderate" | "aggressive";
  trading_style?: "paper_hands" | "normal" | "degen";
  goal?: string;
  description?: string;
  leverage?: number;
  stop_loss_percent?: number;
  stop_loss_position_close_percent?: number;
  take_profit_percent?: number;
  take_profit_position_close_percent?: number;
}

export interface WorkerConfig {
  model: string;
  temperature: number;
  max_tokens: number;
}

export interface Round {
  id: string;
  name: string;
  status: "pending" | "active" | "completed";
  start_time?: string;
  end_time?: string;
  tick_interval?: number;
  min_tick_interval?: number;
  max_tick_interval?: number;
  settings: RoundSettings;
  created_at: string;
  arena_type?: "tournament" | "contest";
  trading_pair?: string;
  prize_pool_seed?: number;
  buy_in_fee?: number;
  protocol_fee_percent?: number;
  agent_limit?: number;
  winner_count?: number;
  payout_structure?: Record<string, number>;
  current_participants?: number;
  current_pool_size?: number;
  max_participants?: number;
  scheduled_start_time?: string;
}

export interface RoundSettings {
  max_agents: number;
  allowed_assets: string[];
  max_order_usd: number;
  initial_balance: number;
  duration_minutes?: number;
}

export interface RoundParticipant {
  id: string;
  round_id: string;
  agent_id: string;
  agent_name?: string;
  initial_balance: number;
  current_balance: number;
  total_pnl: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
  total_trades: number;
  joined_at: string;
  effective_tick_interval?: number;
}

export interface Trade {
  id: string;
  agent_id: string;
  round_id: string;
  tick_id: string;
  action: "BUY_MARKET" | "SELL_MARKET" | "HOLD";
  asset: string;
  size_usd: number;
  size_asset: number;
  execution_price: number;
  slippage: number;
  gas_used: string;
  tx_hash: string;
  status: "pending" | "confirmed" | "failed";
  error_message?: string;
  created_at: string;
  confirmed_at?: string;
}

export interface LeaderboardEntry {
  agent_id: string;
  agent_name: string;
  total_pnl: number;
  total_trades: number;
  current_balance?: number;
  effective_tick_interval?: number;
  win_rate: number;
  rank: number;
}

export interface TickEvent {
  tick_id: string;
  timestamp: string;
  tick_number: number;
  market: {
    ETH_USDC: { price: number; source: string };
  };
}

export interface ReasoningEvent {
  agent_id: string;
  agent_name?: string;
  reasoning: string;
  action: string;
  asset?: string;
  size_usd?: number;
  size_asset?: number;
  timestamp?: string;
}

export interface TradeEvent extends Trade {}

export interface LeaderboardEvent {
  rankings: LeaderboardEntry[];
}
