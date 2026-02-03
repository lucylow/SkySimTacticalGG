export type GameType = 'VALORANT' | 'LEAGUE';

export interface LivePlayerProfile {
  id: string;
  agent?: string; // Valorant
  champion?: string; // League
  position: Vector3;
  health?: number;
  level?: number;
  cs?: number;
  items?: string[];
  playstyle: string;
  confidence: number;
  telemetry?: any;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface MapState {
  currentMap?: string;
  roundTime?: number;
  gameTime?: number;
  dragonTimer?: number;
  baronTimer?: number;
}

export interface EconomyState {
  roundEconomy: 'eco' | 'force' | 'full';
}

export interface LivePrediction {
  type: string;
  probability: number;
  message: string;
}

export interface LiveGameState {
  game: GameType;
  matchId: string;
  enemyPlayers: LivePlayerProfile[];
  mapState: MapState;
  economy?: EconomyState;
  predictions: LivePrediction[];
}

export interface CoachCall {
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  color: 'green' | 'yellow' | 'red';
}

export type PlaystyleType = 'rush_wq' | 'utility_entry' | 'anchor' | 'lurker';
export type LeaguePlaystyle = 'early_snowball' | 'scaler' | 'split_pusher' | 'teamfight';
