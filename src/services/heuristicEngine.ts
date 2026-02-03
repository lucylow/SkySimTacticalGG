// Heuristic Engine for Micro-Analysis
// Identifies player mistakes, predicts intent, and generates motion synthesis prompts

import type { GridDataPacket, PredictedAction } from '@/types/grid';
import type { EnrichedGridData } from '@/types/tactical';
import type { Mistake } from '@/types';

export interface MicroAnalysisResult {
  mistakes: Mistake[];
  predicted_actions: PredictedAction[];
  technical_issues: TechnicalIssue[];
  motion_prompts: MotionPrompt[];
}

export interface TechnicalIssue {
  player_id: string;
  issue_type: 'crosshair_placement' | 'utility_timing' | 'positioning' | 'economy' | 'trading';
  severity: number; // 0-1
  description: string;
  recommendation: string;
  timestamp: number;
}

export interface MotionPrompt {
  player_id: string;
  action_type: 'peek' | 'throw' | 'defuse' | 'plant' | 'rotate' | 'disengage' | 'hold' | 'retake';
  prompt_text: string;
  confidence: number;
  timestamp: number;
  motion_keyframes?: any; // Would be HY-Motion keyframes
}

class HeuristicEngine {
  /**
   * Analyze enriched GRID data for micro-level insights
   */
  analyzeMicro(
    enrichedData: EnrichedGridData[],
    roundPackets: GridDataPacket[]
  ): MicroAnalysisResult {
    const mistakes: Mistake[] = [];
    const predictedActions: PredictedAction[] = [];
    const technicalIssues: TechnicalIssue[] = [];
    const motionPrompts: MotionPrompt[] = [];

    for (let i = 0; i < enrichedData.length; i++) {
      const enriched = enrichedData[i];
      if (!enriched) continue;
      
      const _packet = enriched.raw_data as unknown as GridDataPacket;
      const prevEnriched = i > 0 ? enrichedData[i - 1] : undefined;
      const prevPacket = prevEnriched ? prevEnriched.raw_data as unknown as GridDataPacket : null;

      // Detect mistakes
      const detectedMistakes = this.detectMistakes(enriched, prevPacket, roundPackets);
      mistakes.push(...detectedMistakes);

      // Predict next action
      const predicted = this.predictNextAction(enriched, roundPackets);
      if (predicted) {
        predictedActions.push(predicted);
      }

      // Identify technical issues
      const issues = this.identifyTechnicalIssues(enriched, roundPackets);
      technicalIssues.push(...issues);

      // Generate motion prompts
      const prompt = this.generateMotionPrompt(enriched, predicted);
      if (prompt) {
        motionPrompts.push(prompt);
      }
    }

    return {
      mistakes,
      predicted_actions: predictedActions,
      technical_issues: technicalIssues,
      motion_prompts: motionPrompts,
    };
  }

  /**
   * Detect player mistakes from behavior patterns
   */
  private detectMistakes(
    enriched: EnrichedGridData,
    prevPacket: GridDataPacket | null,
    roundPackets: GridDataPacket[]
  ): Mistake[] {
    const mistakes: Mistake[] = [];
    const packet = enriched.raw_data as unknown as GridDataPacket;
    const player = packet.player;
    const context = packet.match_context;

    // Mistake 1: Predictable positioning
    if (prevPacket && this.isPredictablePosition(player, prevPacket.player)) {
      mistakes.push({
        id: `mistake-${packet.timestamp}-${player.id}-predictable`,
        player_id: player.id,
        player_name: player.id, // Would be resolved from player data
        type: 'predictable_positioning',
        severity: 0.7,
        description: `Player ${player.id} is holding a predictable angle that enemies can pre-aim`,
        recommendation: 'Vary positioning and use off-angles to avoid being pre-aimed',
      });
    }

    // Mistake 2: Poor utility timing
    if (context.round_phase === 'mid_round' && context.spike_status === 'not_planted') {
      const abilities = packet.inventory.abilities;
      const hasUtility = Object.values(abilities).some((a) => a && a.charges > 0);
      
      if (hasUtility && context.round_time_remaining && context.round_time_remaining < 30) {
        // Should have used utility earlier
        mistakes.push({
          id: `mistake-${packet.timestamp}-${player.id}-utility-timing`,
          player_id: player.id,
          player_name: player.id,
          type: 'utility_timing',
          severity: 0.6,
          description: `Player ${player.id} still has utility available with low time remaining`,
          recommendation: 'Use utility earlier in the round to create opportunities',
        });
      }
    }

    // Mistake 3: Poor economy decision
    if (context.round_phase === 'pre_round') {
      const credits = packet.inventory.credits;
      const hasExpensiveWeapon = packet.inventory.primary_weapon && 
        ['Operator', 'Vandal', 'Phantom'].includes(packet.inventory.primary_weapon);
      
      if (credits < 2000 && hasExpensiveWeapon) {
        mistakes.push({
          id: `mistake-${packet.timestamp}-${player.id}-economy`,
          player_id: player.id,
          player_name: player.id,
          type: 'economy',
          severity: 0.8,
          description: `Player ${player.id} bought expensive weapon on low economy`,
          recommendation: 'Save credits for full buy rounds or buy cheaper weapons',
        });
      }
    }

    // Mistake 4: Missing trade opportunity
    const tradeMistake = this.detectMissingTrade(packet, roundPackets);
    if (tradeMistake) {
      mistakes.push(tradeMistake);
    }

    return mistakes;
  }

