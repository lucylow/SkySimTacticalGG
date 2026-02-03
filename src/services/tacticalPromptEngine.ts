// Tactical Motion Synthesis Engine
// Translates GRID esports data into HY-Motion 1.0 prompts
// Enhanced with League of Legends support and advanced scouting logic

import type {
  SceneDescriptor,
  CharacterDescriptor,
  GameStateContext,
  TacticalPredictedAction,
  MotionPrompt,
  EnrichedGridData,
  TacticalPromptConfig,
  EmotionalState,
  PhysicalContext,
  MotionVocabulary,
} from '@/types/tactical';
import type { PlayerRoundStat, RoundData, MatchMetadata } from '@/types/backend';

/**
 * Motion Vocabulary Library
 * Maps tactical states to motion language for HY-Motion 1.0
 */
const MOTION_VOCABULARY: Record<string, MotionVocabulary> = {
  // VALORANT Vocab
  entry_fragger_peek: {
    verbs: ['sidestep', 'crouch', 'snap_aim', 'clear_angle', 'jiggle_peek'],
    modifiers: ['with explosive urgency', 'torso leading the movement', 'sharp and precise', 'shoulder-first'],
    style_descriptors: ['aggressive', 'decisive', 'confident'],
  },
  support_throw: {
    verbs: ['overhand_throw', 'crane_neck', 'communicate', 'maintain_cover'],
    modifiers: ['with a high arcing trajectory', 'while maintaining cover', 'quick and fluid', 'coordinated'],
    style_descriptors: ['supportive', 'coordinated', 'precise'],
  },
  // LoL Vocab
  mid_laner_kite: {
    verbs: ['orb_walk', 'stutter_step', 'cast_ability', 'dodge_skillshot'],
    modifiers: ['with fluid rhythmic timing', 'back-pedaling while attacking', 'precise mouse clicks', 'smooth rotation'],
    style_descriptors: ['agile', 'calculated', 'reactive'],
  },
  jungler_gank: {
    verbs: ['ambush', 'dash_forward', 'cc_chain', 'burst_damage'],
    modifiers: ['from fog of war', 'closing the gap rapidly', 'unpredictable pathing', 'decisive commitment'],
    style_descriptors: ['stealthy', 'explosive', 'opportunistic'],
  },
  adc_positioning: {
    verbs: ['stay_back', 'flick_target', 'reposition', 'maintain_range'],
    modifiers: ['behind the front line', 'pixel-perfect spacing', 'maximum attack range', 'twitchy and alert'],
    style_descriptors: ['vulnerable', 'deadly', 'disciplined'],
  }
};

/**
 * Agent/Champion Motion Styles
 */
const CHARACTER_MOTION_STYLES: Record<string, string> = {
  // VALORANT
  Jett: 'light, acrobatic, and fluid',
  Sova: 'precise, methodical, and calculated',
  Raze: 'explosive, kinetic, and chaotic',
  Sage: 'composed, deliberate, and protective',
  // LoL
  LeeSin: 'martial-arts based, snappy, and high-mobility',
  Ahri: 'graceful, elusive, and fox-like',
  Yasuo: 'swift, sword-focused, and relentless',
  Leona: 'heavy, armored, and immovable',
  Zed: 'shadowy, swift, and lethal',
};

/**
 * Emotional State Inference
 */
function inferEmotionalState(
  playerData: Partial<PlayerRoundStat>,
  roundData: RoundData,
  gameState: GameStateContext
): EmotionalState {
  const isClutch = (gameState.player_count_alive?.team_a || 0) <= 2;
  const isWinning = (gameState.win_probability_team_a || 0.5) > 0.6;
  const isLosing = (gameState.win_probability_team_a || 0.5) < 0.4;
  
  if (isClutch && !isWinning) return 'focused_pressured';
  if (isWinning && !isClutch) return 'aggressive_confident';
  if (isLosing) return 'frustrated';
  
  return 'cautious_anticipatory';
}

/**
 * Physical Context Builder
 */
function buildPhysicalContext(
  playerData: Partial<PlayerRoundStat>,
  gridSnapshot: Record<string, unknown>
): PhysicalContext {
  const health = (gridSnapshot.health as number) || 100;
  
  return {
    health_status: health >= 100 ? 'full_health' : health >= 50 ? 'high_health' : health >= 25 ? 'low_health' : 'critical',
    armor_status: (gridSnapshot.armor as number) > 0 ? 'full_armor' : 'no_armor',
    utility_status: 'full_utility',
    weapon_type: (gridSnapshot.weapon_type as PhysicalContext['weapon_type']) || 'rifle',
    movement_state: (gridSnapshot.is_moving as boolean) ? 'walking' : 'stationary',
  };
}

/**
 * Predictive Action Model
 */
