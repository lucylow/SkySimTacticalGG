// GRID Data Packet Types - Simplified VALORANT/CS2 format

export type GameType = 'VALORANT' | 'LEAGUE_OF_LEGENDS';

export interface GridDataPacket {
  timestamp: number;
  game: GameType;
  player: PlayerState | LoLPlayerState;
  inventory?: InventoryState | LoLInventoryState;
  match_context: MatchContext | LoLMatchContext;
}

export interface PlayerState {
  id: string;
  team: 'Attacker' | 'Defender';
  agent: string;
  position: { x: number; y: number; z: number };
  health: number;
  armor: number;
  view_angles: { yaw: number; pitch: number };
  is_crouching: boolean;
  is_moving: boolean;
}

export interface LoLPlayerState {
  id: string;
  team: 'Blue' | 'Red';
  champion: string;
  position: { x: number; y: number; z: number };
  health: number;
  mana: number;
  level: number;
  is_moving: boolean;
  is_attacking: boolean;
}

export interface InventoryState {
  primary_weapon: string;
  secondary_weapon: string;
  abilities: {
    c?: { name: string; charges: number };
    q?: { name: string; charges: number };
    e?: { name: string; charges: number };
    x?: { name: string; charges: number };
  };
  credits: number;
}

export interface LoLInventoryState {
  items: string[];
  summoner_spells: string[];
  gold: number;
}

export interface MatchContext {
  map: string;
  round_time_remaining: number;
  round_phase: 'pre_round' | 'mid_round' | 'post_plant' | 'retake';
  spike_status: 'not_planted' | 'planted' | 'defused' | 'exploded';
  spike_plant_time?: number;
  player_locations_alive: string[];
  site_control: 'Attacker' | 'Defender' | 'Contested';
}

export interface LoLMatchContext {
  map: string;
  game_time: number;
  objectives: {
    baron_alive: boolean;
    dragon_count: number;
    towers_destroyed: number;
  };
  team_gold_diff: number;
}

export interface PredictedAction {
  action: string;
  confidence: number;
  prompt_snippet: string;
  full_prompt: string;
  motion_type: 'peek' | 'throw' | 'defuse' | 'plant' | 'rotate' | 'disengage' | 'hold' | 'retake' | 'kite' | 'ability' | 'auto_attack';
}

export interface MotionKeyframe {
  timestamp: number;
  joints: JointQuaternion[];
  root_position: [number, number, number];
}

export interface JointQuaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

// ============================================================================
// GRID Canonical Event Types (Game-Agnostic)
// ============================================================================

/**
 * Canonical event envelope - all events share this structure
 */
export interface CanonicalEvent {
  event_id: string;
  event_type: CanonicalEventType;
  game: string;
  match_id: string;
  map?: string;
  round?: number;
  timestamp: string; // ISO 8601
  actor?: string; // e.g., "player:p1" or "team:teamA"
  target?: string;
  team?: string;
  payload: Record<string, unknown>;
}

export type CanonicalEventType =
  | 'MATCH_START'
  | 'MAP_START'
  | 'ROUND_START'
  | 'KILL'
  | 'ASSIST'
  | 'OBJECTIVE'
  | 'ECONOMY_UPDATE'
  | 'ROUND_END'
  | 'MAP_END'
  | 'MATCH_END';

/**
 * Raw GRID event (before normalization)
 */
export interface RawGridEvent {
  ingestion_id: string;
  grid_event_id: string;
  received_at: string;
  match_id: string;
  game: string;
  payload: Record<string, unknown>;
}

/**
 * Event-specific payload types
 */
export interface MatchStartPayload {
  best_of: number;
  teams: string[];
}

export interface MapStartPayload {
  map_name: string;
  starting_sides: Record<string, 'CT' | 'T'>;
}

export interface RoundStartPayload {
  economy: Record<string, number>;
}

