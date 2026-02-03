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
      if (match_context.round_phase === 'retake' || timeSincePlant < 3.0) {
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
    } else {
      // Attacker Logic (Post-plant)
      return {
        action: 'post_plant_hold',
        confidence: 0.85,
        prompt_snippet: 'crouches in a hidden corner, ears tuned for the defuse sound, ready to swing.',
        full_prompt: `A ${player.agent} agent, holding post-plant. crouches in a hidden corner, waiting for defuse.`,
        motion_type: 'hold',
      };
    }
  }

  // RULE 2.5: Defusing
  if (match_context.spike_status === 'planted' && player.team === 'Defender' && player.is_moving === false) {
    // If we're on site and not moving, we might be defusing (simplified)
    return {
      action: 'defuse_spike',
      confidence: 0.7,
      prompt_snippet: 'kneels down by the spike, hands working frantically on the defuser while glancing around nervously.',
      full_prompt: `A ${player.agent} agent, defusing. kneels down, hands working on defuser, glancing around.`,
      motion_type: 'defuse',
    };
  }

  // RULE 3: ULTIMATE READY - High impact play potential
  if (inventory.abilities.x && inventory.abilities.x.charges > 0) {
    return {
      action: 'ultimate_execution',
      confidence: 0.75,
      prompt_snippet: 'enters a heightened state of focus, channeling their ultimate ability with a dramatic flourish.',
      full_prompt: `A ${player.agent} agent, activating ultimate. enters a heightened state of focus, channeling their ultimate.`,
      motion_type: 'ultimate',
    };
  }

  // RULE 4: AGGRESSIVE PUSH - Based on movement and health
  if (player.is_moving && player.health > 80 && inventory.primary_weapon !== 'Knife') {
    return {
      action: 'aggressive_entry',
      confidence: 0.7,
      prompt_snippet: 'slices the pie around the corner with aggressive intent, crosshair glued to common head-level angles.',
      full_prompt: `A ${player.agent} agent, pushing aggressively. slices the pie around the corner with aggressive intent.`,
      motion_type: 'peek',
    };
  }

  // Default VALORANT action
  const defaultActionSnippet = player.is_moving 
    ? 'moves with tactical purpose, clearing angles methodically' 
    : 'holds a fundamental tactical stance, crosshair placed perfectly';
  
  return {
    action: 'tactical_positioning',
    confidence: 0.6,
    prompt_snippet: defaultActionSnippet,
    full_prompt: `A ${player.agent} agent. ${defaultActionSnippet}.`,
    motion_type: player.is_moving ? 'rotate' : 'hold',
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

  // RULE: Ability casting
  if (player.mana < 50 && player.is_attacking) {
    return {
      action: 'out_of_mana_struggle',
      confidence: 0.7,
      prompt_snippet: 'clicks desperately, appearing frustrated as their abilities fail to fire, resorting to basic attacks.',
      full_prompt: `${player.champion} is out of mana. clicks desperately, resorting to basic attacks.`,
      motion_type: 'auto_attack',
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

  // RULE: OBJECTIVE FOCUS - Baron/Dragon presence
  if (match_context.objectives.baron_alive || match_context.objectives.dragon_count > 3) {
    const isNearObjective = true; // Heuristic, ideally check position
    if (isNearObjective) {
      return {
        action: 'objective_contest',
        confidence: 0.8,
        prompt_snippet: 'positions themselves strategically around the pit, looking for an opportunity to steal or secure the objective.',
        full_prompt: `${player.champion} is near objective. positions themselves strategically around the pit, looking to secure it.`,
        motion_type: 'hold',
      };
    }
  }

  // RULE: High Level Aggression
  if (player.level >= 6 && player.is_attacking) {
    return {
      action: 'ultimate_engage',
      confidence: 0.8,
      prompt_snippet: 'unleashes their signature ultimate ability with an explosive burst of energy and stylized motion.',
      full_prompt: `${player.champion} uses ultimate! unleashes signature ability with explosive energy.`,
      motion_type: 'ability',
    };
  }

  // RULE: LATE GAME CARRY - High level and gold
  if (player.level > 15 && inventory.gold > 3000) {
    return {
      action: 'carry_positioning',
      confidence: 0.75,
      prompt_snippet: 'moves with the confidence of a fed carry, maintaining maximum range while searching for a high-priority target.',
      full_prompt: `${player.champion} is fed. moves with confidence, maintaining maximum range while searching for targets.`,
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
 * Generates Sample motion keyframes based on predicted action
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

    // Sample joint rotations (24 joints for SMPL model)
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
      } else if (action.motion_type === 'ultimate') {
        // Simulate ultimate ability activation
        if (j === 0) { // Root
          const scale = 1 + Math.sin(t * Math.PI) * 0.2;
          rotation = { x: 0, y: 0, z: 0, w: 1 }; // Reset for now, focus on root pos for effect
        }
        if (j >= 10 && j <= 15) { // Torso/Arms
          const angle = Math.sin(t * Math.PI * 4) * 0.2;
          const halfAngle = angle * 0.5;
          rotation = { x: Math.sin(halfAngle), y: 0, z: 0, w: Math.cos(halfAngle) };
        }
      } else if (action.motion_type === 'kite') {
        // Simulate rhythmic kiting
        if (j === 0) {
          const shift = Math.sin(t * Math.PI * 6) * 0.1;
          const halfAngle = shift * 0.5;
          rotation = { x: 0, y: Math.sin(halfAngle), z: 0, w: Math.cos(halfAngle) };
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
      } else if (action.motion_type === 'defuse') {
        // Simulate defusing motion (kneeling/working)
        if (j === 0) { // Root
          rootPosition[1] = -0.5; // Lower to ground
        }
        if (j >= 10 && j <= 15) { // Arms
          const move = Math.sin(t * Math.PI * 10) * 0.1;
          rotation = { x: 0.5 + move, y: 0, z: 0, w: 1 };
        }
      } else if (action.motion_type === 'ability' || action.motion_type === 'auto_attack') {
        // Simulate ability casting or attacking
        if (j === 3 || j === 6) { // Arms
          const angle = Math.sin(t * Math.PI * 8) * 0.5;
          const halfAngle = angle * 0.5;
          rotation = { x: Math.sin(halfAngle), y: 0, z: 0, w: Math.cos(halfAngle) };
        }
      } else if (action.motion_type === 'retake') {
        // High speed forward movement
        rootPosition = [0, 0, t * 4];
        if (j === 0) {
          rotation = { x: 0.1, y: 0, z: 0, w: 1 }; // Leaning forward
        }
      }

      joints.push(rotation);
    }

    // Root position based on action
    if (action.motion_type === 'disengage') {
      rootPosition = [-t * 2, 0, 0];
    } else if (action.motion_type === 'peek') {
      rootPosition = [Math.sin(t * Math.PI) * 0.5, 0, 0];
    } else if (action.motion_type === 'ultimate') {
      rootPosition = [0, Math.sin(t * Math.PI) * 0.3, 0]; // Float up slightly
    } else if (action.motion_type === 'kite') {
      rootPosition = [Math.cos(t * Math.PI * 4) * 0.4, 0, Math.sin(t * Math.PI * 4) * 0.2];
    } else if (action.motion_type === 'defuse') {
      rootPosition = [0, -0.4, 0]; // Stay low
    } else if (action.motion_type === 'retake') {
      rootPosition = [0, 0, t * 5];
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
        is_moving: true,
      },
      inventory: {
        primary_weapon: 'Vandal',
        secondary_weapon: 'Ghost',
        abilities: {
          c: { name: 'Toxic Screen', charges: 1 },
          q: { name: 'Poison Cloud', charges: 0 },
          e: { name: 'Snake Bite', charges: 2 },
          x: { name: 'Viper\'s Pit', charges: 1 },
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
          baron_alive: true,
          dragon_count: 4,
          towers_destroyed: 3,
        },
        team_gold_diff: -1500,
      },
    };
  }
}