export function predictNextAction(
  playerData: Partial<PlayerRoundStat>,
  roundData: RoundData,
  gameState: GameStateContext,
  gridSnapshot: Record<string, unknown>
): TacticalPredictedAction | null {
  const gameType = (gridSnapshot.game as string) || 'valorant';
  const playerRole = (gridSnapshot.role as string) || 'entry';
  
  if (gameType === 'lol') {
    const mana = (gridSnapshot.mana as number) || 0;
    const enemiesNearby = (gridSnapshot.enemies_nearby as number) || 0;
    
    if (playerRole === 'MID' && mana > 50 && enemiesNearby > 0) {
      return {
        player_id: playerData.player_id || 'unknown',
        action_type: 'kite',
        urgency: 'high',
        confidence: 0.9,
        description: 'kite back while casting spells',
        motion_style: 'fluid and reactive',
      };
    }
    
    if (playerRole === 'JG' && enemiesNearby === 0 && (gridSnapshot.is_near_lane as boolean)) {
      return {
        player_id: playerData.player_id || 'unknown',
        action_type: 'rotate',
        urgency: 'quick',
        confidence: 0.8,
        description: 'approaching lane for gank',
        motion_style: 'stealthy and explosive',
      };
    }
  } else {
    // Valorant Logic
    if (playerRole === 'entry' || playerRole === 'entry_fragger') {
      return {
        player_id: playerData.player_id || 'unknown',
        action_type: 'peek',
        urgency: 'immediate',
        confidence: 0.85,
        description: 'aggressive corner peek',
        motion_style: 'sharp and explosive',
      };
    }
    
    if (playerRole === 'support' && (gridSnapshot.has_utility as boolean)) {
      return {
        player_id: playerData.player_id || 'unknown',
        action_type: 'throw',
        urgency: 'deliberate',
        confidence: 0.75,
        description: 'coordinated utility usage',
        motion_style: 'precise and supportive',
      };
    }
  }
  
  return null;
}

/**
 * Build Scene Descriptor from GRID Data
 */
export function buildSceneDescriptor(
  matchData: MatchMetadata,
  roundData: RoundData,
  players: Array<{ playerData: Partial<PlayerRoundStat>; gridSnapshot: Record<string, unknown> }>,
  gameState: GameStateContext
): SceneDescriptor {
  const characters: CharacterDescriptor[] = players.map(({ playerData, gridSnapshot }) => {
    const emotionalState = inferEmotionalState(playerData, roundData, gameState);
    const physicalContext = buildPhysicalContext(playerData, gridSnapshot);
    
    return {
      id: `player_${playerData.player_id}`,
      player_id: playerData.player_id,
      role: (gridSnapshot.role as CharacterDescriptor['role']) || 'entry_fragger',
      agent: gridSnapshot.agent as string,
      emotional_context: emotionalState,
      physical_context: physicalContext,
      grid_data_snapshot: gridSnapshot,
      current_stance: (gridSnapshot.is_crouching as boolean) ? 'crouched' : 'standing',
      health: (gridSnapshot.health as number) || 100,
      utility_count: (gridSnapshot.utility_count as Record<string, number>) || {},
      position: gridSnapshot.position as { x: number; y: number; z?: number },
    };
  });
  
  const predictedActions = players
    .map(({ playerData, gridSnapshot }) => predictNextAction(playerData, roundData, gameState, gridSnapshot))
    .filter((a): a is TacticalPredictedAction => a !== null);
  
  return {
    scene_id: `scene_${roundData.id}_${Date.now()}`,
    timestamp: new Date().toISOString(),
    game_state: gameState,
    characters,
    tactical_directive: 'Execute coordinated tactical movement based on live game state.',
    predicted_actions: predictedActions,
  };
}

/**
 * Generate Motion Prompt from Scene Descriptor
 */
export function generateMotionPrompt(
  sceneDescriptor: SceneDescriptor,
  characterId: string,
  config: TacticalPromptConfig = {}
): MotionPrompt {
  const character = sceneDescriptor.characters.find(c => c.id === characterId || c.player_id === characterId);
  if (!character) throw new Error(`Character ${characterId} not found`);
  
  const motionStyle = CHARACTER_MOTION_STYLES[character.agent || ''] || 'professional and tactical';
  const gameType = (character.grid_data_snapshot?.game as string) || 'valorant';
  
  // Select vocabulary based on role and game
  let vocabKey = '';
  if (gameType === 'lol') {
    if (character.role === 'MID') vocabKey = 'mid_laner_kite';
    else if (character.role === 'JG') vocabKey = 'jungler_gank';
    else if (character.role === 'ADC') vocabKey = 'adc_positioning';
  } else {
    if (character.role === 'entry_fragger' || character.role === 'entry') vocabKey = 'entry_fragger_peek';
    else if (character.role === 'support') vocabKey = 'support_throw';
  }
  
  const vocab = vocabKey ? MOTION_VOCABULARY[vocabKey] : null;
  const verbs = vocab ? vocab.verbs.join(', ') : 'reposition';
  const modifiers = vocab ? vocab.modifiers.join(', ') : 'tactically';
  
  // Build tactical prompt for HY-Motion 1.0
  const promptText = `
    [ACTOR]: ${character.agent || 'Player'} (${character.role})
    [GAME]: ${gameType}
    [STYLE]: ${motionStyle}
    [EMOTION]: ${character.emotional_context}
    [ACTION]: ${verbs} ${modifiers}
    [DIRECTIVE]: ${sceneDescriptor.tactical_directive}
  `.trim();
  
  return {
    prompt_text: promptText,
    config: {
      duration: 5.0,
      fps: 30,
      action_type: vocabKey || 'reposition',
      player_role: character.role,
      agent: character.agent,
    },
    metadata: {
      generated_at: new Date().toISOString(),
      source: 'grid_data',
      confidence_score: 0.85,
      game_context: gameType,
      tactical_layer: 'advanced_scouting'
    }
  };
}
