
import { ValorantPlayerAggregate, LolPlayerAggregate } from '../types/scouting';

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export function scoreValorantPlayer(p: ValorantPlayerAggregate): number {
  if (p.rounds === 0 || p.matches === 0) return 0;
  const kpr = p.kills / p.rounds;
  const adr = p.damageDealt / p.rounds;
  const fkDiff = (p.firstKills - p.firstDeaths) / Math.max(1, p.rounds);

  const impactRaw = 0.5 * (kpr / 0.9) + 0.3 * (adr / 180) + 0.2 * (fkDiff / 0.1);
  const impact = clamp01(impactRaw);

  const fullBuyWinrate = p.fullBuyRounds ? p.fullBuyWins / p.fullBuyRounds : 0.5;
  const bonusWinrate = p.bonusRounds ? p.bonusWins / p.bonusRounds : 0.3;
  const economyRaw = 0.7 * ((fullBuyWinrate - 0.5) / 0.25) + 0.3 * ((bonusWinrate - 0.3) / 0.2);
  const economy = clamp01(economyRaw);

  const clutchRate = p.clutchAttempts ? p.clutchWins / p.clutchAttempts : 0;
  const postPlantWinrate = p.postPlantAliveRounds ? p.postPlantWinsWhenAlive / p.postPlantAliveRounds : 0.5;
  const clutchRaw = 0.6 * (clutchRate / 0.3) + 0.4 * ((postPlantWinrate - 0.5) / 0.2);
  const clutch = clamp01(clutchRaw);

  let consistency = 0.5;
  if (p.perMapRatings.length > 1) {
    const mean = p.perMapRatings.reduce((a, b) => a + b, 0) / p.perMapRatings.length;
    const variance = p.perMapRatings.reduce((acc, x) => acc + (x - mean) ** 2, 0) / (p.perMapRatings.length - 1);
    const std = Math.sqrt(variance);
    const consistencyRaw = 1 - (std - 0.05) / (0.25 - 0.05);
    consistency = clamp01(consistencyRaw);
  }

  const composite = 0.4 * impact + 0.2 * economy + 0.2 * clutch + 0.2 * consistency;
  return Math.round(100 * clamp01(composite));
}

export function scoreLolPlayer(p: LolPlayerAggregate): number {
  if (p.games === 0) return 0;
  const cs10Score = p.avgCsAt10 / 80;
  const cs15Score = p.avgCsAt15 / 130;
  const gd10Score = (p.avgGoldDiffAt10 + 300) / 600;
  const gd15Score = (p.avgGoldDiffAt15 + 500) / 1000;
  const xp10Score = (p.avgXpDiffAt10 + 300) / 600;
  const soloDiffPerGame = (p.soloKills - p.soloDeaths) / Math.max(1, p.games);
  const soloScore = (soloDiffPerGame + 0.5) / 1.0;

  const laningRaw = 0.25 * clamp01(cs10Score) + 0.25 * clamp01(cs15Score) + 0.2 * clamp01(gd10Score) + 0.15 * clamp01(gd15Score) + 0.1 * clamp01(xp10Score) + 0.05 * clamp01(soloScore);
  const laning = clamp01(laningRaw);

  const kda = (p.avgK + p.avgA) / Math.max(1, p.avgD);
  const kdaScore = Math.log10(1 + kda) / Math.log10(1 + 6);
  const dpmScore = p.avgDpm / 700;
  const kpScore = (p.avgKp - 0.4) / 0.4;
  const dmgShareScore = (p.avgDamageShare - 0.18) / 0.12;
  const goldShareScore = (p.avgGoldShare - 0.18) / 0.12;

  const teamfightRaw = 0.25 * clamp01(kdaScore) + 0.25 * clamp01(dpmScore) + 0.2 * clamp01(kpScore) + 0.15 * clamp01(dmgShareScore) + 0.15 * clamp01(goldShareScore);
  const teamfight = clamp01(teamfightRaw);

  const objRate = p.teamObjectives ? (p.dragParticipations + p.heraldParticipations + p.baronParticipations + p.towerParticipations) / p.teamObjectives : 0;
  const macroRaw = objRate / 0.7;
  const macro = clamp01(macroRaw);

  let consistency = 0.5;
  if (p.perGameRatings.length > 1) {
    const mean = p.perGameRatings.reduce((a, b) => a + b, 0) / p.perGameRatings.length;
    const variance = p.perGameRatings.reduce((acc, x) => acc + (x - mean) ** 2, 0) / (p.perGameRatings.length - 1);
    const std = Math.sqrt(variance);
    const consistencyRaw = 1 - (std - 0.1) / (0.4 - 0.1);
    consistency = clamp01(consistencyRaw);
  }

  let wLaning = 0.3, wTeamfight = 0.4, wMacro = 0.2, wConsistency = 0.1;
  if (p.role === 'JUNGLE') { wLaning = 0.2; wTeamfight = 0.35; wMacro = 0.35; }
  else if (p.role === 'SUPPORT') { wLaning = 0.15; wTeamfight = 0.4; wMacro = 0.35; }

  const composite = wLaning * laning + wTeamfight * teamfight + wMacro * macro + wConsistency * consistency;
  return Math.round(100 * clamp01(composite));
}
