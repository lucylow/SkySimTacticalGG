// server/mockDataFactory.js
// Self-contained mock data generator for Valorant and League of Legends.
// No external libs required. Tweak counts and semantics as needed.

const AGENTS = ['Jett', 'Sova', 'Sage', 'Viper', 'Reyna', 'Omen', 'Phoenix', 'Breach', 'Killjoy', 'Raze', 'Cypher', 'Brimstone'];
const CHAMPIONS = ['Aatrox','Lee Sin','Sylas','Jinx','KaiSa','Thresh','Nautilus','Ekko','Katarina','Graves','Viego','Veigar'];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function timestampNow() {
  return Math.floor(Date.now() / 1000);
}

/* ---------------------------
   VALORANT: data shapes
   --------------------------- */

function makeValorantPlayer(id) {
  const agent = randChoice(AGENTS);
  return {
    id: `val-player-${id}`,
    name: `Player_${id}`,
    agent,
    mmr: randInt(1200, 2400),
    recentScore: randInt(60, 95),
    preferredSide: Math.random() > 0.5 ? 'attack' : 'defense',
    stats: {
      adr: randInt(80, 220),
      kpr: +(Math.random() * 1.5 + 0.2).toFixed(2),
      fk_rate: +(Math.random() * 0.35).toFixed(2),
      utility_uses: randInt(10, 120),
      clutch_1vX: randInt(0, 5)
    },
    availability: { online: Math.random() > 0.2 }
  };
}

function makeValorantRound(roundIndex, attackersAlive, defendersAlive) {
  // simulate round outcome + key events
  return {
    id: `round-${roundIndex}`,
    roundIndex,
    startTime: timestampNow() - (60 * (30 - roundIndex)),
    durationSec: randInt(35, 120),
    attackersAlive,
    defendersAlive,
    spikePlanted: Math.random() > 0.5,
    winner: Math.random() > 0.5 ? 'attackers' : 'defenders',
    majorEvents: [
      ...(Math.random() > 0.6 ? [{
        type: 'first_blood',
        playerId: `val-player-${randInt(1, 10)}`
      }] : []),
      ...(Math.random() > 0.8 ? [{
        type: 'clutch',
        playerId: `val-player-${randInt(1, 10)}`,
        scenario: `1v${randInt(2,4)}`
      }] : [])
    ]
  };
}

function makeValorantMatch(matchId = null, roundsCount = 24) {
  const id = matchId || `val-match-${Date.now()}`;
  const players = Array.from({length: 10}).map((_, i) => makeValorantPlayer(i + 1));
  const rounds = Array.from({length: roundsCount}).map((_, i) => {
    const attackersAlive = randInt(0,5);
    const defendersAlive = randInt(0,5);
    return makeValorantRound(i + 1, attackersAlive, defendersAlive);
  });

  // Summary: economy/round swing simplified
  return {
    id,
    title: `Valorant Scrim ${id.slice(-6)}`,
    map: randChoice(['Ascent','Bind','Haven','Split','Icebox']),
    startedAt: timestampNow() - 60 * 60 * 2,
    durationSec: rounds.reduce((s, r) => s + r.durationSec, 0),
    players,
    rounds,
    finalScore: {
      attackers: randInt(0,13),
      defenders: randInt(0,13)
    },
    metadata: {
      tier: 'Scrim',
      patch: 'X.Y.Z'
    }
  };
}

/* Frame generator for a short replay — positions and states per tick.
   We'll generate simple x,y positions for 10 players for demo. */

function generateValorantReplayFrames(match, ticks = 400) {
  const frames = [];
  // initial positions random
  const positions = match.players.map((p,i) => ({ x: randInt(1000, 5000), y: randInt(1000, 5000), id: p.id }));

  for (let t = 0; t < ticks; t++) {
    // small movement jitter
    positions.forEach(pos => {
      pos.x = clamp(pos.x + randInt(-16, 16), 0, 10000);
      pos.y = clamp(pos.y + randInt(-16, 16), 0, 10000);
    });
    // occasional events: kill or ability
    const events = [];
    if (Math.random() < 0.02) {
      events.push({
        type: 'kill',
        attacker: randChoice(match.players).id,
        victim: randChoice(match.players).id,
        ts: t
      });
    }
    if (Math.random() < 0.01) {
      events.push({
        type: 'ability',
        playerId: randChoice(match.players).id,
        ability: randChoice(['smoke','flash','heal','recon']),
        ts: t
      });
    }
    frames.push({
      tick: t,
      ts: match.startedAt + t,
      players: positions.map(p => ({ id: p.id, x: p.x, y: p.y, hp: randInt(10, 100) })),
      events
    });
  }
  return frames;
}

/* ---------------------------
   LEAGUE OF LEGENDS: data shapes
   --------------------------- */