export interface KillPayload {
  weapon: string;
  headshot: boolean;
  trade: boolean;
}

export interface ObjectivePayload {
  objective: 'BOMB_PLANT' | 'BOMB_DEFUSE' | 'SITE_CAPTURE';
  site?: string;
}

export interface RoundEndPayload {
  winner: string;
  win_condition: 'ELIMINATION' | 'DEFUSE' | 'TIME' | 'PLANT';
}

export interface MapEndPayload {
  score: Record<string, number>;
}

// ============================================================================
// Match State Reconstruction
// ============================================================================

export interface MatchState {
  match_id: string;
  score: Record<string, number>;
  current_round: number;
  current_map?: string;
  players: Record<string, PlayerMatchStats>;
  team_economy: Record<string, number>;
  round_history: RoundState[];
}

export interface PlayerMatchStats {
  player_id: string;
  kills: number;
  deaths: number;
  assists: number;
  money: number;
  adr: number;
}

export interface RoundState {
  round_number: number;
  winner?: string;
  win_condition?: string;
  duration?: number;
  economy_start: Record<string, number>;
  economy_end: Record<string, number>;
}

// ============================================================================
// AI Agent Signals
// ============================================================================

export interface AgentSignal {
  id: string;
  agent: string;
  match_id: string;
  type: AgentSignalType;
  team?: string;
  player?: string;
  confidence: number;
  explanation: Record<string, unknown>;
  timestamp: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewed_by?: string;
  reviewed_at?: string;
}

export type AgentSignalType =
  | 'MOMENTUM_SHIFT'
  | 'STAR_PLAYER'
  | 'ECONOMY_CRASH'
  | 'STRATEGIC_PATTERN'
  | 'CLUTCH_OPPORTUNITY'
  | 'ROUND_CRITICAL'
  | 'OBJECTIVE_RECOMMENDATION';

export interface ObjectiveRecommendationSignal extends AgentSignal {
  type: 'OBJECTIVE_RECOMMENDATION';
  explanation: {
    objective: 'DRAGON' | 'BARON' | 'HERALD' | 'TOWER';
    recommendation: 'SECURE' | 'CONTEST' | 'AVOID' | 'TRADE';
    confidence: number;
    expectedValue: number;
    pSuccess: number;
    winProbDelta: number;
    coachCall: string;
    rationale: string[];
  };
}

export interface ObjectiveState {
  objective: 'DRAGON' | 'BARON' | 'HERALD' | 'TOWER';
  timeToSpawn: number;        // seconds
  matchTime: number;          // total game time
  teamGoldDiff: number;
  allyCountNear: number;
  enemyCountNear: number;
  visionInPit: number;        // friendly wards
  enemyVisionInPit: number;
  ultimatesUp: number;        // team ultimates ready
  enemyUltimatesUp: number;
  smiteReady: boolean;
  enemySmiteReady: boolean;
  sidelanePressure: boolean;  // can we threaten sidelanes?
  playerHpPercent: number;    // avg team HP%
}

export interface ObjectiveDecision {
  recommendation: 'SECURE' | 'CONTEST' | 'AVOID' | 'TRADE';
  confidence: number;
  expectedValue: number;
  rationale: string[];
  pSuccess: number;
  winProbDelta: number;       // % winrate increase
  coachCall: string;          // 1-3 word call
}

export interface MomentumSignal extends AgentSignal {
  type: 'MOMENTUM_SHIFT';
  explanation: {
    rounds_won: number;
    eco_wins: number;
    key_player?: string;
  };
}

export interface StarPlayerSignal extends AgentSignal {
  type: 'STAR_PLAYER';
  explanation: {
    kill_percentage: number;
    opening_kill_rate: number;
    impact_score: number;
  };
}

export interface EconomyCrashSignal extends AgentSignal {
  type: 'ECONOMY_CRASH';
  explanation: {
    economy_before: number;
    economy_after: number;
    forced_buys: number;
  };
}

