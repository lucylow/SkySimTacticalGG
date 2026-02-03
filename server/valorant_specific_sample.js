// server/valorant_specific_Sample.js
// Valorant-specific Sample data generator (rich rounds, economy, map-aware frames, features)
// Usage: node server/valorant_specific_Sample.js
// Outputs: server/data/valorant_specific_matches.json (index) and per-match JSON files
// No external deps required.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { argv } from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------- Seeded RNG (for reproducibility) ----------
function xorShift32(seed) {
  let x = seed >>> 0 || 88675123;
  return function () {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}
const rand = xorShift32(20260203);
function randFloat(a = 0, b = 1) { return a + (b - a) * rand(); }
function randInt(a, b) { return Math.floor(randFloat(a, b + 1)); }
function randChoice(arr) { return arr[Math.floor(randFloat(0, arr.length))]; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function nowSec() { return Math.floor(Date.now() / 1000); }

// ---------- Valorant domain constants ----------
const AGENTS = [
  'Jett','Sova','Sage','Viper','Reyna','Omen','Phoenix','Breach','Killjoy','Raze','Cypher','Brimstone','Skye','KAY/O','Neon','Astra'
];

const AGENT_ABILITY_TYPES = {
  Jett: ['dash','smoke','updraft','ultimate'],
  Sova: ['recon','shock','shock','dart'],
  Sage: ['heal','wall','slow','ultimate'],
  Viper: ['wall','poison','snake','ultimate'],
  Reyna: ['devour','dismiss','leer','ultimate'],
  Omen: ['teleport','smoke','paranoia','ultimate'],
  Phoenix: ['flash','curve','heal','ultimate'],
  Breach: ['flash','fault','aftershock','ultimate'],
  Killjoy: ['turret','nade','alarm','ultimate'],
  Raze: ['grenade','boom','blastpack','ultimate'],
  Cypher: ['trapwire','camera','cypher_tool','ultimate'],
  Brimstone: ['smoke','incendiary','stim','ultimate'],
  Skye: ['heal','seekers','trail','ultimate'],
  'KAY/O': ['frag','flash','damp','ultimate'],
  Neon: ['run','slide','trap','ultimate'],
  Astra: ['cosmic','nova','gravity','ultimate']
};

const MAPS = ['Ascent', 'Bind', 'Haven', 'Split', 'Icebox'];

const WEAPONS = {
  Classic: { cost: 0, power: 0.05 },
  Shorty: { cost: 150, power: 0.07 },
  Frenzy: { cost: 400, power: 0.12 },
  Ghost: { cost: 500, power: 0.35 },
  Sheriff: { cost: 800, power: 0.6 },
  Stinger: { cost: 1000, power: 0.4 },
  Spectre: { cost: 1600, power: 0.5 },
  Bulldog: { cost: 2050, power: 0.55 },
  Guardian: { cost: 2500, power: 0.6 },
  Phantom: { cost: 2900, power: 0.9 },
  Vandal: { cost: 2900, power: 0.9 },
  Marshal: { cost: 950, power: 0.6 },
  Operator: { cost: 5000, power: 1.3 },
  Judge: { cost: 1500, power: 0.7 }
};

// economy payout constants (simplified, tailored)
const REWARDS = {
  roundWinBase: 3250,
  roundLossBase: 900,
  plantBonus: 300,
  defuseBonus: 300,
  kill: 200
};

// ---------- Helpers: IDs and timestamps ----------
function mkId(prefix) {
  const r = Math.floor(randFloat(100000, 999999));
  return `${prefix}-${r}`;
}

// ---------- Player generator ----------
function generatePlayer(idx) {
  const id = `val-player-${idx + 1}`;
  const agent = randChoice(AGENTS);
  const baseSkill = clamp(0.35 + randFloat(-0.12, 0.25), 0.05, 0.98);
  const preferredWeapons = ['Phantom','Vandal','Operator','Spectre','Guardian','Judge'];
  return {
    id,
    name: `Player${idx + 1}`,
    agent,
    agentRole: agentRoleFromAgent(agent),
    baseSkill,
    mmr: Math.round(1200 + baseSkill * 1400 + randFloat(-100, 100)),
    settings: { sensitivity: +(randFloat(0.3, 1.0)).toFixed(3) },
    seedStats: {
      adr: Math.round(60 + baseSkill * 160 + randFloat(-12, 12)),
      kpr: +(0.2 + baseSkill * 1.6 + randFloat(-0.15, 0.15)).toFixed(3)
    },
    preferredWeapon: randChoice(preferredWeapons)
  };
}

function agentRoleFromAgent(agent) {
  const duelists = ['Jett','Reyna','Raze','Phoenix','Neon'];
  const initiators = ['Sova','Breach','KAY/O','Skye'];
  const controllers = ['Viper','Omen','Brimstone','Astra'];
  const sentinels = ['Sage','Killjoy','Cypher'];
  if (duelists.includes(agent)) return 'Duelist';
  if (initiators.includes(agent)) return 'Initiator';
  if (controllers.includes(agent)) return 'Controller';
  if (sentinels.includes(agent)) return 'Sentinel';
  return 'Flex';
}

// ---------- Round economy & buy decision model ----------
function chooseBuyTypeForPlayer(wallet, teamMoney, opponentMoney, isPistolRound, riskTolerance) {
  if (isPistolRound) {
    if (wallet >= 800 && randFloat() < 0.6) return { buyType: 'Pistol', recommended: randChoice(['Ghost','Sheriff','Classic']) };
    return { buyType: 'Pistol', recommended: 'Classic' };
  }
  if (wallet < 800) return { buyType: 'Eco', recommended: 'Classic' };
  if (teamMoney >= 12000 && wallet >= 2900) return { buyType: 'Full', recommended: randChoice(['Phantom','Vandal','Operator']) };
  if (opponentMoney - teamMoney > 3000 && wallet >= 1500 && randFloat() < riskTolerance) {
    return { buyType: 'Force', recommended: randChoice(['Spectre','Bulldog','Phantom']) };
  }
  if (wallet >= 1600 && wallet < 2900) return { buyType: 'Partial', recommended: randChoice(['Spectre','Bulldog','Guardian']) };
  if (wallet >= 2900) return { buyType: 'Full', recommended: randChoice(['Phantom','Vandal']) };
  return { buyType: 'Eco', recommended: 'Classic' };
}

// ---------- Simulate a match (per-match generator) ----------
function generateValorantMatch({ matchId = null, map = null, rounds = 24 } = {}) {
  const id = matchId || mkId('val-match');
  const mapName = map || randChoice(MAPS);
  const startedAt = nowSec() - randInt(3600, 3600 * 5);
  const players = Array.from({ length: 10 }).map((_, i) => generatePlayer(i));

  const attackers = players.slice(0,5).map(p => p.id);
  const defenders = players.slice(5,10).map(p => p.id);

  const wallets = {};
  players.forEach(p => wallets[p.id] = 800);

  const roundsArr = [];
  let attackersWins = 0;
  let defendersWins = 0;
  let lastRoundWinner = null;

  for (let r = 1; r <= rounds; r++) {
    const isPistolRound = (r === 1) || (r === Math.ceil(rounds/2) + 1);
    const teamMoney = {
      attackers: attackers.reduce((s, id) => s + wallets[id], 0),
      defenders: defenders.reduce((s, id) => s + wallets[id], 0)
    };

    const buyEntries = [];
    for (const p of players) {
      const side = attackers.includes(p.id) ? 'attackers' : 'defenders';
      const buyDecision = chooseBuyTypeForPlayer(wallets[p.id], teamMoney[side], teamMoney[side === 'attackers' ? 'defenders' : 'attackers'], isPistolRound, randFloat(0.05, 0.6));
      const weaponInfo = WEAPONS[buyDecision.recommended] || { cost: 0, power: 0.3 };
      const spent = weaponInfo.cost;
      const purchased = spent <= wallets[p.id];
      if (purchased) wallets[p.id] -= spent;
      buyEntries.push({
        playerId: p.id,
        side,
        buyType: buyDecision.buyType,
        weapon: buyDecision.recommended,
        spent: purchased ? spent : 0,
        purchased: purchased,
        walletBefore: wallets[p.id] + (purchased ? spent : 0),
        walletAfter: wallets[p.id]
      });
    }

    function teamPower(side) {
      const members = buyEntries.filter(b => b.side === side);
      let sum = 0;
      for (const m of members) {
        const player = players.find(pp => pp.id === m.playerId);
        const wp = (WEAPONS[m.weapon] && WEAPONS[m.weapon].power) || 0.35;
        const buyMult = m.buyType === 'Full' ? 1.0 : m.buyType === 'Partial' ? 0.85 : m.buyType === 'Pistol' ? 0.6 : m.buyType === 'Eco' ? 0.45 : 0.8;
        sum += player.baseSkill * wp * buyMult * (1 + (m.walletAfter / 10000));
      }
      return sum * (1 + randFloat(-0.08, 0.08));
    }

    const atkPower = teamPower('attackers');
    const defPower = teamPower('defenders');

    const rawProbAttack = atkPower / (atkPower + defPower);
    const pistolAdjust = isPistolRound ? randFloat(-0.18, 0.18) : randFloat(-0.07, 0.07);
    const winProbAttack = clamp(rawProbAttack + pistolAdjust, 0.02, 0.98);
    const attackWins = randFloat() < winProbAttack;
    const winnerSide = attackWins ? 'attackers' : 'defenders';

    const playerRoundResults = [];
    for (const b of buyEntries) {
      const p = players.find(pp => pp.id === b.playerId);
      const wp = (WEAPONS[b.weapon] && WEAPONS[b.weapon].power) || 0.35;
      let expKills = p.baseSkill * wp * (b.buyType === 'Eco' ? 0.6 : b.buyType === 'Pistol' ? 0.8 : 1.0) * (winnerSide === b.side ? 1.2 : 0.6);
      expKills = clamp(expKills * (1 + randFloat(-0.6, 0.6)), 0, 6);
      const kills = Math.max(0, Math.round(expKills + randFloat(-1.2, 1.2)));
      const assists = Math.round(kills * randFloat(0, 0.8));
      const damage = Math.round(kills * (30 + wp * 120) + assists * 25 + randFloat(0, 100));
      const abilityUses = Math.round(p.baseSkill * 3 + (p.agentRole === 'Controller' ? 1.5 : 0) + randFloat(-1, 2));
      playerRoundResults.push({
        playerId: p.id,
        side: b.side,
        kills,
        assists,
        deaths: (winnerSide === b.side ? randInt(0, 2) : Math.min(4, Math.max(1, randInt(1, 4)))),
        damage,
        abilityUses: Math.max(0, abilityUses),
        planted: false,
        defused: false,
        payout: 0
      });
    }

    let spikePlanted = false;
    let plantPlayerId = null;
    if (winnerSide === 'attackers') {
      if (randFloat() < 0.6 + (winProbAttack - 0.5)) {
        spikePlanted = true;
        const planterCandidates = playerRoundResults.filter(pr => pr.side === 'attackers' && pr.kills >= 0);
        if (planterCandidates.length) {
          plantPlayerId = randChoice(planterCandidates).playerId;
          playerRoundResults.find(pr => pr.playerId === plantPlayerId).planted = true;
        }
      }
    } else {
      if (randFloat() < 0.08) {
        spikePlanted = true;
        const planter = randChoice(playerRoundResults.filter(pr => pr.side === 'attackers')).playerId;
        plantPlayerId = planter;
        const defuserCandidate = randChoice(playerRoundResults.filter(pr => pr.side === 'defenders'));
        if (defuserCandidate) defuserCandidate.defused = true;
      }
    }

    for (const pr of playerRoundResults) {
      const killPayout = pr.kills * REWARDS.kill;
      const teamWin = (pr.side === winnerSide);
      const roundBase = teamWin ? REWARDS.roundWinBase : REWARDS.roundLossBase;
      const plantBonus = pr.planted ? REWARDS.plantBonus : 0;
      const defuseBonus = pr.defused ? REWARDS.defuseBonus : 0;
      pr.payout = roundBase + killPayout + plantBonus + defuseBonus;
      wallets[pr.playerId] += pr.payout;
    }

    if (winnerSide === 'attackers') attackersWins++; else defendersWins++;
    lastRoundWinner = winnerSide;

    const roundEntry = {
      roundNumber: r,
      startTime: startedAt + (r - 1) * 90,
      durationSec: randInt(30, 120),
      buys: buyEntries,
      playerRoundResults,
      spikePlanted,
      plantPlayerId,
      winner: winnerSide,
      winProbAttack: +winProbAttack.toFixed(3)
    };

    roundsArr.push(roundEntry);
  }

  const match = {
    id,
    title: `Valorant Sample ${id.slice(-6)}`,
    map: mapName,
    startedAt,
    roundsPlayed: rounds,
    players: players.map(p => ({ id: p.id, name: p.name, agent: p.agent, baseSkill: p.baseSkill, mmr: p.mmr })),
    rounds: roundsArr,
    finalScore: { attackers: attackersWins, defenders: defendersWins },
    metadata: { version: 'Sample-1.0', generatedAt: nowSec() }
  };

  return match;
}

// ---------- Map-aware frame generator (simple lane model) ----------
function generateFramesForMatch(match, { ticksPerRound = 120, tickHz = 10, seed = 20260203 } = {}) {
  const frames = [];
  const rng = xorShift32(seed);

  const mapWaypoints = {
    Ascent: {
      A: { attackers: [{x:200,y:5000},{x:2600,y:4300},{x:4800,y:4000}], defenders: [{x:9800,y:5000},{x:7000,y:4600},{x:5000,y:4050}], siteCenter: {x:5100,y:3950} },
      B: { attackers: [{x:200,y:5000},{x:2600,y:5600},{x:4800,y:6000}], defenders: [{x:9800,y:5000},{x:7000,y:5400},{x:5000,y:5950}], siteCenter: {x:5100,y:6050} },
      Mid:{ attackers: [{x:200,y:5000},{x:3000,y:5000},{x:5200,y:5000}], defenders:[{x:9800,y:5000},{x:7000,y:5000},{x:5200,y:5000}], siteCenter:{x:5200,y:5000} }
    }
  };
  const mapName = match.map || 'Ascent';
  const mapPaths = mapWaypoints[mapName] || mapWaypoints['Ascent'];

  function lerp(a,b,t){return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
  function pathPos(path, progress) {
    if(!path || path.length===0) return {x:0,y:0};
    if(progress<=0) return path[0];
    if(progress>=1) return path[path.length-1];
    const segment = (path.length-1) * progress;
    const idx = Math.floor(segment);
    const t = segment - idx;
    return lerp(path[idx], path[Math.min(idx+1,path.length-1)], t);
  }

  for (const rnd of match.rounds) {
    const targetSite = rnd.spikePlanted ? (rnd.plantPlayerId ? (randFloat() < 0.6 ? 'A' : 'B') : 'A') : (randFloat() < 0.5 ? 'A' : 'B');
    const playerPaths = {};
    for (const pl of match.players) {
      const side = rnd.buys.find(b => b.playerId === pl.id).side;
      let way;
      if (side === 'attackers') way = mapPaths[targetSite].attackers; else way = mapPaths[targetSite].defenders;
      playerPaths[pl.id] = way;
    }

    for (let t = 0; t < ticksPerRound; t++) {
      const tickObj = { round: rnd.roundNumber, tick: t, ts: rnd.startTime + Math.floor(t / tickHz), players: [], events: [] };
      for (const pl of match.players) {
        const progress = Math.min(1, (t / ticksPerRound) * (0.7 + randFloat(-0.12,0.3)));
        const pos = pathPos(playerPaths[pl.id], progress);
        const jitter = { x: pos.x + randFloat(-30,30), y: pos.y + randFloat(-30,30) };
        tickObj.players.push({ id: pl.id, x: Math.round(jitter.x), y: Math.round(jitter.y), hp: 100 });
      }

      const playersNow = tickObj.players;
      for (let i = 0; i < playersNow.length; i++) {
        for (let j = i+1; j < playersNow.length; j++) {
          const pa = playersNow[i], pb = playersNow[j];
          const sideA = rnd.buys.find(b => b.playerId === pa.id).side;
          const sideB = rnd.buys.find(b => b.playerId === pb.id).side;
          if (sideA === sideB) continue;
          const dx = pa.x - pb.x, dy = pa.y - pb.y;
          const d2 = dx*dx + dy*dy;
          if (d2 < (160*160) && randFloat() < 0.02) {
            const aBuy = rnd.buys.find(b => b.playerId === pa.id);
            const bBuy = rnd.buys.find(b => b.playerId === pb.id);
            const aPower = (WEAPONS[aBuy.weapon] ? WEAPONS[aBuy.weapon].power : 0.35) * (match.players.find(p=>p.id===pa.id).baseSkill);
            const bPower = (WEAPONS[bBuy.weapon] ? WEAPONS[bBuy.weapon].power : 0.35) * (match.players.find(p=>p.id===pb.id).baseSkill);
            const probA = clamp(aPower / (aPower + bPower), 0.02, 0.98);
            if (randFloat() < probA) {
              tickObj.events.push({ type: 'kill', attacker: pa.id, victim: pb.id, ts: tickObj.ts });
            } else {
              tickObj.events.push({ type: 'kill', attacker: pb.id, victim: pa.id, ts: tickObj.ts });
            }
          }
        }
      }

      if (randFloat() < 0.04) {
        const who = randChoice(match.players).id;
        const ability = randChoice(AGENT_ABILITY_TYPES[match.players.find(p=>p.id===who).agent] || ['ability']);
        tickObj.events.push({ type: 'ability', playerId: who, ability, ts: tickObj.ts });
      }

      frames.push(tickObj);
    }
    frames.push({ round: rnd.roundNumber, tick: ticksPerRound, ts: rnd.startTime + Math.ceil(rnd.durationSec), players: [], events: [{ type: 'round_end', winner: rnd.winner, ts: rnd.startTime + Math.ceil(rnd.durationSec) }] });
  }
  return frames;
}

// ---------- Per-round ML-friendly feature extractor (example) ----------
function extractPlayerRoundFeatures(match, rollingWindow = 5) {
  const rows = [];
  for (let i = 0; i < match.rounds.length; i++) {
    const rnd = match.rounds[i];
    for (const pr of rnd.playerRoundResults) {
      const buy = rnd.buys.find(b => b.playerId === pr.playerId);
      const baseSkill = match.players.find(p => p.id === pr.playerId).baseSkill;
      const row = {
        matchId: match.id,
        roundNumber: rnd.roundNumber,
        playerId: pr.playerId,
        side: pr.side,
        buyType: buy.buyType,
        weapon: buy.weapon,
        spent: buy.spent,
        walletAfter: buy.walletAfter,
        kills: pr.kills,
        assists: pr.assists,
        deaths: pr.deaths,
        damage: pr.damage,
        abilityUses: pr.abilityUses,
        planted: pr.planted,
        defused: pr.defused,
        payout: pr.payout,
        baseSkill,
        winProbAttack: rnd.winProbAttack,
        roundWinnerIsPlayerTeam: (pr.side === rnd.winner) ? 1 : 0
      };
      rows.push(row);
    }
  }
  const byPlayer = {};
  for (const r of rows) {
    if (!byPlayer[r.playerId]) byPlayer[r.playerId] = [];
    r.avgKillsLast5 = avgOfLastN(byPlayer[r.playerId].map(x => x.kills), 5);
    byPlayer[r.playerId].push(r);
  }
  return rows;
}
function avgOfLastN(arr, n) {
  if (!arr || arr.length === 0) return 0;
  const last = arr.slice(Math.max(0, arr.length - n));
  return last.reduce((s,x) => s + x, 0) / last.length;
}

// ---------- Top-level orchestrator: produce multiple matches ----------
function produceMatches({ count = 3, rounds = 24, ticksPerRound = 120 } = {}) {
  const matches = [];
  for (let i = 0; i < count; i++) {
    const match = generateValorantMatch({ rounds });
    match.replayFrames = generateFramesForMatch(match, { ticksPerRound });
    match.features = extractPlayerRoundFeatures(match);
    const fname = path.join(OUT_DIR, `${match.id}.json`);
    fs.writeFileSync(fname, JSON.stringify(match, null, 2));
    console.log('Wrote match file:', fname);
    matches.push({ id: match.id, title: match.title, map: match.map, rounds: match.roundsPlayed });
  }
  fs.writeFileSync(path.join(OUT_DIR, 'valorant_specific_matches.json'), JSON.stringify(matches, null, 2));
  console.log('Wrote index with', matches.length, 'matches.');
  return matches;
}

// ---------- Example run ----------
if (argv[1] === __filename) {
  console.log('Generating 3 detailed Valorant matches (with economy, rounds, frames, features)...');
  produceMatches({ count: 3, rounds: 26, ticksPerRound: 160 });
  console.log('Done. Files in server/data/');
}

export { generateValorantMatch, generateFramesForMatch, extractPlayerRoundFeatures, produceMatches };

