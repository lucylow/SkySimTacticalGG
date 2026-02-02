// Tactical Motion Synthesis Engine
// Translates GRID esports data into HY-Motion 1.0 prompts

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
  clutch_hold: {
    verbs: ['hold_breath', 'minimal_sway', 'tense_shoulders', 'controlled_aim'],
    modifiers: ['with extreme focused stillness', 'only eyes tracking faintly', 'controlled breathing', 'high pressure focus'],
    style_descriptors: ['focused', 'pressured', 'calm under pressure'],
  },
  awper_angle: {
    verbs: ['stationary_aim', 'minimal_movement', 'precise_tracking', 'wait'],
    modifiers: ['with extreme precision', 'minimal body movement', 'patient and deliberate', 'focused gaze'],
    style_descriptors: ['precise', 'patient', 'deliberate'],
  },
  rotate_movement: {
    verbs: ['sidestep', 'crouch_walk', 'quick_rotate', 'check_corners'],
    modifiers: ['with urgency', 'maintaining awareness', 'quick but controlled', 'coordinated'],
    style_descriptors: ['urgent', 'aware', 'coordinated'],
  },
};

/**
 * Agent to Motion Style Mapping (VALORANT)
 */
const AGENT_MOTION_STYLES: Record<string, string> = {
  Jett: 'light, acrobatic, and fluid',
  Brimstone: 'deliberate, heavy, and authoritative',
  Sage: 'calm, measured, and supportive',
  Sova: 'precise, methodical, and calculated',
  Omen: 'smooth, elusive, and unpredictable',
  Phoenix: 'aggressive, dynamic, and confident',
  Raze: 'explosive, energetic, and bold',
  Breach: 'powerful, forceful, and decisive',
  Cypher: 'methodical, patient, and observant',
  Viper: 'controlled, strategic, and calculated',
  Reyna: 'dominant, confident, and aggressive',
  Killjoy: 'organized, precise, and tactical',
  Skye: 'fluid, natural, and adaptive',
  Yoru: 'agile, deceptive, and quick',
  Astra: 'mystical, controlled, and strategic',
  KAYO: 'direct, efficient, and tactical',
  Chamber: 'precise, elegant, and calculated',
  Neon: 'fast, energetic, and dynamic',
  Fade: 'smooth, tracking, and methodical',
  Harbor: 'steady, protective, and strategic',
  Gekko: 'playful, adaptive, and quick',
  Deadlock: 'methodical, defensive, and patient',
  Iso: 'precise, focused, and controlled',
  Clove: 'adaptive, versatile, and strategic',
};

/**
 * Emotional State Inference
 */
function inferEmotionalState(
  playerData: Partial<PlayerRoundStat>,
  roundData: RoundData,
  gameState: GameStateContext
): EmotionalState {
  // Infer based on game state and player data
  const isClutch = (gameState.player_count_alive?.team_a || 0) <= 2;
  const isWinning = (gameState.win_probability_team_a || 0.5) > 0.6;
  const isLosing = (gameState.win_probability_team_a || 0.5) < 0.4;
  const roundLossStreak = roundData.round_number % 3 === 0 ? 2 : 0; // Simplified
  
  if (isClutch && !isWinning) return 'focused_pressured';
  if (isWinning && !isClutch) return 'aggressive_confident';
  if (isLosing && roundLossStreak >= 2) return 'frustrated';
  if (isClutch && isWinning) return 'focused_pressured';
  if (playerData.clutchness_score && playerData.clutchness_score > 0.7) return 'calm_collected';
  
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
  const armor = (gridSnapshot.armor as number) || 100;
  
  return {
    health_status: health >= 100 ? 'full_health' : health >= 50 ? 'high_health' : health >= 25 ? 'low_health' : 'critical',
    armor_status: armor >= 100 ? 'full_armor' : armor > 0 ? 'light_armor' : 'no_armor',
    utility_status: 'full_utility', // Simplified
    weapon_type: (gridSnapshot.weapon as string)?.includes('rifle') ? 'rifle' : 
                 (gridSnapshot.weapon as string)?.includes('sniper') ? 'sniper' : 'rifle',
    movement_state: (gridSnapshot.is_moving as boolean) ? 'walking' : 'stationary',
  };
}

/**
 * Predictive Action Model (Simplified Heuristic)
 */
