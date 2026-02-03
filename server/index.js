// server/index.js
const express = require("express");
const cors = require("cors");

const { generateLoLMatch } = require("./lol_generator");
const { simulateFrames } = require("./lol_frames");
const { computeFeatures } = require("./lol_features");

const app = express();
app.use(cors());
app.use(express.json());

// Helper for async routes
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/* ===== Matches ===== */
app.get("/api/lol/match", (req,res)=>{
  try {
    const match = generateLoLMatch();
    res.json(match);
  } catch (error) {
    console.error("Error generating LoL match:", error);
    res.status(500).json({ error: "Failed to generate LoL match" });
  }
});

app.get("/api/lol/matches", (req,res)=>{
  const matches = [
    { id: "lm1", title: "T1 vs Gen.G - Finals", region: "KR", patch: "14.2", startTime: Date.now() },
    { id: "lm2", title: "T1 vs Cloud9 - Group Stage", region: "GLOBAL", patch: "14.2", startTime: Date.now() - 86400000 },
    { id: "lm3", title: "G2 vs Fnatic - Semi-Finals", region: "EU", patch: "14.1", startTime: Date.now() - 172800000 }
  ];
  res.json(matches);
});

app.get("/api/valorant/matches", (req,res)=>{
  const matches = [
    { id: "vm1", title: "Sentinels vs LOUD", map: "Bind", startedAt: Date.now() },
    { id: "vm2", title: "Fnatic vs DRX", map: "Ascent", startedAt: Date.now() - 86400000 },
    { id: "vm3", title: "Paper Rex vs NRG", map: "Haven", startedAt: Date.now() - 172800000 }
  ];
  res.json(matches);
});

app.get("/api/valorant/match/:id", (req,res)=>{
  if (!req.params.id) {
    return res.status(400).json({ error: "Match ID is required" });
  }
  res.json({
    id: req.params.id,
    title: "Sample Valorant Match",
    map: "Bind",
    rounds: [],
    players: []
  });
});

/* ===== Frames (SSE-like) ===== */
app.get("/api/lol/frames", (req,res)=>{
  let match;
  try {
    match = generateLoLMatch();
  } catch (err) {
    console.error("Error starting frames simulation:", err);
    return res.status(500).end();
  }
  
  const frames = simulateFrames(match);

  res.writeHead(200,{
    "Content-Type":"text/event-stream",
    "Cache-Control":"no-cache",
    "Connection":"keep-alive"
  });

  let i=0;
  const iv = setInterval(()=>{
    try {
      if(i>=frames.length){
        clearInterval(iv);
        res.end();
        return;
      }
      res.write(`data:${JSON.stringify(frames[i++])}\n\n`);
    } catch (err) {
      console.error("Error sending frame:", err);
      clearInterval(iv);
      res.end();
    }
  },100);

  req.on('close', () => {
    clearInterval(iv);
  });
});

/* ===== Dataset ===== */
app.get("/api/lol/dataset", (req,res)=>{
  try {
    const match = generateLoLMatch();
    res.json(computeFeatures(match));
  } catch (error) {
    console.error("Error generating LoL dataset:", error);
    res.status(500).json({ error: "Failed to generate LoL dataset" });
  }
});

/* ===== GRID LoL Strategy Translation Simulator ===== */
app.post('/api/grid-strategy/:matchId', asyncHandler(async (req, res) => {
  const matchId = req.params.matchId;
  if (!matchId) {
    return res.status(400).json({ error: "Match ID is required" });
  }

  // Sample GRID data (Layers 1-3)
  const GRID_Sample_DATA = {
    layer1: {
      myChamp: "Aatrox",
      enemyChamp: "Renekton",
      teamComp: "front2back",
      enemyComp: "engage",
      playerTendencies: {
        Aatrox: { winrate: 0.67, aggression: 0.82 },
        Renekton: { winrate: 0.59, aggression: 0.91 }
      },
      patchMeta: { earlyPressure: 0.72, scalingMeta: false }
    },
    layer2: {
      matchTime: 1482,
      lanePriority: { top: 0.41, mid: -0.23, bot: 0.67 },
      junglePathing: ["bot_gank", "drake_setup"],
      visionScore: 18,
      objectiveTimers: { baron: 138, drake: 312, herald: "taken" },
      goldDiff: 1240,
      itemSpikes: [
        { player: "aatrox", item: "divine_sunderer", complete: true },
        { player: "renekton", item: "goredrinker", complete: true }
      ]
    },
    layer3: {
      lastFightResult: "WIN",
      objectivesGained: ["herald", "tower_top1"],
      deaths: [{ player: "aatrox", timer: 4.2 }],
      adaptationSignals: ["group_mid", "avoid_river"]
    }
  };

  // Engines (inline lightweight logic to avoid TS imports)
  const detectWinCondition = (state) => {
    const primary = state.layer1.teamComp;
    let confidence = 0.75;
    if (state.layer2.goldDiff > 2000) confidence += 0.1;
    if (state.layer1.teamComp === 'front2back' && state.layer1.enemyComp === 'engage') confidence += 0.02;
    return { primary, confidence: Math.min(confidence, 0.99) };
  };

  const recommendRunes = (state) => {
    if (state.layer1.myChamp === 'Aatrox' && state.layer1.enemyChamp === 'Renekton') {
      return { primary: 'conqueror (sustained duels vs Renekton)', secondary: 'resolve (survive ganks)', shards: 'AS/Adaptive/Health' };
    }
    return { primary: 'conqueror', secondary: 'resolve', shards: 'Adaptive/Adaptive/Health' };
  };

  const recommendBuild = (state) => {
    if (state.layer1.myChamp === 'Aatrox' && state.layer1.enemyChamp === 'Renekton') {
      return { mythic: 'Divine Sunderer (vs tanky Renekton)', core1: 'Steraks', core2: 'Deadmans (teamfight setup)', situational: 'Force of Nature (enemy AP threats)' };
    }
    return { mythic: 'Goredrinker', core1: 'Black Cleaver', core2: 'Steraks Gage', situational: 'Guardian Angel' };
  };

  const generateStrategy = (state) => {
    const winCondition = detectWinCondition(state);
    const runes = recommendRunes(state);
    const build = recommendBuild(state);

    let currentPriority = 'OBJECTIVE_CONTROL';
    let mapPlan = ['Vision', 'Group', 'Objective'];
    let commsPrimary = 'Play for objectives';
    const signals = [];

    if (typeof state.layer2.objectiveTimers.baron === 'number' && state.layer2.objectiveTimers.baron < 180) {
      currentPriority = 'BARON_SETUP';
      mapPlan = ['Vision baron pit', 'Group mid', 'Baron secure', 'Bot T2'];
      commsPrimary = 'Baron vision';
      signals.push('Mid group', 'Peel carries');
    }
    if (state.layer3.lastFightResult === 'WIN') signals.push('PRESS_ADVANTAGE');
    if (state.layer3.objectivesGained.includes('herald')) signals.push('TOP_PRESSURE');
    if (state.layer2.visionScore < 20) signals.push('VISION_FIRST');

    return { winCondition, runes, build, currentPriority, mapPlan, comms: { primary: commsPrimary, signals } };
  };

  const strategy = generateStrategy(GRID_Sample_DATA);

  res.send({
    winCondition: strategy.winCondition,
    immediateAction: strategy.currentPriority,
    runes: strategy.runes,
    build: strategy.build,
    coachCall: strategy.comms.primary,
    confidence: strategy.winCondition.confidence
  });
}));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT,()=>console.log(`Sample server on :${PORT}`));

