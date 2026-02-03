
export type ValorantPlayerAggregate = {
  playerId: string;
  teamId: string;
  matches: number;
  rounds: number;
  kills: number;
  deaths: number;
  assists: number;
  firstKills: number;
  firstDeaths: number;
  multiKillRounds: number;
  damageDealt: number;
  fullBuyRounds: number;
  fullBuyWins: number;
  ecoRounds: number;
  bonusRounds: number;
  bonusWins: number;
  clutchAttempts: number;
  clutchWins: number;
  postPlantAliveRounds: number;
  postPlantWinsWhenAlive: number;
  perMapRatings: number[];
  flashAssists: number;
  siteHoldTime?: number;
  defaultWinrate: number;
  flankKills: number;
};

export type LolRole = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';

export type LolPlayerAggregate = {
  playerId: string;
  role: LolRole;
  games: number;
  avgCsAt10: number;
  avgCsAt15: number;
  avgGoldDiffAt10: number;
  avgGoldDiffAt15: number;
  avgXpDiffAt10: number;
  soloKills: number;
  soloDeaths: number;
  avgK: number;
  avgD: number;
  avgA: number;
  avgDpm: number;
  avgKp: number;
  avgDamageShare: number;
  avgGoldShare: number;
  dragParticipations: number;
  heraldParticipations: number;
  baronParticipations: number;
  towerParticipations: number;
  teamObjectives: number;
  perGameRatings: number[];
};