export function predictNextAction(
  playerData: Partial<PlayerRoundStat>,
  roundData: RoundData,
  gameState: GameStateContext,
  gridSnapshot: Record<string, unknown>
): TacticalPredictedAction | null {
  const hasSmoke = (gridSnapshot.utility as string[])?.includes('smoke') || false;
  const hasFlash = (gridSnapshot.utility as string[])?.includes('flash') || false;
  const spikePlanted = gameState.spike_state === 'planted';
  const timeRemaining = gameState.time_remaining || 0;
  const isPostPlant = spikePlanted && timeRemaining > 0;
  const playerRole = (gridSnapshot.role as string) || 'entry';
  
  // Heuristic rules
  if (isPostPlant && hasSmoke && timeRemaining < 10) {
    return {
      player_id: playerData.player_id || 'unknown',
      action_type: 'throw',
      urgency: 'immediate',
      confidence: 0.85,
      description: 'throw smoke to block vision on spike site',
      motion_style: 'quick and decisive',
    };
  }
  
  if (playerRole === 'entry' && hasFlash && !spikePlanted) {
    return {
      player_id: playerData.player_id || 'unknown',
      action_type: 'peek',
      urgency: 'quick',
      confidence: 0.75,
      description: 'peek corner with flash support',
      motion_style: 'explosive and aggressive',
    };
  }
  
  if (spikePlanted && playerRole === 'anchor') {
    return {
      player_id: playerData.player_id || 'unknown',
      action_type: 'hold_angle',
      urgency: 'deliberate',
      confidence: 0.80,
      description: 'hold passive angle waiting for defuse',
      motion_style: 'focused and still',
    };
  }
  
  if (gameState.round_phase === 'retake') {
    return {
      player_id: playerData.player_id || 'unknown',
      action_type: 'rotate',
      urgency: 'quick',
      confidence: 0.70,
      description: 'rotate to retake site',
      motion_style: 'urgent and coordinated',
    };
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
    const predictedAction = predictNextAction(playerData, roundData, gameState, gridSnapshot);
    
    return {
      id: `player_${playerData.player_id}`,
      player_id: playerData.player_id,
      role: (gridSnapshot.role as CharacterDescriptor['role']) || 'entry_fragger',
      agent: gridSnapshot.agent as string,
      emotional_context: emotionalState,
      physical_context: physicalContext,
      grid_data_snapshot: gridSnapshot,
      current_stance: gridSnapshot.is_crouching ? 'crouched' : gridSnapshot.is_moving ? 'moving' : 'standing',
      health: (gridSnapshot.health as number) || 100,
      utility_count: gridSnapshot.utility_count as Record<string, number>,
      position: gridSnapshot.position as { x: number; y: number; z?: number },
    };
  });
  
  const predictedActions = players
    .map(({ playerData, gridSnapshot }) => predictNextAction(playerData, roundData, gameState, gridSnapshot))
    .filter((action): action is TacticalPredictedAction => action !== null);
  
  // Build tactical directive
  const tacticalDirective = buildTacticalDirective(gameState, characters, predictedActions);
  
  return {
    scene_id: `scene_${roundData.id}_${Date.now()}`,
    timestamp: new Date().toISOString(),
    game_state: gameState,
    characters,
    tactical_directive: tacticalDirective,
    predicted_actions: predictedActions,
  };
}

/**
 * Build Tactical Directive Text
 */
function buildTacticalDirective(
  gameState: GameStateContext,
  characters: CharacterDescriptor[],
  predictedActions: TacticalPredictedAction[]
): string {
  const entryPlayer = characters.find(c => c.role === 'entry_fragger');
  const supportPlayer = characters.find(c => c.role === 'support');
  const anchorPlayer = characters.find(c => c.role === 'anchor');
  
  if (gameState.round_phase === 'mid_round' && entryPlayer) {
    return `${entryPlayer.agent || 'Entry fragger'} must clear close angles, then jiggle-peek deep site corner. ${supportPlayer?.agent || 'Support'} provides flash assistance.`;
  }
  
  if (gameState.round_phase === 'post_plant' && anchorPlayer) {
    return `${anchorPlayer.agent || 'Anchor'} holds passive off-angle, listening for footsteps, likely to fall back to default plant spot.`;
  }
  
  if (gameState.round_phase === 'retake') {
    return `Team executing coordinated retake. Players rotating to site with utility coordination.`;
  }
  
  return `Standard tactical execution. Players coordinating based on game state.`;
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
  if (!character) {
    throw new Error(`Character ${characterId} not found in scene descriptor`);
  }
  
  const predictedAction = sceneDescriptor.predicted_actions?.find(a => a.player_id === character.player_id);
  const motionStyle = AGENT_MOTION_STYLES[character.agent || ''] || 'professional and tactical';
  const vocabKey = `${character.role}_${predictedAction?.action_type || 'default'}` as keyof typeof MOTION_VOCABULARY;
  const vocabulary = MOTION_VOCABULARY[vocabKey] || MOTION_VOCABULARY.entry_fragger_peek;
  
  // Build prompt text
  let promptParts: string[] = [];
  
  // Base character description
  promptParts.push(`A professional esports player${character.agent ? ` (${character.agent})` : ''}, moving in a ${motionStyle} manner.`);
  
  // Emotional context
  if (config.include_emotional_context !== false) {
    const emotionDesc = getEmotionDescription(character.emotional_context);
    promptParts.push(`They appear ${emotionDesc}.`);
  }
  
  // Physical context
  if (config.include_physical_context !== false) {
    const stanceDesc = getStanceDescription(character.current_stance, character.physical_context);
    promptParts.push(`They are currently ${stanceDesc}.`);
  }
  
  // Action description
  if (predictedAction) {
    const actionVerb = vocabulary.verbs[0] || 'move';
    const modifier = vocabulary.modifiers[0] || 'with precision';
    promptParts.push(`The player ${actionVerb}s ${predictedAction.description} ${modifier}, ${predictedAction.motion_style || 'with tactical precision'}.`);
  } else if (sceneDescriptor.tactical_directive) {
    promptParts.push(`The player ${sceneDescriptor.tactical_directive.toLowerCase()}.`);
  }
  
  const promptText = promptParts.join(' ');
  
  return {
    prompt_text: promptText,
    config: {
      duration: predictedAction?.action_type === 'hold_angle' ? 10 : 5,
      action_type: predictedAction?.action_type || 'peek',
      player_role: character.role,
      agent: character.agent,
    },
    scene_descriptor: sceneDescriptor,
    metadata: {
      generated_at: new Date().toISOString(),
      source: 'grid_data',
      confidence_score: predictedAction?.confidence,
    },
  };
}

