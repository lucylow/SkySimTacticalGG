/**
 * Heuristic Action Prediction Engine
 * Translates GRID data packets into predicted player actions and motion prompts
 */

import type { 
  GridDataPacket, 
  PredictedAction, 
  PlayerState, 
  InventoryState, 
  MatchContext,
  LoLPlayerState,
  LoLInventoryState,
  LoLMatchContext,
  GameType
} from '@/types/grid';

/**
 * Predicts a player action from a GRID data packet using heuristic rules
 */
export function predictActionFromGrid(dataPacket: GridDataPacket): PredictedAction {
  if (dataPacket.game === 'VALORANT') {
    return predictValorantAction(
      dataPacket.player as PlayerState, 
      dataPacket.inventory as InventoryState, 
      dataPacket.match_context as MatchContext,
      dataPacket.timestamp
    );
  } else {
    return predictLoLAction(
      dataPacket.player as LoLPlayerState, 
      dataPacket.inventory as LoLInventoryState, 
      dataPacket.match_context as LoLMatchContext,
      dataPacket.timestamp
    );
  }
}

function predictValorantAction(
  player: PlayerState, 
  inventory: InventoryState, 
  match_context: MatchContext,
  timestamp: number
): PredictedAction {
  // RULE 1: Check for CRITICAL LOW HEALTH - Survival instinct overrides everything
  if (player.health < 30) {
    return {
      action: 'disengage_to_heal_or_save',
      confidence: 0.85,
      prompt_snippet: 'stumbles back, clutching their side, their movement panicked as they seek immediate cover to disengage from the fight.',
      full_prompt: `A ${player.agent} agent, wounded. They appear panicked. stumbles back, clutching their side, seeking immediate cover.`,
      motion_type: 'disengage',
    };
  }

  // RULE 2: React to SPIKE STATUS
  if (match_context.spike_status === 'planted') {
    const timeSincePlant = timestamp - (match_context.spike_plant_time || 0);

    // Defender Logic
    if (player.team === 'Defender') {
      if (timeSincePlant < 3.0) {
        return {
          action: 'retake_immediately',
          confidence: 0.9,
          prompt_snippet: 'bursts out of cover with decisive speed, weapon raised, to challenge the planter.',
          full_prompt: `A ${player.agent} agent, moving fast. bursts out of cover with decisive speed, weapon raised.`,
          motion_type: 'retake',
        };
      } else if (inventory.abilities.q && inventory.abilities.q.charges > 0) {
        return {
          action: 'delay_with_utility',
          confidence: 0.8,
          prompt_snippet: 'leans out briefly to throw a line-up utility onto the spike with practiced precision.',
          full_prompt: `A ${player.agent} agent, using utility. leans out briefly to throw a line-up utility onto the spike.`,
          motion_type: 'throw',
        };
      }
    }
  }

  // Default VALORANT action
  return {
    action: 'tactical_positioning',
    confidence: 0.6,
    prompt_snippet: 'holds a fundamental tactical stance',
    full_prompt: `A ${player.agent} agent, holding a fundamental tactical stance.`,
    motion_type: 'hold',
  };
}

function predictLoLAction(
  player: LoLPlayerState, 
  inventory: LoLInventoryState, 
  match_context: LoLMatchContext,
  timestamp: number
): PredictedAction {
  // LoL Specific Rules
  if (player.health < player.level * 50) { // Simple low health heuristic
    return {
      action: 'recall_to_base',
      confidence: 0.9,
      prompt_snippet: 'steps back into a safe brush and begins their recall animation, eyes scanning for incoming threats.',
      full_prompt: `${player.champion} is low on health. steps back into a safe brush and begins their recall animation.`,
      motion_type: 'disengage',
    };
  }

  if (player.is_attacking) {
    return {
      action: 'auto_attack_kite',
      confidence: 0.85,
      prompt_snippet: 'performs a rhythmic kiting motion, alternating between precise auto-attacks and strategic micro-movements.',
      full_prompt: `${player.champion} is engaging. performs a rhythmic kiting motion, alternating between attacks and movement.`,
      motion_type: 'kite',
    };
  }

  if (match_context.team_gold_diff < -3000) {
    return {
      action: 'defensive_farming',
      confidence: 0.75,
      prompt_snippet: 'plays cautiously near the tower, focusing on last-hitting minions while maintaining a safe distance.',
      full_prompt: `${player.champion} is behind in gold. plays cautiously near the tower, focusing on last-hitting.`,
      motion_type: 'hold',
    };
  }

  // Default LoL action
  return {
    action: 'laning_phase_movement',
    confidence: 0.6,
    prompt_snippet: 'moves with fluid, constant motion, ready to dodge skillshots or trade with the opponent.',
    full_prompt: `${player.champion} is laning. moves with fluid, constant motion, ready to dodge skillshots.`,
    motion_type: 'hold',
  };
}

/**
 * Generates mock motion keyframes based on predicted action
 * In production, this would call HY-Motion 1.0 API
 */
