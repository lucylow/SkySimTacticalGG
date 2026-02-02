/**
 * Heuristic Action Prediction Engine
 * Translates GRID data packets into predicted player actions and motion prompts
 */

import type { GridDataPacket, PredictedAction } from '@/types/grid';

/**
 * Predicts a player action from a GRID data packet using heuristic rules
 */
export function predictActionFromGrid(dataPacket: GridDataPacket): PredictedAction {
  const { player, inventory, match_context } = dataPacket;

  // RULE 1: Check for CRITICAL LOW HEALTH - Survival instinct overrides everything
  if (player.health < 30) {
    return {
      action: 'disengage_to_heal_or_save',
      confidence: 0.85,
      prompt_snippet: 'stumbles back, clutching their side, their movement panicked as they seek immediate cover to disengage from the fight.',
      full_prompt: '',
      motion_type: 'disengage',
    };
  }

  // RULE 2: React to SPIKE STATUS
  if (match_context.spike_status === 'planted') {
    const timeSincePlant = dataPacket.timestamp - (match_context.spike_plant_time || 0);

    // Defender Logic
    if (player.team === 'Defender') {
      if (timeSincePlant < 3.0) {
        return {
          action: 'retake_immediately',
          confidence: 0.9,
          prompt_snippet: 'bursts out of cover with decisive speed, weapon raised, to challenge the planter.',
          full_prompt: '',
          motion_type: 'retake',
        };
      } else if (inventory.abilities.q && inventory.abilities.q.charges > 0) {
        // Has mollies/smokes
        return {
          action: 'delay_with_utility',
          confidence: 0.8,
          prompt_snippet: 'leans out briefly to throw a line-up utility (molotov/poison cloud) onto the spike with practiced precision.',
          full_prompt: '',
          motion_type: 'throw',
        };
      } else {
        return {
          action: 'hold_retake_angle',
          confidence: 0.75,
          prompt_snippet: 'holds a tight, off-angle retake position, body perfectly still, focusing intently on the sound of the spike.',
          full_prompt: '',
          motion_type: 'hold',
        };
      }
    }
    // Attacker Logic (post-plant)
    else {
      const aliveCount = match_context.player_locations_alive.length;
      if (aliveCount <= 2) {
        return {
          action: 'play_for_time',
          confidence: 0.85,
          prompt_snippet: 'falls back to a safe, hidden post-plant position, minimizing movement and listening intently.',
          full_prompt: '',
          motion_type: 'hold',
        };
      } else {
        return {
          action: 'aggressive_peek',
          confidence: 0.7,
          prompt_snippet: 'makes a swift, jiggling peek from an unexpected angle to catch rotating defenders off-guard.',
          full_prompt: '',
          motion_type: 'peek',
        };
      }
    }
  }

  // RULE 3: Determine AGGRESSION based on economy & weapon
  let weaponContext = '';
  if (['Vandal', 'Phantom'].includes(inventory.primary_weapon) && player.health > 70) {
    weaponContext = 'confidently with their rifle';
  } else if (inventory.primary_weapon === 'Operator') {
    weaponContext = 'with the deliberate, heavy slowness of a sniper scoping in';
  } else {
    // Eco/Save round
    weaponContext = 'with the cautious, hesitant movements of someone under-equipped';
  }

  // RULE 4: Default behavior based on role/agent
  let defaultStyle = '';
  if (['Jett', 'Reyna'].includes(player.agent)) {
    defaultStyle = 'makes light, acrobatic, and aggressive micro-adjustments';
  } else if (['Viper', 'Brimstone'].includes(player.agent)) {
    defaultStyle = 'moves deliberately, setting up utility with calculated gestures';
  } else {
    defaultStyle = 'holds a fundamental tactical stance';
  }

  // RULE 5: In gunfight state (mid-round, not planted)
  if (match_context.round_phase === 'mid_round' && match_context.spike_status === 'not_planted') {
    if (player.health < 50) {
      return {
        action: 'disengage',
        confidence: 0.8,
        prompt_snippet: 'swiftly disengages from the fight, using cover to break line of sight.',
        full_prompt: '',
        motion_type: 'disengage',
      };
    } else {
      return {
        action: 're_peek_hold',
        confidence: 0.7,
        prompt_snippet: 'holds angle with focus, ready to re-peek with precise crosshair placement.',
        full_prompt: '',
        motion_type: 'peek',
      };
    }
  }

  // Default action
  const actionPrediction: PredictedAction = {
    action: 'tactical_positioning',
    confidence: 0.6,
    prompt_snippet: defaultStyle,
    full_prompt: '',
    motion_type: 'hold',
  };

  // Compose the full motion prompt
  const crouchState = player.is_crouching ? 'crouched and stationary' : 'ready to strafe';
  actionPrediction.full_prompt = `A ${player.agent} agent, ${weaponContext}. They appear ${crouchState}. ${defaultStyle}. ${actionPrediction.prompt_snippet}`;

  return actionPrediction;
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
 * Creates a sample GRID data packet for testing
 */
export function createSampleGridPacket(): GridDataPacket {
  return {
    timestamp: Date.now() / 1000,
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
}