  /**
   * Check if player position is predictable
   */
  private isPredictablePosition(
    current: PlayerState,
    previous: PlayerState
  ): boolean {
    // If player hasn't moved significantly in last few seconds, position is predictable
    const distance = Math.sqrt(
      Math.pow(current.position.x - previous.position.x, 2) +
      Math.pow(current.position.y - previous.position.y, 2)
    );
    
    return distance < 50; // Very small movement = predictable
  }

  /**
   * Detect missing trade opportunities
   */
  private detectMissingTrade(
    packet: GridDataPacket,
    roundPackets: GridDataPacket[]
  ): Mistake | null {
    // Check if a teammate died recently and player didn't attempt trade
    const recentDeaths = roundPackets.filter((p) => {
      const timeDiff = Math.abs(p.timestamp - packet.timestamp);
      return timeDiff < 2000 && // Within 2 seconds
        p.player.team === packet.player.team &&
        p.player.health === 0;
    });

    if (recentDeaths.length > 0) {
      // Check if player is close enough to trade
      const distance = Math.sqrt(
        Math.pow(
          packet.player.position.x - recentDeaths[0].player.position.x,
          2
        ) +
        Math.pow(
          packet.player.position.y - recentDeaths[0].player.position.y,
          2
        )
      );

      if (distance < 500 && !packet.player.is_moving) {
        // Close enough but not moving to trade
        return {
          id: `mistake-${packet.timestamp}-${packet.player.id}-trade`,
          player_id: packet.player.id,
          player_name: packet.player.id,
          type: 'trading',
          severity: 0.7,
          description: `Player ${packet.player.id} missed a trade opportunity after teammate death`,
          recommendation: 'React faster to teammate deaths and attempt trades',
        };
      }
    }

    return null;
  }

  /**
   * Predict player's next action
   */
  private predictNextAction(
    enriched: EnrichedGridData,
    roundPackets: GridDataPacket[]
  ): PredictedAction | null {
    const packet = enriched.raw_data as GridDataPacket;
    const player = packet.player;
    const context = packet.match_context;
    const tactical = enriched.tactical_context;

    // Predict based on game state and player behavior
    if (context.spike_status === 'planted' && player.team === 'Defender') {
      // Likely to retake
      return {
        action: 'retake',
        confidence: 0.8,
        prompt_snippet: 'Player will attempt retake',
        full_prompt: `${player.agent} will rotate to site and attempt retake with ${player.health} HP`,
        motion_type: 'retake',
      };
    }

    if (context.spike_status === 'not_planted' && player.team === 'Attacker' && 
        context.round_time_remaining && context.round_time_remaining < 30) {
      // Likely to execute
      return {
        action: 'execute',
        confidence: 0.7,
        prompt_snippet: 'Player will execute on site',
        full_prompt: `${player.agent} will execute on site with utility`,
        motion_type: 'throw',
      };
    }

    if (player.is_moving && !player.is_crouching) {
      // Likely to peek
      return {
        action: 'peek',
        confidence: 0.6,
        prompt_snippet: 'Player will peek angle',
        full_prompt: `${player.agent} will aggressively peek angle`,
        motion_type: 'peek',
      };
    }

    return null;
  }

  /**
   * Identify technical issues
   */
  private identifyTechnicalIssues(
    enriched: EnrichedGridData,
    roundPackets: GridDataPacket[]
  ): TechnicalIssue[] {
    const issues: TechnicalIssue[] = [];
    const packet = enriched.raw_data as GridDataPacket;
    const player = packet.player;

    // Check crosshair placement (simplified - would need view angle analysis)
    const viewAngle = player.view_angles;
    const pitch = Math.abs(viewAngle.pitch);
    
    if (pitch > 30) {
      // Looking too high or low
      issues.push({
        player_id: player.id,
        issue_type: 'crosshair_placement',
        severity: 0.6,
        description: `Player ${player.id} has poor crosshair placement (pitch: ${pitch}°)`,
        recommendation: 'Keep crosshair at head level and pre-aim common angles',
        timestamp: packet.timestamp,
      });
    }

    // Check positioning
    if (player.position.z && player.position.z < -10) {
      // Too low (might be in a bad spot)
      issues.push({
        player_id: player.id,
        issue_type: 'positioning',
        severity: 0.5,
        description: `Player ${player.id} is in an unusual position`,
        recommendation: 'Review positioning and use cover more effectively',
        timestamp: packet.timestamp,
      });
    }

    return issues;
  }

  /**
   * Generate motion prompt for HY-Motion
   */
  private generateMotionPrompt(
    enriched: EnrichedGridData,
    predictedAction: PredictedAction | null
  ): MotionPrompt | null {
    if (!predictedAction) return null;

    const packet = enriched.raw_data as GridDataPacket;
    const player = packet.player;
    const emotional = enriched.emotional_inference;
    const tactical = enriched.tactical_context;

    // Build descriptive prompt
    const promptParts = [
      `${player.agent} (${player.role || 'player'})`,
      `in ${tactical.situation_type} situation`,
      `feeling ${emotional.primary_emotion}`,
      `with ${player.health} HP`,
      `performing ${predictedAction.action}`,
    ];

    const promptText = promptParts.join(', ');

    return {
      player_id: player.id,
      action_type: predictedAction.motion_type,
      prompt_text: promptText,
      confidence: predictedAction.confidence,
      timestamp: packet.timestamp,
    };
  }
}

export const heuristicEngine = new HeuristicEngine();

