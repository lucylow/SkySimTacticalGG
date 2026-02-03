// AI Agent Service - Reasons over GRID events
// Detects momentum, star players, economy crashes, etc.

import type { CanonicalEvent, MomentumSignal, StarPlayerSignal, EconomyCrashSignal, ObjectiveRecommendationSignal, ObjectiveState } from '@/types/grid';
import { eventBus } from './eventBus';
import { LolObjectiveEngine } from './lolObjectiveEngine';

interface AgentMemory {
  rounds: Array<{
    round: number;
    winner?: string;
    kills: Array<{ player: string; team: string }>;
  }>;
  playerStats: Record<string, {
    kills: number;
    deaths: number;
    openingKills: number;
    rounds: number;
  }>;
  teamStreaks: Record<string, number>;
  economyHistory: Array<{
    round: number;
    team: string;
    economy: number;
  }>;
  lolState: {
    goldDiff: number;
    visionCount: number;
  };
}

export class AgentService {
  private memory: Map<string, AgentMemory> = new Map();
  private isRunning = false;
  private lolEngine = new LolObjectiveEngine();

  /**
   * Start the agent for a match
   */
  start(matchId: string): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.initializeMemory(matchId);

    // Subscribe to canonical events
    eventBus.subscribeCanonical((event) => {
      if (event.match_id === matchId) {
        this.processEvent(matchId, event);
      }
    });
  }

  /**
   * Stop the agent
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Process an event and generate signals
   */
  private processEvent(matchId: string, event: CanonicalEvent): void {
    const memory = this.memory.get(matchId);
    if (!memory) return;

    switch (event.event_type) {
      case 'ROUND_START':
        this.handleRoundStart(event, memory);
        break;
      case 'KILL':
        this.handleKill(matchId, event, memory);
        break;
      case 'ROUND_END':
        this.handleRoundEnd(matchId, event, memory);
        break;
      case 'OBJECTIVE':
        this.handleObjective(matchId, event, memory);
        break;
      case 'ECONOMY_UPDATE':
        this.handleEconomyUpdate(matchId, event, memory);
        break;
    }
  }

  private handleObjective(matchId: string, event: CanonicalEvent, memory: AgentMemory): void {
    const payload = event.payload as { type?: string; team?: string } | undefined;
    if (!payload?.type) return;

    // Map game objective to engine objective
    const objectiveMapping: Record<string, 'DRAGON' | 'BARON' | 'HERALD' | 'TOWER'> = {
      'dragon': 'DRAGON',
      'baron': 'BARON',
      'herald': 'HERALD',
      'tower': 'TOWER'
    };

    const objective = objectiveMapping[payload.type.toLowerCase()];
    if (!objective) return;

    // In a real scenario, we'd fetch actual proximity and state
    // Here we use current memory and some defaults for demonstration
    const state: ObjectiveState = {
      objective,
      timeToSpawn: 0,
      matchTime: 1500, // Placeholder
      teamGoldDiff: memory.lolState.goldDiff,
      allyCountNear: 4,
      enemyCountNear: 2,
      visionInPit: memory.lolState.visionCount,
      enemyVisionInPit: 1,
      ultimatesUp: 4,
      enemyUltimatesUp: 2,
      smiteReady: true,
      enemySmiteReady: false,
      sidelanePressure: true,
      playerHpPercent: 0.85
    };

    const decision = objective === 'BARON' 
      ? this.lolEngine.decideBaron(state)
      : this.lolEngine.decideDragon(state);

    const signal: ObjectiveRecommendationSignal = {
      id: this.generateId(),
      agent: 'lol_objective_coach',
      match_id: matchId,
      type: 'OBJECTIVE_RECOMMENDATION',
      confidence: decision.confidence,
      explanation: {
        ...decision,
        objective
      },
      timestamp: new Date().toISOString(),
      status: 'PENDING_REVIEW',
    };

    eventBus.publishSignal(signal);
  }

  private handleEconomyUpdate(matchId: string, event: CanonicalEvent, memory: AgentMemory): void {
    const payload = event.payload as { gold_diff?: number } | undefined;
    if (payload?.gold_diff !== undefined) {
      memory.lolState.goldDiff = payload.gold_diff;
    }
  }

  private handleRoundStart(event: CanonicalEvent, memory: AgentMemory): void {
    const payload = event.payload as { economy?: Record<string, number> } | undefined;
    const round = event.round || 0;

    // Track economy
    if (payload?.economy) {
      Object.entries(payload.economy).forEach(([team, economy]) => {
        memory.economyHistory.push({ round, team, economy });
      });
    }

    // Initialize round
    memory.rounds.push({
      round,
      kills: [],
    });
  }

  private handleKill(matchId: string, event: CanonicalEvent, memory: AgentMemory): void {
    if (!event.actor || !event.team) return;

    const playerId = event.actor.replace('player:', '');
    const currentRound = memory.rounds[memory.rounds.length - 1];

    if (currentRound) {
      currentRound.kills.push({ player: playerId, team: event.team });
    }

    // Update player stats
    if (!memory.playerStats[playerId]) {
      memory.playerStats[playerId] = {
        kills: 0,
        deaths: 0,
        openingKills: 0,
        rounds: 0,
      };
    }

    memory.playerStats[playerId].kills++;
    
    // Check for opening kill (first kill in round)
    if (currentRound && currentRound.kills.length === 1) {
      memory.playerStats[playerId].openingKills++;
    }

    // Check momentum (3+ kills in a row by same team)
    this.checkMomentum(matchId, memory);
    
    // Check star player (high kill percentage)
    this.checkStarPlayer(matchId, playerId, memory);
  }

  private handleRoundEnd(matchId: string, event: CanonicalEvent, memory: AgentMemory): void {
    const payload = event.payload as { winner?: string } | undefined;
    const round = event.round || 0;
    const currentRound = memory.rounds[memory.rounds.length - 1];

    if (currentRound && payload?.winner) {
      currentRound.winner = payload.winner;
    }

    // Update team streaks
    const winner = payload?.winner;
    if (winner) {
      Object.keys(memory.teamStreaks).forEach((team) => {
        if (team === winner) {
          memory.teamStreaks[team] = (memory.teamStreaks[team] || 0) + 1;
        } else {
          memory.teamStreaks[team] = 0;
        }
      });
    }

    // Check economy crash
    this.checkEconomyCrash(matchId, round, memory);
  }

  private checkMomentum(matchId: string, memory: AgentMemory): void {
    const currentRound = memory.rounds[memory.rounds.length - 1];
    if (!currentRound) return;

    // Check if team has 3+ consecutive kills
    const recentKills = currentRound.kills.slice(-3);
    if (recentKills.length >= 3) {
      const firstKill = recentKills[0];
      if (firstKill) {
        const allSameTeam = recentKills.every((k) => k.team === firstKill.team);
        if (allSameTeam) {
          const team = firstKill.team;
          const streak = memory.teamStreaks[team] || 0;
          
          if (streak >= 3) {
            const lastKill = recentKills[recentKills.length - 1];
            const signal: MomentumSignal = {
              id: this.generateId(),
              agent: 'momentum_reasoner',
              match_id: matchId,
              type: 'MOMENTUM_SHIFT',
              team,
              confidence: 0.87,
              explanation: {
                rounds_won: streak,
                eco_wins: 0, // Would need to track this
                key_player: lastKill?.player || 'unknown',
              },
              timestamp: new Date().toISOString(),
              status: 'PENDING_REVIEW',
            };
            eventBus.publishSignal(signal);
          }
        }
      }
    }
  }

  private checkStarPlayer(matchId: string, playerId: string, memory: AgentMemory): void {
    const player = memory.playerStats[playerId];
    if (!player) return;

    const totalRounds = memory.rounds.length;
    if (totalRounds < 3) return; // Need some data

    const killPercentage = player.kills / (totalRounds * 5); // Rough estimate
    const openingKillRate = player.openingKills / totalRounds;

    if (killPercentage >= 0.3 && openingKillRate >= 0.2) {
      const signal: StarPlayerSignal = {
        id: this.generateId(),
        agent: 'star_player_detector',
        match_id: matchId,
        type: 'STAR_PLAYER',
        player: playerId,
        confidence: 0.75,
        explanation: {
          kill_percentage: killPercentage,
          opening_kill_rate: openingKillRate,
          impact_score: killPercentage * 0.7 + openingKillRate * 0.3,
        },
        timestamp: new Date().toISOString(),
        status: 'PENDING_REVIEW',
      };
      eventBus.publishSignal(signal);
    }
  }

  private checkEconomyCrash(matchId: string, round: number, memory: AgentMemory): void {
    // Check last 2 rounds for economy drops
    const recentEconomy = memory.economyHistory
      .filter((e) => e.round >= round - 2 && e.round <= round)
      .sort((a, b) => a.round - b.round);

    if (recentEconomy.length < 4) return; // Need 2 rounds of data

    // Group by team
    const byTeam: Record<string, number[]> = {};
    recentEconomy.forEach((e) => {
      if (!byTeam[e.team]) {
        byTeam[e.team] = [];
      }
      byTeam[e.team].push(e.economy);
    });

    // Check for significant drops
    Object.entries(byTeam).forEach(([team, economies]) => {
      if (economies.length >= 2) {
        const firstEconomy = economies[0] ?? 0;
        const lastEconomy = economies[economies.length - 1] ?? 0;
        const drop = firstEconomy - lastEconomy;
        if (drop > 10000 && lastEconomy < 5000) {
          const signal: EconomyCrashSignal = {
            id: this.generateId(),
            agent: 'economy_analyzer',
            match_id: matchId,
            type: 'ECONOMY_CRASH',
            team,
            confidence: 0.8,
            explanation: {
              economy_before: firstEconomy,
              economy_after: lastEconomy,
              forced_buys: 0, // Would need to track this
            },
            timestamp: new Date().toISOString(),
            status: 'PENDING_REVIEW',
          };
          eventBus.publishSignal(signal);
        }
      }
    });
  }

  private initializeMemory(matchId: string): void {
    this.memory.set(matchId, {
      rounds: [],
      playerStats: {},
      teamStreaks: {},
      economyHistory: [],
      lolState: {
        goldDiff: 0,
        visionCount: 0,
      }
    });
  }

  private generateId(): string {
    return `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const agentService = new AgentService();