// ============================================================================
// Error Types and Validation
// ============================================================================

/**
 * Custom error classes for GRID data processing
 */
export class GridValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message);
    this.name = 'GridValidationError';
  }
}

export class GridNormalizationError extends Error {
  constructor(
    message: string,
    public readonly eventType?: string,
    public readonly rawEvent?: unknown
  ) {
    super(message);
    this.name = 'GridNormalizationError';
  }
}

export class GridStateError extends Error {
  constructor(
    message: string,
    public readonly matchId?: string,
    public readonly eventId?: string
  ) {
    super(message);
    this.name = 'GridStateError';
  }
}

/**
 * Validation utilities for GRID types
 */
export class GridValidator {
  /**
   * Validate a GridDataPacket
   */
  static validateGridDataPacket(packet: unknown): asserts packet is GridDataPacket {
    if (!packet || typeof packet !== 'object') {
      throw new GridValidationError('GridDataPacket must be an object');
    }

    const p = packet as Record<string, unknown>;

    // Validate timestamp
    if (typeof p.timestamp !== 'number' || p.timestamp <= 0) {
      throw new GridValidationError(
        'GridDataPacket.timestamp must be a positive number',
        'timestamp',
        p.timestamp
      );
    }

    // Validate player
    if (!p.player || typeof p.player !== 'object') {
      throw new GridValidationError('GridDataPacket.player is required', 'player');
    }
    this.validatePlayerState(p.player as Record<string, unknown>);

    // Validate inventory
    if (!p.inventory || typeof p.inventory !== 'object') {
      throw new GridValidationError('GridDataPacket.inventory is required', 'inventory');
    }
    this.validateInventoryState(p.inventory as Record<string, unknown>);

    // Validate match_context
    if (!p.match_context || typeof p.match_context !== 'object') {
      throw new GridValidationError('GridDataPacket.match_context is required', 'match_context');
    }
    this.validateMatchContext(p.match_context as Record<string, unknown>);
  }

  /**
   * Validate a PlayerState
   */
  static validatePlayerState(player: unknown): asserts player is PlayerState {
    if (!player || typeof player !== 'object') {
      throw new GridValidationError('PlayerState must be an object', 'player');
    }

    const p = player as Record<string, unknown>;

    if (typeof p.id !== 'string' || !p.id) {
      throw new GridValidationError('PlayerState.id must be a non-empty string', 'id', p.id);
    }

    if (p.team !== 'Attacker' && p.team !== 'Defender') {
      throw new GridValidationError(
        "PlayerState.team must be 'Attacker' or 'Defender'",
        'team',
        p.team
      );
    }

    if (typeof p.agent !== 'string' || !p.agent) {
      throw new GridValidationError('PlayerState.agent must be a non-empty string', 'agent');
    }

    this.validatePosition(p.position, 'position');
    this.validateViewAngles(p.view_angles, 'view_angles');

    if (typeof p.health !== 'number' || p.health < 0 || p.health > 100) {
      throw new GridValidationError(
        'PlayerState.health must be a number between 0 and 100',
        'health',
        p.health
      );
    }

    if (typeof p.armor !== 'number' || p.armor < 0) {
      throw new GridValidationError(
        'PlayerState.armor must be a non-negative number',
        'armor',
        p.armor
      );
    }

    if (typeof p.is_crouching !== 'boolean') {
      throw new GridValidationError(
        'PlayerState.is_crouching must be a boolean',
        'is_crouching',
        p.is_crouching
      );
    }

    if (typeof p.is_moving !== 'boolean') {
      throw new GridValidationError(
        'PlayerState.is_moving must be a boolean',
        'is_moving',
        p.is_moving
      );
    }
  }

