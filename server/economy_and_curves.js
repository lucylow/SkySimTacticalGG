// server/economy_and_curves.js
// Generates player-level performance curves and detailed Valorant economy + per-round ML features.
// Run with: node server/economy_and_curves.js
// Output: server/data/valorant_economy_dataset.csv, server/data/valorant_matches_full.json
// and server/data/player_time_series.json

const fs = require('fs');
const path = require('path');

/* -----------------------
   Utilities & RNG (seedable)
   ----------------------- */
function xorShift32(seed) {
  let x = seed || 88675123;
  return function() {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}
const rand = xorShift32(1234567);

function randFloat(a = 0, b = 1) { return a + (b - a) * rand(); }
function randInt(a, b) { return Math.floor(randFloat(a, b + 1)); }
function choice(arr) { return arr[Math.floor(randFloat(0, arr.length))]; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function nowSec() { return Math.floor(Date.now() / 1000); }

const OUT_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

/* -----------------------
   Constants (Valorant)
   ----------------------- */
const VAL_WEAPONS = {
  Classic: { cost: 0, damage: 26, accuracy: 0.5 },
  Shorty: { cost: 150, damage: 12, accuracy: 0.4 },
  Ghost: { cost: 500, damage: 78, accuracy: 0.7 },
  Sheriff: { cost: 800, damage: 160, accuracy: 0.6 },
  Frenzy: { cost: 400, damage: 20, accuracy: 0.55 },
  Bulldog: { cost: 2050, damage: 33, accuracy: 0.65 },
  Guardian: { cost: 2500, damage: 60, accuracy: 0.68 },
  Phantom: { cost: 2900, damage: 39, accuracy: 0.75 },
  Vandal: { cost: 2900, damage: 40, accuracy: 0.73 },
  Operator: { cost: 5000, damage: 255, accuracy: 0.9 },
  Spectre: { cost: 1600, damage: 30, accuracy: 0.64 },
  Judge: { cost: 1500, damage: 34, accuracy: 0.45 }
};

const PISTOL_ROUND_REWARDS = { win: 2000, loss: 900 }; // simplified rewards
const STANDARD_ROUND_REWARDS = { win: 3000, loss: 0 }; // plus eco/push bonuses
const KILL_REWARD = 300; // simplified

/* -----------------------
   Player performance process (AR(1) + periodic + jump)
   ----------------------- */
// Returns an array of per-game metric objects for `nGames` games for `nPlayers`.
function generatePlayerPerformanceSeries({ nPlayers = 10, nGames = 100, gameType = 'valorant' } = {}) {
  // Base stats by game type
  // For Valorant: kpr, adr, utility_use_rate, clutch_rate
  // For LoL: cs10, cs15, dpm, kp, vision
  const players = [];
  for (let p = 0; p < nPlayers; p++) {
    // base level (skill)
    const skillBase = 0.5 + randFloat(-0.15, 0.2); // 0..1
    const volatility = 0.06 + randFloat(0, 0.08);
    const momentum = 0.02 + randFloat(-0.01, 0.03); // allows streakiness
    const fatigueSlope = randFloat(-0.0005, 0.0005); // small long-run drift
    const jumpProb = 0.01; // occasional skill jump (positive or negative)

    const series = [];
    // hidden 'state' for AR(1)
    let state = skillBase;

    for (let t = 0; t < nGames; t++) {
      // periodic (weekly / meta) effect
      const seasonality = 0.05 * Math.sin((2 * Math.PI * t) / 12 + randFloat(0, 2 * Math.PI));

      // rare jumps
      if (rand() < jumpProb) {
        state += randFloat(-0.12, 0.15); // skill shock
      }

      // AR(1) update with noise
      state = 0.85 * state + 0.15 * skillBase + seasonality + randFloat(-volatility, volatility) + t * fatigueSlope;

      // momentum effect: if previous few were strong, small boost
      const recent = series.slice(-3).reduce((s, x) => s + (x.skill || 0), 0) / (series.slice(-3).length || 1);
      const momentumBoost = (recent > state ? -momentum : momentum) * randFloat(0, 1);

      let skill = clamp(state + momentumBoost, 0.05, 0.98);

      // map to observable metrics
      let metrics;
      if (gameType === 'valorant') {
        // kpr ~ 0.1 - 2.0, adr ~ 40 - 200, utility ~ 0 - 6 uses per round
        metrics = {
          skill,
          kpr: +(0.2 + skill * 1.6 + randFloat(-0.15, 0.15)).toFixed(3),
          adr: Math.round(50 + skill * 160 + randFloat(-12, 12)),
          utility_rate: +(0.5 + skill * 3.5 + randFloat(-0.4, 0.6)).toFixed(2),
          clutch_rate: +(0.02 + skill * 0.08 + randFloat(-0.01, 0.01)).toFixed(3)
        };
      } else {
        // LoL
        metrics = {
          skill,
          cs10: Math.round(20 + skill * 60 + randFloat(-6, 6)),
          cs15: Math.round(35 + skill * 95 + randFloat(-8, 8)),
          dpm: Math.round(100 + skill * 900 + randFloat(-40, 40)),
          kp: +(0.25 + skill * 0.6 + randFloat(-0.05, 0.05)).toFixed(3),
          vision: Math.round(6 + skill * 20 + randFloat(-3, 3))
        };
      }

      series.push({ gameIndex: t + 1, timestamp: nowSec() - (nGames - t) * 60 * 60 * 3, ...metrics });
    }

    players.push({ playerId: `${gameType}-player-${p + 1}`, baseSkill: skillBase, series });
  }

  // persist
  fs.writeFileSync(path.join(OUT_DIR, `${gameType}_player_time_series.json`), JSON.stringify(players, null, 2));
  console.log(`Wrote ${gameType}_player_time_series.json (${players.length} players x ${nGames} games)`);

  return players;
}

/* -----------------------
   Valorant economy simulator (per-match, per-round)
   ----------------------- */

// Simplified economy rules and state machine:
// - Each player has wallet starting at 800 (customizable).
// - Round loop: check team wallets -> choose buy type (pistol, eco, partial, full, force) via simple rules
// - Payouts: standard round win reward + kill reward + bonus for plant/defuse
// - Buy decisions influenced by: team prior round win/loss, team money, players' risk tolerance (random), side (attack/def)
// - Pistol round effect: extra reward differences produce swing
//
// We create a per-round log and per-player purchases array, and compute features for ML.

function simulateValorantMatchWithEconomy({ matchId = `val-match-${Date.now()}`, nRounds = 24, players = null } = {}) {
  // players: array of 10 player objects (ids + base skill)
  if (!players) {
    players = Array.from({ length: 10 }).map((_, i) => ({
      id: `val-player-${i + 1}`,
      name: `Player_${i + 1}`,
      risk: randFloat(0.05, 0.6),
      baseSkill: 0.4 + randFloat(-0.12, 0.2)
    }));
  }

  // initial wallets
  const wallets = {};
  players.forEach(p => (wallets[p.id] = 800)); // starting credits

  const rounds = [];
  let lastRoundWinner = null;
  let team = { attackers: players.slice(0, 5).map(p => p.id), defenders: players.slice(5).map(p => p.id) };

  // helper to compute team money
  const teamMoney = () => ({
    attackers: team.attackers.reduce((s, id) => s + wallets[id], 0),
    defenders: team.defenders.reduce((s, id) => s + wallets[id], 0)
  });

  // utility function to choose buy type for a player
  function chooseBuyType(playerId, side, roundNumber) {
    const w = wallets[playerId];
    const tm = teamMoney();
    const teamSideMoney = side === 'attackers' ? tm.attackers : tm.defenders;
    const opponentSideMoney = side === 'attackers' ? tm.defenders : tm.attackers;

    // prioritize pistol round rules (round 1 & half-start)
    if (roundNumber === 1 || roundNumber === Math.ceil(nRounds / 2) + 1) {
      // pistol round: only pistols or light smg
      const pistolChoice = rand() < 0.6 ? 'Pistol' : 'Light';
      return { type: pistolChoice, affordability: w >= 0 };
    }

    // if very low wallet -> eco
    if (w < 800) return { type: 'Eco', affordability: false };

    // if team money >= 14000 -> full buy
    if (teamSideMoney >= 12000 && w >= 2900) return { type: 'Full', affordability: true };

    // if opponent has heavy money and you have at least 1500 -> force
    const opponentAdv = opponentSideMoney - teamSideMoney;
    if (opponentAdv > 2500 && w >= 1500) {
      // risk tolerance determines whether to force
      const p = players.find(x => x.id === playerId);
      if (rand() < p.risk) return { type: 'Force', affordability: true };
    }

    // partial buy if you have some mid credits
    if (w >= 1600 && w < 2900) return { type: 'Partial', affordability: true };

    // default full if can
    if (w >= 2900) return { type: 'Full', affordability: true };

    // otherwise eco
    return { type: 'Eco', affordability: false };
  }

  // function to pick actual purchased weapon based on buy type
  function purchaseWeaponForType(buyType, wallet) {
    // Return weapon name and weapon cost (simplified)
    if (buyType === 'Pistol') {
      // Ghost (500) or Sheriff (800) or Classic (0)
      const options = ['Classic', 'Ghost', 'Sheriff'];
      const choiceWeapon = choice(options);
      return { weapon: choiceWeapon, cost: VAL_WEAPONS[choiceWeapon].cost };
    }
    if (buyType === 'Light') {
      return { weapon: choice(['Frenzy', 'Ghost']), cost: VAL_WEAPONS[choice('Frenzy' ? 'Frenzy' : 'Ghost')].cost };
    }
    if (buyType === 'Eco') return { weapon: 'Classic', cost: 0 };
    if (buyType === 'Partial') {
      // Spectre or Bulldog
      const w = choice(['Spectre', 'Bulldog', 'Phantom']);
      return { weapon: w, cost: VAL_WEAPONS[w] ? VAL_WEAPONS[w].cost : 1600 };
    }
    if (buyType === 'Full') {
      // Phantom or Vandal or Operator if high wallet
      if (wallet >= 5000 && rand() < 0.12) return { weapon: 'Operator', cost: VAL_WEAPONS.Operator.cost };
      const mains = choice(['Phantom', 'Vandal']);
      return { weapon: mains, cost: VAL_WEAPONS[mains].cost };
    }
    if (buyType === 'Force') {
      // try to buy best affordable
      const affordable = Object.entries(VAL_WEAPONS).filter(([k, v]) => v.cost <= wallet);
      const pick = affordable.length ? choice(affordable)[0] : 'Classic';
      return { weapon: pick, cost: VAL_WEAPONS[pick] ? VAL_WEAPONS[pick].cost : 0 };
    }
    return { weapon: 'Classic', cost: 0 };
  }

  // round simulation: simpler deterministic model:
  // - wins are based on combined team effective power which is computed using wallet-weighted skill and weapons
  // - include randomness to allow upsets in pistols and ecos
  for (let r = 1; r <= nRounds; r++) {
    const round = { roundNumber: r, buys: [], side: r % 2 === 1 ? 'attackers' : 'defenders' };

    // per-player buy
    players.forEach((p, idx) => {
      const side = idx < 5 ? 'attackers' : 'defenders';
      const buy = chooseBuyType(p.id, side, r);
      const purchase = purchaseWeaponForType(buy.type, wallets[p.id]);
      // apply purchase cost (if affordability)
      const affordable = purchase.cost <= wallets[p.id];
      if (affordable) wallets[p.id] -= purchase.cost;
      round.buys.push({ playerId: p.id, side, buyType: buy.type, weapon: purchase.weapon, spent: affordable ? purchase.cost : 0, walletAfter: wallets[p.id] });
    });

    // compute team effective power
    function teamEffective(sideName) {
      const members = round.buys.filter(b => b.side === sideName);
      // base power = sum(player skill * weapon_effectiveness) + money buffer
      let power = 0;
      members.forEach(b => {
        const player = players.find(pp => pp.id === b.playerId);
        const skill = player.baseSkill;
        // weapon effect: map to 0.8..1.2
        const weapon = VAL_WEAPONS[b.weapon] || { cost: 0, damage: 30, accuracy: 0.6 };
        const weaponEffect = 0.8 + Math.min(0.5, weapon.accuracy);
        // buyType multiplier (eco = 0.65, pistol ~0.75, full 1.0, force 0.9)
        const typeMult = b.buyType === 'Eco' ? 0.6 : b.buyType === 'Pistol' ? 0.75 : b.buyType === 'Partial' ? 0.9 : b.buyType === 'Force' ? 0.92 : 1.0;
        power += skill * weaponEffect * typeMult * (1 + wallets[b.playerId] / 10000);
      });
      // add slight randomness
      power *= 1 + randFloat(-0.06, 0.06);
      return power;
    }

    const atkPower = teamEffective('attackers');
    const defPower = teamEffective('defenders');

    // determine winner, extra pistol probabilities (pistols are swingy)
    const atkPistol = round.buys.some(b => b.side === 'attackers' && b.buyType === 'Pistol');
    const defPistol = round.buys.some(b => b.side === 'defenders' && b.buyType === 'Pistol');

    let winProbAttack = atkPower / (atkPower + defPower);
    // adjust for pistol volatility
    if (atkPistol || defPistol) {
      winProbAttack = clamp(winProbAttack + randFloat(-0.18, 0.18), 0.02, 0.98);
    } else {
      winProbAttack = clamp(winProbAttack + randFloat(-0.06, 0.06), 0.01, 0.99);
    }

    const attackWins = rand() < winProbAttack;
    const winner = attackWins ? 'attackers' : 'defenders';

    // payouts: assign rewards to winners and kill payouts randomly
    const roundSummary = {
      roundNumber: r,
      winner,
      winProbAttack: +winProbAttack.toFixed(3),
      buys: round.buys
    };

    // compute kills for each player: use buyType and skill to bias kills
    roundSummary.playerRoundResults = round.buys.map(b => {
      const player = players.find(pp => pp.id === b.playerId);
      const baseKillExpectation = player.baseSkill * (b.buyType === 'Eco' ? 0.4 : b.buyType === 'Pistol' ? 0.6 : b.buyType === 'Full' ? 1.0 : b.buyType === 'Partial' ? 0.85 : 0.8);
      // if winner, increase kills
      const multiplier = (b.side === winner) ? 1 + randFloat(0.1, 0.35) : randFloat(0, 0.3);
      const expectedKills = clamp(baseKillExpectation * multiplier * 2.0, 0, 5); // expectation
      const kills = Math.round(Math.max(0, expectedKills + randFloat(-0.9, 0.9)));
      // reward/payout
      const killReward = kills * KILL_REWARD;
      // plant/defuse heuristics: if side is attackers, sometimes plant
      const planted = b.side === 'attackers' && rand() < (kills > 0 ? 0.15 : 0.04);
      const defused = b.side === 'defenders' && rand() < 0.03;
      // assign payout: winners get standard win reward; losers get loss reward (we will add after)
      return {
        playerId: b.playerId,
        side: b.side,
        kills,
        planted,
        defused,
        spent: b.spent
      };
    });

    // compute team payouts
    // Winner team: each player receives base win + kill rewards
    const winRewardPerPlayer = STANDARD_ROUND_REWARDS.win;
    const loseRewardPerPlayer = STANDARD_ROUND_REWARDS.loss;

    roundSummary.playerRoundResults.forEach(pr => {
      const k = pr.kills;
      const payout = (pr.side === winner ? winRewardPerPlayer : loseRewardPerPlayer) + k * KILL_REWARD + (pr.planted ? 800 : 0) + (pr.defused ? 300 : 0);
      wallets[pr.playerId] += payout;
      pr.payout = payout;
      pr.walletAfter = wallets[pr.playerId];
    });

    // extra: if pistol round, special scaling for next round buys (simulate eco follow)
    rounds.push(roundSummary);
    lastRoundWinner = winner;
  }

  // compute final score (count round winners)
  const attackersWins = rounds.filter(r => r.winner === 'attackers').length;
  const defendersWins = rounds.filter(r => r.winner === 'defenders').length;

  const match = {
    id: matchId,
    players,
    rounds,
    finalScore: { attackers: attackersWins, defenders: defendersWins },
    generatedAt: nowSec()
  };

  // write match JSON
  const outFile = path.join(OUT_DIR, `${matchId}_economy.json`);
  fs.writeFileSync(outFile, JSON.stringify(match, null, 2));
  console.log(`Wrote: ${outFile}`);
  return match;
}

/* -----------------------
   Feature extraction for ML (per player-round rows)
   ----------------------- */

// Build per player-round rows with rolling features (last N rounds) and labels
function extractFeaturesFromMatch(match, { rolling = 5 } = {}) {
  // build map player -> rounds results
  const playerRows = [];

  // For each round, we have playerRoundResults array
  for (let r = 0; r < match.rounds.length; r++) {
    const round = match.rounds[r];
    const roundNumber = round.roundNumber;
    const winner = round.winner;
    // for each player's entry in round
    round.playerRoundResults.forEach(pr => {
      const playerId = pr.playerId;
      // compute rolling stats from prior rounds of this player
      const previousRounds = [];

      // find prior rounds for same player
      for (let rr = 0; rr < r; rr++) {
        const prr = match.rounds[rr].playerRoundResults.find(x => x.playerId === playerId);
        if (prr) previousRounds.push({ round: rr + 1, ...prr, buyType: match.rounds[rr].buys.find(b => b.playerId === playerId).buyType });
      }

      const lastK = previousRounds.slice(-rolling).map(x => x.kills);
      const lastSpent = previousRounds.slice(-rolling).map(x => x.spent);
      const avgKillsLast = lastK.length ? lastK.reduce((a, b) => a + b, 0) / lastK.length : 0;
      const avgSpentLast = lastSpent.length ? lastSpent.reduce((a, b) => a + b, 0) / lastSpent.length : 0;
      const numFullBuysLast = previousRounds.slice(-rolling).filter(x => x.buyType === 'Full').length;
      const econPressure = match.rounds[r].buys.reduce((s, b) => s + b.spent, 0) / 10; // average team spend proxy

      // player base skill (from match.players)
      const baseSkill = (match.players.find(p => p.id === playerId) || {}).baseSkill || 0.45;

      const row = {
        matchId: match.id,
        roundNumber,
        playerId,
        teamSide: match.rounds[r].buys.find(b => b.playerId === playerId).side,
        buyType: match.rounds[r].buys.find(b => b.playerId === playerId).buyType,
        weapon: match.rounds[r].buys.find(b => b.playerId === playerId).weapon,
        spent: match.rounds[r].buys.find(b => b.playerId === playerId).spent,
        walletAfter: match.rounds[r].buys.find(b => b.playerId === playerId).walletAfter,
        kills: pr.kills,
        planted: pr.planted ? 1 : 0,
        defused: pr.defused ? 1 : 0,
        payout: pr.payout,
        payoutAfter: pr.walletAfter,

        // rolling features
        avgKillsLast,
        avgSpentLast,
        numFullBuysLast,
        roundsPlayed: previousRounds.length,
        baseSkill,

        // team / round features
        winProbAttack: match.rounds[r].winProbAttack || 0,

        // label(s)
        roundWinnerIsPlayerTeam: pr.side === winner ? 1 : 0,
        nextRoundBuyType: null // we'll fill this in by looking ahead
      };

      playerRows.push(row);
    });
  }

  // fill nextRoundBuyType
  for (let i = 0; i < playerRows.length; i++) {
    const row = playerRows[i];
    const nextRound = match.rounds.find(r => r.roundNumber === row.roundNumber + 1);
    if (!nextRound) { row.nextRoundBuyType = 'NA'; continue; }
    const buy = nextRound.buys.find(b => b.playerId === row.playerId);
    row.nextRoundBuyType = buy ? buy.buyType : 'NA';
  }

  return playerRows;
}

/* -----------------------
   CSV export helpers
   ----------------------- */

function toCSV(rows) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(',')].concat(rows.map(r => keys.map(k => {
    const v = r[k];
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return `"${String(v).replace(/"/g, '""')}"`;
    return String(v);
  }).join(',')));
  return lines.join('\n');
}

