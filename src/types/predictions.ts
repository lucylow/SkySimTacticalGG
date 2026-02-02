// types/predictions.ts
export type MarketType = 
  | "match_winner"
  | "map_winner"
  | "first_blood"
  | "mvp"
  | "round_winner"
  | "objective";

export type PredictionStatus = "pending" | "won" | "lost" | "cancelled";
export type MarketStatus = "open" | "closed" | "settled";

export interface VirtualWallet {
  username: string;
  balance: number;
  total_earned: number;
  total_wagered: number;
  daily_wagered: number;
  last_reset_date: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: number;
  transaction_type: "credit" | "debit" | "settlement";
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_type?: string;
  reference_id?: string;
  description?: string;
  created_at: string;
}

export interface PredictionMarket {
  id: number;
  match_id: string;
  market_type: MarketType;
  market_key?: string;
  status: MarketStatus;
  odds_type: "fixed" | "pool";
  odds?: Record<string, number>;
  pool_total: number;
  pool_by_selection?: Record<string, number>;
  created_at: string;
  closed_at?: string;
  settled_at?: string;
}

export interface Prediction {
  id: number;
  prediction_id: string;
  username: string;
  market_id: number;
  selection: string;
  stake: number;
  odds?: string;
  potential_payout: number;
  status: PredictionStatus;
  payout?: number;
  created_at: string;
  settled_at?: string;
  market?: PredictionMarket;
}

export interface FantasyTeam {
  id: number;
  team_id: string;
  username: string;
  match_id: string;
  team_name?: string;
  players: string[];
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  competition_type: string;
  competition_id?: string;
  score: number;
  rank?: number;
  wins: number;
  total_predictions: number;
  accuracy?: string;
  updated_at: string;
}

export interface PredictionStats {
  total_predictions: number;
  wins: number;
  losses: number;
  accuracy: number;
  total_wagered: number;
  total_won: number;
  net_profit: number;
  expected_value?: number;
}

export interface UserDashboard {
  wallet: VirtualWallet;
  stats: PredictionStats;
  recent_predictions: Prediction[];
  leaderboard_position?: number;
}

export interface PredictionCreate {
  market_id: number;
  selection: string;
  stake: number;
}

export interface WalletTopUp {
  amount: number;
  reason?: string;
}

export interface MarketSettlement {
  market_id: number;
  winning_selection: string;
  settle_all?: boolean;
}