  /**
   * Validate a position object
   */
  static validatePosition(
    position: unknown,
    fieldName = 'position'
  ): asserts position is { x: number; y: number; z: number } {
    if (!position || typeof position !== 'object') {
      throw new GridValidationError(`${fieldName} must be an object`, fieldName);
    }

    const pos = position as Record<string, unknown>;
    if (typeof pos.x !== 'number' || typeof pos.y !== 'number' || typeof pos.z !== 'number') {
      throw new GridValidationError(
        `${fieldName} must have x, y, z as numbers`,
        fieldName,
        position
      );
    }
  }

  /**
   * Validate view angles
   */
  static validateViewAngles(
    angles: unknown,
    fieldName = 'view_angles'
  ): asserts angles is { yaw: number; pitch: number } {
    if (!angles || typeof angles !== 'object') {
      throw new GridValidationError(`${fieldName} must be an object`, fieldName);
    }

    const ang = angles as Record<string, unknown>;
    if (typeof ang.yaw !== 'number' || typeof ang.pitch !== 'number') {
      throw new GridValidationError(
        `${fieldName} must have yaw and pitch as numbers`,
        fieldName,
        angles
      );
    }
  }

  /**
   * Validate InventoryState
   */
  static validateInventoryState(
    inventory: unknown
  ): asserts inventory is InventoryState {
    if (!inventory || typeof inventory !== 'object') {
      throw new GridValidationError('InventoryState must be an object', 'inventory');
    }

    const inv = inventory as Record<string, unknown>;

    if (typeof inv.primary_weapon !== 'string') {
      throw new GridValidationError(
        'InventoryState.primary_weapon must be a string',
        'primary_weapon'
      );
    }

    if (typeof inv.secondary_weapon !== 'string') {
      throw new GridValidationError(
        'InventoryState.secondary_weapon must be a string',
        'secondary_weapon'
      );
    }

    if (typeof inv.credits !== 'number' || inv.credits < 0) {
      throw new GridValidationError(
        'InventoryState.credits must be a non-negative number',
        'credits',
        inv.credits
      );
    }

    // Validate abilities (optional)
    if (inv.abilities !== undefined) {
      if (typeof inv.abilities !== 'object' || inv.abilities === null) {
        throw new GridValidationError('InventoryState.abilities must be an object', 'abilities');
      }
    }
  }

  /**
   * Validate MatchContext
   */
  static validateMatchContext(
    context: unknown
  ): asserts context is MatchContext {
    if (!context || typeof context !== 'object') {
      throw new GridValidationError('MatchContext must be an object', 'context');
    }

    const ctx = context as Record<string, unknown>;

    if (typeof ctx.map !== 'string' || !ctx.map) {
      throw new GridValidationError('MatchContext.map must be a non-empty string', 'map');
    }

    if (typeof ctx.round_time_remaining !== 'number' || ctx.round_time_remaining < 0) {
      throw new GridValidationError(
        'MatchContext.round_time_remaining must be a non-negative number',
        'round_time_remaining',
        ctx.round_time_remaining
      );
    }

    const validPhases = ['pre_round', 'mid_round', 'post_plant', 'retake'];
    if (!validPhases.includes(ctx.round_phase as string)) {
      throw new GridValidationError(
        `MatchContext.round_phase must be one of: ${validPhases.join(', ')}`,
        'round_phase',
        ctx.round_phase
      );
    }

    const validSpikeStatuses = ['not_planted', 'planted', 'defused', 'exploded'];
    if (!validSpikeStatuses.includes(ctx.spike_status as string)) {
      throw new GridValidationError(
        `MatchContext.spike_status must be one of: ${validSpikeStatuses.join(', ')}`,
        'spike_status',
        ctx.spike_status
      );
    }

    if (!Array.isArray(ctx.player_locations_alive)) {
      throw new GridValidationError(
        'MatchContext.player_locations_alive must be an array',
        'player_locations_alive'
      );
    }

    const validSiteControl = ['Attacker', 'Defender', 'Contested'];
    if (!validSiteControl.includes(ctx.site_control as string)) {
      throw new GridValidationError(
        `MatchContext.site_control must be one of: ${validSiteControl.join(', ')}`,
        'site_control',
        ctx.site_control
      );
    }
  }

