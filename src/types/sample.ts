// src/types/mock.ts

export type ValorantPlayer = {
  id: string;
  name: string;
  agent: string;
  mmr: number;
  recentScore: number;
  preferredSide: 'attack' | 'defense';
  stats: {
    adr: number;
    kpr: number;
    fk_rate: number;
    utility_uses: number;
    clutch_1vX: number;
  };
};

export type ValorantRound = {
  id: string;
  roundIndex: number;
  startTime: number;
  durationSec: number;
  attackersAlive: number;
  defendersAlive: number;
  spikePlanted: boolean;
  winner: 'attackers' | 'defenders';
  majorEvents: any[];
};

export type ValorantMatch = {
  id: string;
  title: string;
  map: string;
  startedAt: number;
  durationSec: number;
  players: ValorantPlayer[];
  rounds: ValorantRound[];
  finalScore: { attackers: number; defenders: number };
  replayFrames?: any[];
};

export type LolPlayer = {
  id: string;
  name: string;
  champion: string;
  role: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
  mmr: number;
  stats: {
    csAt10: number;
    csAt15: number;
    dpm: number;
    kp: number;
    visionScore: number;
  };
  perGameRatings: number[];
};

export type LolObjective = {
  id: string;
  type: string;
  minute: number;
  team: 'blue' | 'red';
  participants: string[];
  value: any;
};

export type LolMatch = {
  id: string;
  title: string;
  map: string;
  durationMinutes: number;
  startedAt: number;
  players: LolPlayer[];
  objectives: LolObjective[];
  timeline: any[];
  replayFrames?: any[];
};