export function generateMotionKeyframes(
  action: PredictedAction,
  duration: number = 3.0,
  fps: number = 30
): Array<{ timestamp: number; joints: Array<{ x: number; y: number; z: number; w: number }>; root_position: [number, number, number] }> {
  const frames: Array<{ timestamp: number; joints: Array<{ x: number; y: number; z: number; w: number }>; root_position: [number, number, number] }> = [];
  const frameCount = Math.floor(duration * fps);

  // Simplified: Generate basic motion based on action type
  for (let i = 0; i < frameCount; i++) {
    const t = i / frameCount;
    const timestamp = (i / fps);

    // Mock joint rotations (24 joints for SMPL model)
    const joints: Array<{ x: number; y: number; z: number; w: number }> = [];
    for (let j = 0; j < 24; j++) {
      // Generate simple rotation based on action type
      let rotation = { x: 0, y: 0, z: 0, w: 1 };
      
      if (action.motion_type === 'throw') {
        // Simulate throwing motion
        if (j === 3) { // Right arm
          const angle = t * Math.PI;
          const halfAngle = angle * 0.5;
          const s = Math.sin(halfAngle);
          // Simple quaternion for rotation around (1, 0.5, 0) axis
          rotation = {
            x: s * 0.894, // normalized (1, 0.5, 0)
            y: s * 0.447,
            z: 0,
            w: Math.cos(halfAngle),
          };
        }
      } else if (action.motion_type === 'peek') {
        // Simulate peeking motion
        if (j === 0) { // Root
          const angle = Math.sin(t * Math.PI * 2) * 0.3;
          const halfAngle = angle * 0.5;
          // Rotation around Y axis
          rotation = {
            x: 0,
            y: Math.sin(halfAngle),
            z: 0,
            w: Math.cos(halfAngle),
          };
        }
      } else if (action.motion_type === 'disengage') {
        // Simulate retreating motion
        if (j === 0) { // Root
          const halfAngle = (Math.PI * 0.5) * 0.5;
          // 90 degree rotation around Y axis
          rotation = {
            x: 0,
            y: Math.sin(halfAngle),
            z: 0,
            w: Math.cos(halfAngle),
          };
        }
      }

      joints.push(rotation);
    }

    // Root position based on action
    let rootPosition: [number, number, number] = [0, 0, 0];
    if (action.motion_type === 'disengage') {
      rootPosition = [-t * 2, 0, 0];
    } else if (action.motion_type === 'peek') {
      rootPosition = [Math.sin(t * Math.PI) * 0.5, 0, 0];
    } else if (action.motion_type === 'throw') {
      rootPosition = [0, 0, 0];
    }

    frames.push({
      timestamp,
      joints,
      root_position: rootPosition,
    });
  }

  return frames;
}

/**
 * Fetches the latest match state from the GRID data provider
 */
export function getLatestMatchSnapshot(game: GameType = 'VALORANT'): GridDataPacket {
  if (game === 'VALORANT') {
    return {
      timestamp: Date.now() / 1000,
      game: 'VALORANT',
      player: {
        id: 'player_viper_1',
        team: 'Defender',
        agent: 'Viper',
        position: { x: 12.5, y: 0, z: -18.2 },
        health: 45,
        armor: 25,
        view_angles: { yaw: 145.6, pitch: -3.2 },
        is_crouching: true,
        is_moving: false,
      },
      inventory: {
        primary_weapon: 'Vandal',
        secondary_weapon: 'Ghost',
        abilities: {
          c: { name: 'Toxic Screen', charges: 1 },
          q: { name: 'Poison Cloud', charges: 0 },
          e: { name: 'Snake Bite', charges: 2 },
        },
        credits: 1200,
      },
      match_context: {
        map: 'Bind',
        round_time_remaining: 38.5,
        round_phase: 'post_plant',
        spike_status: 'planted',
        spike_plant_time: (Date.now() / 1000) - 5.57,
        player_locations_alive: ['player_viper_1', 'player_sova_1', 'player_jett_2'],
        site_control: 'Attacker',
      },
    };
  } else {
    return {
      timestamp: Date.now() / 1000,
      game: 'LEAGUE_OF_LEGENDS',
      player: {
        id: 'player_jinx_1',
        team: 'Blue',
        champion: 'Jinx',
        position: { x: 12000, y: 0, z: 4500 },
        health: 850,
        mana: 400,
        level: 11,
        is_moving: true,
        is_attacking: true,
      },
      inventory: {
        items: ['Kraken Slayer', 'Berserker\'s Greaves'],
        summoner_spells: ['Flash', 'Heal'],
        gold: 1200,
      },
      match_context: {
        map: 'Summoner\'s Rift',
        game_time: 1240,
        objectives: {
          baron_alive: false,
          dragon_count: 2,
          towers_destroyed: 3,
        },
        team_gold_diff: -1500,
      },
    };
  }
}