  /**
   * Validate a CanonicalEvent
   */
  static validateCanonicalEvent(event: unknown): asserts event is CanonicalEvent {
    if (!event || typeof event !== 'object') {
      throw new GridValidationError('CanonicalEvent must be an object');
    }

    const e = event as Record<string, unknown>;

    if (typeof e.event_id !== 'string' || !e.event_id) {
      throw new GridValidationError('CanonicalEvent.event_id must be a non-empty string', 'event_id');
    }

    const validEventTypes: CanonicalEventType[] = [
      'MATCH_START',
      'MAP_START',
      'ROUND_START',
      'KILL',
      'ASSIST',
      'OBJECTIVE',
      'ECONOMY_UPDATE',
      'ROUND_END',
      'MAP_END',
      'MATCH_END',
    ];
    if (!validEventTypes.includes(e.event_type as CanonicalEventType)) {
      throw new GridValidationError(
        `CanonicalEvent.event_type must be one of: ${validEventTypes.join(', ')}`,
        'event_type',
        e.event_type
      );
    }

    if (typeof e.game !== 'string' || !e.game) {
      throw new GridValidationError('CanonicalEvent.game must be a non-empty string', 'game');
    }

    if (typeof e.match_id !== 'string' || !e.match_id) {
      throw new GridValidationError('CanonicalEvent.match_id must be a non-empty string', 'match_id');
    }

    if (typeof e.timestamp !== 'string' || !e.timestamp) {
      throw new GridValidationError('CanonicalEvent.timestamp must be a non-empty string', 'timestamp');
    }

    // Validate ISO 8601 timestamp format
    if (isNaN(Date.parse(e.timestamp as string))) {
      throw new GridValidationError(
        'CanonicalEvent.timestamp must be a valid ISO 8601 date string',
        'timestamp',
        e.timestamp
      );
    }

    if (!e.payload || typeof e.payload !== 'object') {
      throw new GridValidationError('CanonicalEvent.payload must be an object', 'payload');
    }
  }

  /**
   * Validate a RawGridEvent
   */
  static validateRawGridEvent(event: unknown): asserts event is RawGridEvent {
    if (!event || typeof event !== 'object') {
      throw new GridValidationError('RawGridEvent must be an object');
    }

    const e = event as Record<string, unknown>;

    if (typeof e.ingestion_id !== 'string' || !e.ingestion_id) {
      throw new GridValidationError(
        'RawGridEvent.ingestion_id must be a non-empty string',
        'ingestion_id'
      );
    }

    if (typeof e.grid_event_id !== 'string' || !e.grid_event_id) {
      throw new GridValidationError(
        'RawGridEvent.grid_event_id must be a non-empty string',
        'grid_event_id'
      );
    }

    if (typeof e.received_at !== 'string' || !e.received_at) {
      throw new GridValidationError(
        'RawGridEvent.received_at must be a non-empty string',
        'received_at'
      );
    }

    if (typeof e.match_id !== 'string' || !e.match_id) {
      throw new GridValidationError('RawGridEvent.match_id must be a non-empty string', 'match_id');
    }

    if (typeof e.game !== 'string' || !e.game) {
      throw new GridValidationError('RawGridEvent.game must be a non-empty string', 'game');
    }

    if (!e.payload || typeof e.payload !== 'object') {
      throw new GridValidationError('RawGridEvent.payload must be an object', 'payload');
    }

    // Validate payload has type field
    const payload = e.payload as Record<string, unknown>;
    if (typeof payload.type !== 'string' || !payload.type) {
      throw new GridValidationError(
        'RawGridEvent.payload.type must be a non-empty string',
        'payload.type'
      );
    }
  }
}

