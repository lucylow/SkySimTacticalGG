// ============= Tactical Motion Synthesis Types =============

/**
 * Scene Descriptor - Rich representation of a tactical moment
 * Used to translate GRID data into HY-Motion prompts
 */
export interface SceneDescriptor {
  scene_id: string;
  timestamp: string;
  game_state: GameStateContext;
  characters: CharacterDescriptor[];
  tactical_directive: string;
  predicted_actions?: TacticalPredictedAction[];
}

export interface GameStateContext {
  map: string;
  round_phase: 'buy' | 'pre_round' | 'mid_round' | 'post_plant' | 'retake' | 'round_end';
  win_probability_team_a?: number;
  round_number: number;
  time_remaining?: number;
  economy_state?: 'full_buy' | 'force' | 'eco' | 'semi';
  spike_state?: 'not_planted' | 'planted' | 'defused' | 'exploded';
  player_count_alive?: { team_a: number; team_b: number };
}

export interface CharacterDescriptor {
  id: string;
  player_id?: string;
  role: 'entry_fragger' | 'support' | 'awper' | 'controller' | 'anchor' | 'initiator' | 'MID' | 'TOP' | 'JG' | 'ADC' | 'SUP';
  agent?: string; // VALORANT agent name or LoL champion name
  emotional_context: EmotionalState;
  physical_context: PhysicalContext;
  grid_data_snapshot: Record<string, unknown>;
  current_stance?: 'standing' | 'crouched' | 'moving';
  health?: number;
  utility_count?: Record<string, number>;
  position?: { x: number; y: number; z?: number };
}

export type EmotionalState = 
  | 'aggressive_confident'
  | 'cautious_anticipatory'
  | 'focused_pressured'
  | 'calm_collected'
  | 'frustrated'
  | 'desperate'
  | 'dominant';

export interface PhysicalContext {
  health_status: 'full_health' | 'high_health' | 'low_health' | 'critical';
  armor_status: 'full_armor' | 'light_armor' | 'no_armor';
  utility_status: 'full_utility' | 'partial_utility' | 'no_utility';
  weapon_type?: 'rifle' | 'sniper' | 'pistol' | 'smg';
  movement_state?: 'stationary' | 'walking' | 'running' | 'crouched';
}

/**
 * Tactical Predicted Action - What the player is likely to do next (tactical context)
 */
export interface TacticalPredictedAction {
  player_id: string;
  action_type: 'peek' | 'throw' | 'defuse' | 'plant' | 'rotate' | 'retreat' | 'hold_angle' | 'communicate' | 'kite';
  target_location?: { x: number; y: number };
  urgency: 'immediate' | 'quick' | 'deliberate' | 'slow' | 'high';
  confidence: number; // 0-1
  description: string;
  motion_style?: string;
}

/**
 * Motion Vocabulary - Mapping from tactical states to motion language
 */
export interface MotionVocabulary {
  verbs: string[];
  modifiers: string[];
  style_descriptors: string[];
}

/**
 * Tactical Prompt Config - Configuration for prompt generation
 */
export interface TacticalPromptConfig {
  include_emotional_context?: boolean;
  include_physical_context?: boolean;
  include_tactical_directive?: boolean;
  style?: 'detailed' | 'concise' | 'cinematic';
  focus?: 'individual' | 'team_coordination';
}

/**
 * Enriched GRID Data - GRID data with tactical context layers
 */
export interface EnrichedGridData {
  raw_data: Record<string, unknown>;
  tactical_context: TacticalContextLayer;
  emotional_inference: EmotionalInference;
  biomechanical_data?: BiomechanicalData;
  predicted_next_action?: TacticalPredictedAction;
}

export interface TacticalContextLayer {
  round_type: 'pistol' | 'eco' | 'force' | 'full';
  tactical_phase: 'default' | 'execute' | 'retake' | 'save';
  situation_type: 'advantage' | 'disadvantage' | 'neutral' | 'clutch';
  pressure_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface EmotionalInference {
  primary_emotion: EmotionalState;
  confidence: number;
  indicators: string[]; // What data points led to this inference
  intensity: number; // 0-1
}

export interface BiomechanicalData {
  movement_speed: number;
  mouse_flick_velocity?: number;
  fatigue_score: number; // Based on round duration and activity
  reaction_time_estimate?: number;
  precision_score?: number;
}

/**
 * Motion Prompt - Final prompt sent to HY-Motion 1.0
 */
export interface MotionPrompt {
  prompt_text: string;
  config: {
    duration?: number;
    fps?: number;
    action_type?: string;
    player_role?: string;
    agent?: string;
  };
  scene_descriptor?: SceneDescriptor;
  metadata?: {
    generated_at?: string;
    source?: 'grid_data' | 'prediction' | 'correction';
    confidence_score?: number;
    game_context?: string;
    tactical_layer?: string;
  };
}

// ============= Scouting & Roster Types =============

export interface ValorantPlayer {
  id: string;
  name: string;
  tag: string;
  agentProficiency: Record<string, number>;
  recentScore: number;
  primaryAgent: string;
  teamHistory?: Array<{ teamId: string }>;
  scoutingScore: number;
  liveRank?: string;
  liveTier?: string;
  liveRrLp?: number;
  rankFetchedAt?: string;
  championshipBoost?: number;
  matchupPrediction?: {
    vsTeam: string;
    predictedWinrate: number;
    confidence: number;
  };
}

export interface LolPlayer {
  id: string;
  name: string;
  primaryRole: 'TOP' | 'JG' | 'MID' | 'ADC' | 'SUP';
  championProficiency: Record<string, number>;
  recentScore: number;
  teamHistory?: Array<{ teamId: string }>;
  scoutingScore: number;
  game?: 'LOL';
}

export interface ValorantMapComp {
  map: string;
  primaryComp: string[];
  altComp1: string[];
  altComp2: string[];
  winrate: number;
  pickBanRate: number;
  notes: string;
  roleBreakdown?: Record<string, number>;
}

export interface LolTeamComp {
  archetype: string;
  lanes: Partial<Record<'TOP' | 'JG' | 'MID' | 'ADC' | 'SUP', string[]>>;
  winrate: number;
  matchupStrength: Record<string, number>;
  playstyle: string;
}

export interface SimulationResult {
  team1: string[];
  team2: string[];
  map?: string;
  game: 'VALORANT' | 'LOL';
  winsTeam1: number;
  totalSims: number;
  winrate: number;
  avgRoundScore: number[];
  confidenceInterval: [number, number];
}
