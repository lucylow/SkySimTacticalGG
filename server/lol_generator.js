// server/lol_generator.js
// League of Legends Sample data generator (production-grade semantics)
//
// Generates:
// - Matches with champions, roles, lanes
// - Gold / XP / items
// - Lane pressure, jungle, objectives
// - Teamfights with multi-event resolution
// - Per-player engineered features (CSV-ready)
//
// No external dependencies

const fs = require("fs");
const path = require("path");

/* ===================== RNG ===================== */
function xorShift32(seed) {
  let x = seed >>> 0 || 2463534242;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}
const rand = xorShift32(20260203);
const rf = (a = 0, b = 1) => a + (b - a) * rand();
const ri = (a, b) => Math.floor(rf(a, b + 1));
const pick = arr => arr[Math.floor(rf(0, arr.length))];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ===================== Constants ===================== */
const OUT_DIR = path.join(__dirname, "data");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const ROLES = ["Top", "Jungle", "Mid", "ADC", "Support"];

const CHAMPIONS = {
  Top: ["Garen","Darius","Fiora","Camille","Ornn"],
  Jungle: ["LeeSin","JarvanIV","Sejuani","Viego","KhaZix"],
  Mid: ["Ahri","Orianna","Syndra","Zed","Viktor"],
  ADC: ["Jinx","KaiSa","Aphelios","Ezreal","Caitlyn"],
  Support: ["Thresh","Leona","Nautilus","Lulu","Braum"]
};

const ITEMS = {
  starter: ["DoranBlade","DoranRing","RelicShield"],
  core: ["InfinityEdge","Rabadon","TrinityForce","KrakenSlayer","JakSho"],
  situational: ["Zhonya","GuardianAngel","MortalReminder","VoidStaff"]
};

const OBJECTIVES = {
  dragon: { gold: 500, soulChance: 0.25 },
  herald: { gold: 300 },
  baron: { gold: 1500 }
};

const GAME_LENGTH_MIN = [22, 38];

/* ===================== Player ===================== */
function createPlayer(idx, role) {
  const baseSkill = clamp(0.4 + rf(-0.15, 0.3), 0.1, 0.95);
  return {
    id: `lol-p${idx}`,
    name: `Summoner${idx}`,
    role,
    champion: pick(CHAMPIONS[role]),
    baseSkill,
    laningSkill: clamp(baseSkill + rf(-0.1, 0.2), 0.1, 1),
    teamfightSkill: clamp(baseSkill + rf(-0.1, 0.2), 0.1, 1),
    macroSkill: clamp(baseSkill + rf(-0.15, 0.25), 0.1, 1),
    gold: 500,
    xp: 0,
    level: 1,
    items: [],
    stats: {
      kills: 0,
      deaths: 0,
      assists: 0,
      cs: 0,
      damage: 0,
      visionScore: 0
    }
  };
}

/* ===================== Economy ===================== */
function xpForLevel(lv) {
  return Math.round(280 * Math.pow(lv, 1.6));
}

function goldPerMinion(minute, isCannon = false) {
  const base = isCannon ? 60 : 21;
  return Math.round(base * (1 + minute * 0.015));
}

/* ===================== Lane Phase ===================== */
function simulateLaneMinute(player, opp, minute) {
  const pressure =
    player.laningSkill /
    (player.laningSkill + opp.laningSkill);

  const cs = Math.round(6 * pressure + rf(-1, 2));
  const gold = cs * goldPerMinion(minute);
  const xp = cs * 60;

  player.gold += gold;
  player.xp += xp;
  player.stats.cs += cs;
}

/* ===================== Jungle & Roaming ===================== */
function simulateJungleMinute(jg, minute) {
  const camps = Math.round(1.5 + rf(-0.5, 1));
  const gold = camps * 120;
  const xp = camps * 150;

  jg.gold += gold;
  jg.xp += xp;
  jg.stats.cs += camps * 4;
}

function attemptGank(jg, lanePlayer) {
  const success =
    jg.baseSkill * 0.6 +
    jg.macroSkill * 0.4 >
    lanePlayer.laningSkill + rf(-0.2, 0.2);

  if (success) {
    lanePlayer.stats.deaths++;
    jg.stats.kills++;
    jg.gold += 300;
    lanePlayer.gold -= 150;
    return true;
  }
  return false;
}