function makeLolPlayer(id) {
  const champ = randChoice(CHAMPIONS);
  return {
    id: `lol-player-${id}`,
    name: `Summoner_${id}`,
    champion: champ,
    role: randChoice(['TOP','JUNGLE','MID','ADC','SUPPORT']),
    mmr: randInt(1500, 3200),
    stats: {
      csAt10: randInt(25, 80),
      csAt15: randInt(40, 140),
      dpm: randInt(100, 900),
      kp: +(Math.random() * 0.6 + 0.2).toFixed(2),
      visionScore: randInt(8, 44)
    },
    perGameRatings: Array.from({length: 5}).map(()=> +(Math.random()*0.2 + 0.7).toFixed(2))
  };
}

function makeLolObjective(type, minute) {
  return {
    id: `obj-${type}-${minute}-${Math.floor(Math.random()*1000)}`,
    type, // 'dragon','baron','tower','herald'
    minute,
    team: Math.random() > 0.5 ? 'blue' : 'red',
    participants: Array.from({length: randInt(1,5)}).map(() => `lol-player-${randInt(1,10)}`),
    value: type === 'baron' ? { winprob: 0.12 } : { winprob: 0.03 * (type === 'dragon' ? 1 : 1) }
  };
}

function makeLolMatch(matchId = null, durationMinutes = 32) {
  const id = matchId || `lol-match-${Date.now()}`;
  const players = Array.from({length: 10}).map((_, i) => makeLolPlayer(i + 1));
  const objectives = [];
  for (let m=4; m <= durationMinutes; m += randInt(1,4)) {
    if (Math.random() > 0.6) {
      const type = randChoice(['dragon','tower','baron','herald']);
      objectives.push(makeLolObjective(type, m));
    }
  }
  const timelineEvents = [];
  // produce some teamfights & kills
  for (let i=0;i<randInt(20, 60);i++) {
    timelineEvents.push({
      id: `evt-${i}`,
      minute: randInt(1, durationMinutes),
      type: randChoice(['kill','tower','assist','dragon','baron','ward_placed']),
      payload: { by: randChoice(players).id, note: 'simulated event' }
    });
  }

  return {
    id,
    title: `LoL Scrim ${id.slice(-6)}`,
    map: 'Summoner Rift',
    durationMinutes,
    startedAt: timestampNow() - durationMinutes*60,
    players,
    objectives,
    timeline: timelineEvents,
    final: {
      winner: Math.random() > 0.5 ? 'blue' : 'red',
      blueGold: randInt(40000, 65000),
      redGold: randInt(40000, 65000)
    }
  };
}

function generateLolReplayFrames(match, ticks = match.durationMinutes * 6) {
  // coarse frames: one frame every 10s (~6 per minute)
  const frames = [];
  const positions = match.players.map((p,i) => ({ id: p.id, x: randInt(100, 14000), y: randInt(100, 14000) }));

  for (let t = 0; t < ticks; t++) {
    positions.forEach(pos => {
      pos.x = clamp(pos.x + randInt(-200, 200), 0, 15000);
      pos.y = clamp(pos.y + randInt(-200, 200), 0, 15000);
    });
    // occasionally a fight/kills
    const events = [];
    if (Math.random() < 0.05) {
      events.push({
        type: 'teamfight',
        winner: Math.random() > 0.5 ? 'blue' : 'red',
        participants: Array.from({ length: randInt(2, 10) }).map(() => randChoice(match.players).id),
        ts: t
      });
    }
    frames.push({
      tick: t,
      minute: Math.floor(t / 6),
      players: positions.map(p => ({ id: p.id, x: p.x, y: p.y, hp: randInt(50, 100) })),
      events
    });
  }

  return frames;
}

/* ---------------------------
   Utilities: make seed data sets
   --------------------------- */

function buildValorantDataset({ matches = 6, rounds = 24, frames = 600 } = {}) {
  const matchesList = Array.from({length: matches}).map((_, i) => {
    const match = makeValorantMatch(`val-match-${i+1}`, rounds);
    match.replayFrames = generateValorantReplayFrames(match, frames);
    return match;
  });
  return { games: 'valorant', matches: matchesList };
}

function buildLolDataset({ matches = 6, framesPerMatch = 200 } = {}) {
  const matchesList = Array.from({ length: matches }).map((_, i) => {
    const match = makeLolMatch(`lol-match-${i+1}`, randInt(22, 45));
    match.replayFrames = generateLolReplayFrames(match, match.durationMinutes * 6);
    return match;
  });
  return { games: 'league', matches: matchesList };
}

module.exports = {
  makeValorantMatch,
  makeValorantPlayer,
  generateValorantReplayFrames,
  buildValorantDataset,
  buildLolDataset
};