/* -----------------------
   Example generator usage
   ----------------------- */

function runExample() {
  console.log('--- Generating player time series (Valorant & LoL) ---');
  const valSeries = generatePlayerPerformanceSeries({ nPlayers: 16, nGames: 120, gameType: 'valorant' });
  const lolSeries = generatePlayerPerformanceSeries({ nPlayers: 16, nGames: 120, gameType: 'league' });

  console.log('--- Simulating one Valorant match with economy ---');
  const match = simulateValorantMatchWithEconomy({ matchId: 'val-econ-demo-1', nRounds: 26, players: valSeries.slice(0,10).map(p => ({ id: p.playerId, baseSkill: p.series[p.series.length-1].skill, risk: randFloat(0.08, 0.6) })) });

  console.log('--- Extracting player-round features ---');
  const rows = extractFeaturesFromMatch(match, { rolling: 5 });

  console.log('Rows generated:', rows.length);

  const csv = toCSV(rows);
  const csvFile = path.join(OUT_DIR, 'valorant_economy_dataset.csv');
  fs.writeFileSync(csvFile, csv);
  console.log('Wrote CSV:', csvFile);

  const jsonFile = path.join(OUT_DIR, 'valorant_matches_full.json');
  fs.writeFileSync(jsonFile, JSON.stringify(match, null, 2));
  console.log('Wrote match JSON:', jsonFile);

  // also write player time series
  fs.writeFileSync(path.join(OUT_DIR, 'valorant_player_time_series.json'), JSON.stringify(valSeries, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'lol_player_time_series.json'), JSON.stringify(lolSeries, null, 2));
  console.log('Wrote time series JSONs.');

  // print few sample lines
  console.log('Sample CSV lines:');
  console.log(csv.split('\n').slice(0, 6).join('\n'));
}

if (require.main === module) {
  runExample();
}

module.exports = {
  generatePlayerPerformanceSeries,
  simulateValorantMatchWithEconomy,
  extractFeaturesFromMatch
};