/* ===================== Teamfights ===================== */
function simulateTeamfight(teamA, teamB, minute) {
  const powerA = teamA.reduce(
    (s, p) => s + p.teamfightSkill * (1 + p.level * 0.12),
    0
  );
  const powerB = teamB.reduce(
    (s, p) => s + p.teamfightSkill * (1 + p.level * 0.12),
    0
  );

  const probA = powerA / (powerA + powerB);
  const aWins = rand() < probA;

  const winners = aWins ? teamA : teamB;
  const losers = aWins ? teamB : teamA;

  winners.forEach(p => {
    const k = ri(0, 2);
    p.stats.kills += k;
    p.stats.assists += ri(1, 3);
    p.gold += k * 300;
    p.stats.damage += ri(500, 1200);
  });

  losers.forEach(p => {
    p.stats.deaths++;
    p.stats.damage += ri(200, 600);
  });

  return aWins;
}

/* ===================== Objectives ===================== */
function attemptObjective(team, type) {
  const lead =
    team.reduce((s, p) => s + p.gold + p.level * 300, 0);

  if (rand() < clamp(lead / 30000, 0.1, 0.9)) {
    team.forEach(p => (p.gold += OBJECTIVES[type].gold / 5));
    return true;
  }
  return false;
}

/* ===================== Match ===================== */
function generateLoLMatch() {
  const gameLength = ri(...GAME_LENGTH_MIN);
  const blue = ROLES.map((r, i) => createPlayer(i + 1, r));
  const red = ROLES.map((r, i) => createPlayer(i + 6, r));

  const timeline = [];

  for (let minute = 1; minute <= gameLength; minute++) {
    // Lane
    for (let i = 0; i < 5; i++) {
      if (blue[i].role === "Jungle") {
        simulateJungleMinute(blue[i], minute);
        if (rand() < 0.25) attemptGank(blue[i], red[ri(0, 4)]);
      } else {
        simulateLaneMinute(blue[i], red[i], minute);
        simulateLaneMinute(red[i], blue[i], minute);
      }
    }

    // Levels
    [...blue, ...red].forEach(p => {
      while (p.xp >= xpForLevel(p.level + 1)) p.level++;
    });

    // Teamfights
    if (minute > 10 && rand() < 0.12) {
      simulateTeamfight(blue, red, minute);
    }

    // Objectives
    if (minute % 5 === 0 && minute > 7) {
      attemptObjective(rand() < 0.5 ? blue : red, "dragon");
    }

    timeline.push({ minute });
  }

  const blueGold = blue.reduce((s, p) => s + p.gold, 0);
  const redGold = red.reduce((s, p) => s + p.gold, 0);

  return {
    id: `lol-match-${Math.floor(rf(10000, 99999))}`,
    durationMin: gameLength,
    winner: blueGold >= redGold ? "Blue" : "Red",
    blue,
    red,
    timeline
  };
}

/* ===================== Dataset Export ===================== */
function exportLoLDataset(count = 5) {
  const rows = [];

  for (let i = 0; i < count; i++) {
    const match = generateLoLMatch();
    const teams = { Blue: match.blue, Red: match.red };

    Object.entries(teams).forEach(([side, team]) => {
      team.forEach(p => {
        rows.push({
          matchId: match.id,
          side,
          role: p.role,
          champion: p.champion,
          level: p.level,
          gold: Math.round(p.gold),
          cs: p.stats.cs,
          kills: p.stats.kills,
          deaths: p.stats.deaths,
          assists: p.stats.assists,
          damage: p.stats.damage,
          visionScore: p.stats.visionScore,
          baseSkill: p.baseSkill,
          won: match.winner === side ? 1 : 0
        });
      });
    });

    fs.writeFileSync(
      path.join(OUT_DIR, `${match.id}.json`),
      JSON.stringify(match, null, 2)
    );
  }

  // CSV
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map(r =>
      keys.map(k => JSON.stringify(r[k] ?? "")).join(",")
    )
  ].join("\n");

  fs.writeFileSync(
    path.join(OUT_DIR, "lol_dataset.csv"),
    csv
  );

  console.log("LoL dataset written:", rows.length, "rows");
}

/* ===================== Run ===================== */
if (require.main === module) {
  exportLoLDataset(6);
}

module.exports = { generateLoLMatch, exportLoLDataset };
