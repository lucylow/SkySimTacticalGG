
import { ValorantPlayerAggregate, LolPlayerAggregate, LolRole } from '../types/scouting';
import { scoreValorantPlayer, scoreLolPlayer } from './playerScoring';

export interface ValorantPlayer extends ValorantPlayerAggregate {
  id: string;
  name: string;
  primaryRole: 'Duelist' | 'Controller' | 'Initiator' | 'Sentinel' | 'Flex';
  agentPool: string[];
  agentProficiency: Record<string, number>;
  recentScore: number;
  mapPreference: Record<string, number>;
}

export interface LolPlayer extends LolPlayerAggregate {
  id: string;
  name: string;
  primaryRole: LolRole;
  championPool: string[];
  championProficiency: Record<string, number>;
  recentScore: number;
  laningStrength: number;
  macroScore: number;
}

export interface TeamConfig {
  requiredRoles: string[];
  preferredAgents?: string[];
  mapName?: string;
  minTotalScore: number;
}

export function generateCombinations<T>(candidates: T[], size: number): T[][] {
  if (size === 0) return [[]];
  const result: T[][] = [];
  function recurse(start: number, current: T[]) {
    if (current.length === size) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < candidates.length; i++) {
      current.push(candidates[i]);
      recurse(i + 1, current);
      current.pop();
    }
  }
  recurse(0, []);
  return result;
}

export function calculateValorantSynergy(players: ValorantPlayer[], config: TeamConfig): number {
  let totalSynergy = 0;
  const roleCoverage = config.requiredRoles.every(role =>
    players.some(p => p.primaryRole === role || p.primaryRole === 'Flex')
  ) ? 1.0 : 0.6;
  totalSynergy += roleCoverage * 0.3;

  if (config.preferredAgents) {
    const agentProficiency = config.preferredAgents.reduce((sum, agent) => {
      const bestPlayer = players.reduce((best, p) =>
        (p.agentProficiency[agent] || 0) > (best.agentProficiency[agent] || 0) ? p : best
      , players[0]);
      return sum + (bestPlayer.agentProficiency[agent] || 0) / 100;
    }, 0) / config.preferredAgents.length;
    totalSynergy += agentProficiency * 0.25;
  }

  const avgPerformance = players.reduce((sum, p) => sum + p.recentScore, 0) / 5;
  totalSynergy += (avgPerformance / 100) * 0.25;
  return totalSynergy;
}

export function generateValorantRoster(candidates: ValorantPlayer[], config: TeamConfig) {
  const combinations = generateCombinations(candidates, 5);
  let bestRoster: ValorantPlayer[] | null = null;
  let bestScore = -Infinity;

  for (const combo of combinations) {
    const synergy = calculateValorantSynergy(combo, config);
    const totalScore = combo.reduce((sum, p) => sum + p.recentScore, 0);
    if (totalScore >= config.minTotalScore && synergy > bestScore) {
      bestScore = synergy;
      bestRoster = combo;
    }
  }
  return bestRoster ? { roster: bestRoster, score: Math.round(bestScore * 100) } : null;
}