/**
 * Helper: Get Emotion Description
 */
function getEmotionDescription(emotion: EmotionalState): string {
  const descriptions: Record<EmotionalState, string> = {
    aggressive_confident: 'aggressive and confident',
    cautious_anticipatory: 'cautious and anticipatory',
    focused_pressured: 'focused but pressured',
    calm_collected: 'calm and collected',
    frustrated: 'frustrated',
    desperate: 'desperate',
    dominant: 'dominant and in control',
  };
  return descriptions[emotion] || 'focused';
}

/**
 * Helper: Get Stance Description
 */
function getStanceDescription(
  stance?: CharacterDescriptor['current_stance'],
  physical?: PhysicalContext
): string {
  if (stance === 'crouched') return 'crouched and stationary';
  if (stance === 'moving') return 'moving with controlled steps';
  if (physical?.movement_state === 'running') return 'running with urgency';
  return 'standing in a tactical stance';
}

/**
 * Generate Prompt for Prosthetic Coach AI (Opponent Ghost)
 */
export function generateOpponentGhostPrompt(
  playerData: Partial<PlayerRoundStat>,
  roundData: RoundData,
  gameState: GameStateContext,
  gridSnapshot: Record<string, unknown>
): MotionPrompt {
  const predictedAction = predictNextAction(playerData, roundData, gameState, gridSnapshot);
  const agent = (gridSnapshot.agent as string) || 'Jett';
  const motionStyle = AGENT_MOTION_STYLES[agent] || 'professional and tactical';
  const emotionalState = inferEmotionalState(playerData, roundData, gameState);
  const physicalContext = buildPhysicalContext(playerData, gridSnapshot);
  
  const vocabKey = predictedAction 
    ? `${gridSnapshot.role || 'entry'}_${predictedAction.action_type}` as keyof typeof MOTION_VOCABULARY
    : 'entry_fragger_peek';
  const vocabulary = MOTION_VOCABULARY[vocabKey] || MOTION_VOCABULARY.entry_fragger_peek;
  
  const actionVerb = vocabulary.verbs[0] || 'move';
  const modifier = vocabulary.modifiers[0] || 'with precision';
  
  const stance = gridSnapshot.is_crouching ? 'crouched' : gridSnapshot.is_moving ? 'moving' : 'standing';
  
  let promptText = `A professional esports player (${agent}), moving in a ${motionStyle} manner. `;
  promptText += `They appear ${getEmotionDescription(emotionalState)}. `;
  promptText += `They are currently ${getStanceDescription(stance, physicalContext)}. `;
  
  if (predictedAction) {
    promptText += `The player ${actionVerb}s ${predictedAction.description} ${modifier} with ${predictedAction.urgency} urgency.`;
  } else {
    promptText += `The player maintains tactical positioning.`;
  }
  
  return {
    prompt_text: promptText,
    config: {
      duration: predictedAction?.action_type === 'hold_angle' ? 10 : 5,
      action_type: predictedAction?.action_type || 'peek',
      player_role: (gridSnapshot.role as string) || 'entry',
      agent,
    },
    metadata: {
      generated_at: new Date().toISOString(),
      source: 'prediction',
      confidence_score: predictedAction?.confidence,
    },
  };
}

