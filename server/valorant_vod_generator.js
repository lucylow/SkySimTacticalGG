// server/valorant_vod_generator.js
// GRID-style Valorant VOD / video analysis mock data
// Frame-level (20Hz) telemetry suitable for VOD overlays & ML

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= RNG ================= */
function rng(seed = 1337) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}
const rand = rng(2026);
const rf = (a=0,b=1)=>a+(b-a)*rand();
const ri = (a,b)=>Math.floor(rf(a,b+1));
const pick = arr => arr[Math.floor(rand()*arr.length)];

/* ================= Constants ================= */
const OUT = path.join(__dirname, "data");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const MAPS = {
  Ascent: {
    size: [15000,15000],
    sites: { A:{x:13000,y:3000}, B:{x:12000,y:12000} },
    lanes: {
      mid: [{x:7500,y:0},{x:7500,y:15000}],
      aMain: [{x:15000,y:2500},{x:11000,y:3500}],
      bMain: [{x:15000,y:12500},{x:11000,y:11500}]
    }
  }
};

const AGENTS = ["Jett","Sova","Omen","Raze","Killjoy"];
const WEAPONS = ["Vandal","Phantom","Sheriff","Operator"];
const TICK_RATE = 20; // 20Hz like telemetry feeds

/* ================= Player ================= */
function createPlayer(id, team) {
  return {
    id,
    team,
    agent: pick(AGENTS),
    skill: rf(0.4,0.9),
    aim: rf(0.4,0.95),
    reaction: rf(0.4,0.9),
    alive: true,
    hp: 100,
    armor: 50,
    weapon: pick(WEAPONS),
    pos: {
      x: team==="A"?rf(500,2500):rf(12500,14500),
      y: rf(2000,13000)
    },
    vel: {x:0,y:0},
    view: {
      yaw: rf(0,360),
      pitch: rf(-10,10)
    }
  };
}

/* ================= Helpers ================= */
function dist(a,b){
  const dx=a.x-b.x, dy=a.y-b.y;
  return Math.sqrt(dx*dx+dy*dy);
}

function move(player, target) {
  const dx = target.x-player.pos.x;
  const dy = target.y-player.pos.y;
  const d = Math.sqrt(dx*dx+dy*dy)||1;
  const speed = 220 + player.skill*80;
  player.vel.x = (dx/d)*speed;
  player.vel.y = (dy/d)*speed;
  player.pos.x += player.vel.x/TICK_RATE;
  player.pos.y += player.vel.y/TICK_RATE;
  player.view.yaw = Math.atan2(dy,dx)*(180/Math.PI);
}

/* ================= Combat ================= */
function simulateShot(attacker, victim) {
  const aimError = rf(-6,6)*(1-attacker.aim);
  const hitChance = attacker.aim - dist(attacker.pos,victim.pos)/12000;
  if (rand() < hitChance) {
    const dmg = ri(30,160);
    victim.hp -= dmg;
    return {
      type: "DAMAGE",
      source: attacker.id,
      target: victim.id,
      weapon: attacker.weapon,
      damage: dmg,
      headshot: aimError < 1
    };
  }
  return null;
}

/* ================= Frame Simulation ================= */
function simulateRound(mapName="Ascent", roundIndex=1) {
  const map = MAPS[mapName];
  const playersA = Array.from({length:5},(_,i)=>createPlayer(`A${i}`, "A"));
  const playersB = Array.from({length:5},(_,i)=>createPlayer(`B${i}`, "B"));
  const players = [...playersA,...playersB];

  const frames = [];
  const roundSeconds = ri(60,100);
  const totalFrames = roundSeconds*TICK_RATE;

  const povPlayer = pick(players); // VOD POV (observed player)

  for (let f=0; f<totalFrames; f++) {
    const time = f/TICK_RATE;
    const events = [];

    players.forEach(p=>{
      if(!p.alive) return;
      const lane = pick(Object.values(map.lanes)).slice(-1)[0];
      move(p,lane);

      // Random engagement
      if(rand()<0.04){
        const enemy = pick(players.filter(x=>x.team!==p.team && x.alive));
        if(enemy){
          const dmg = simulateShot(p,enemy);
          if(dmg) events.push(dmg);
          if(enemy.hp<=0){
            enemy.alive=false;
            events.push({
              type:"KILL",
              killer:p.id,
              victim:enemy.id,
              weapon:p.weapon
            });
          }
        }
      }
    });

    frames.push({
      frame:f,
      time,
      pov: povPlayer.id,
      players: players.map(p=>({
        id:p.id,
        team:p.team,
        agent:p.agent,
        alive:p.alive,
        hp:p.hp,
        armor:p.armor,
        weapon:p.weapon,
        x:p.pos.x,
        y:p.pos.y,
        vx:p.vel.x,
        vy:p.vel.y,
        yaw:p.view.yaw,
        pitch:p.view.pitch
      })),
      events
    });

    if(playersA.every(p=>!p.alive)||playersB.every(p=>!p.alive)) break;
  }

  return {
    round: roundIndex,
    map: mapName,
    pov: povPlayer.id,
    frames
  };
}

/* ================= Match ================= */
function generateVODMatch() {
  const rounds = [];
  for(let r=1;r<=24;r++){
    rounds.push(simulateRound("Ascent", r));
  }
  return {
    matchId:`vod-${ri(10000,99999)}`,
    source:"GRID_MOCK",
    tickRate:TICK_RATE,
    rounds
  };
}

/* ================= Export ================= */
if (process.argv[1] === __filename) {
  const match = generateVODMatch();
  fs.writeFileSync(
    path.join(OUT,"valorant_vod_match.json"),
    JSON.stringify(match,null,2)
  );
  console.log("Valorant VOD mock written");
}

export { generateVODMatch };
