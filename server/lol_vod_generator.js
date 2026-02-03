// server/lol_vod_generator.js
// GRID-style League of Legends VOD / video analysis Sample data
// Frame-level telemetry (10Hz) for replay + ML

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= RNG ================= */
function rng(seed = 202603) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}
const rand = rng();
const rf = (a=0,b=1)=>a+(b-a)*rand();
const ri = (a,b)=>Math.floor(rf(a,b+1));
const pick = arr => arr[Math.floor(rand()*arr.length)];

/* ================= Output ================= */
const OUT = path.join(__dirname,"data");
if(!fs.existsSync(OUT)) fs.mkdirSync(OUT,{recursive:true});

/* ================= Constants ================= */
const TICK_RATE = 10; // GRID-style telemetry (10Hz)

const MAP = {
  width: 15000,
  height: 15000,
  lanes: {
    top: [{x:2000,y:13000},{x:6000,y:9000},{x:13000,y:2000}],
    mid: [{x:2000,y:7500},{x:7500,y:7500},{x:13000,y:7500}],
    bot: [{x:2000,y:2000},{x:6000,y:6000},{x:13000,y:13000}]
  },
  objectives: {
    dragon: {x:7500,y:2500},
    baron: {x:7500,y:12500}
  }
};

const ROLES = ["Top","Jungle","Mid","ADC","Support"];
const CHAMPIONS = {
  Top:["Garen","Camille","Ornn"],
  Jungle:["LeeSin","Viego","Sejuani"],
  Mid:["Ahri","Orianna","Syndra"],
  ADC:["Jinx","Aphelios","KaiSa"],
  Support:["Thresh","Leona","Lulu"]
};

/* ================= Helpers ================= */
function dist(a,b){
  const dx=a.x-b.x, dy=a.y-b.y;
  return Math.sqrt(dx*dx+dy*dy);
}

function moveToward(p,target,speed){
  const dx=target.x-p.x, dy=target.y-p.y;
  const d=Math.sqrt(dx*dx+dy*dy)||1;
  return {
    x:p.x+(dx/d)*speed,
    y:p.y+(dy/d)*speed,
    facing:Math.atan2(dy,dx)
  };
}

/* ================= Player ================= */
function createPlayer(id, side, role) {
  return {
    id,
    side,
    role,
    champion: pick(CHAMPIONS[role]),
    skill: rf(0.4,0.9),
    alive: true,
    hp: 1000,
    mana: 500,
    level: 1,
    x: side==="Blue"?rf(1500,3000):rf(12000,13500),
    y: side==="Blue"?rf(1500,3000):rf(12000,13500),
    facing: 0,
    respawnAt: null,
    cooldowns: {Q:0,W:0,E:0,R:0}
  };
}

/* ================= Vision ================= */
const VISION_RADIUS = 1350;

function visible(observer, target){
  return target.alive && dist(observer,target) <= VISION_RADIUS;
}

/* ================= Combat ================= */
function castSpell(caster,target,spell){
  const hit = rand() < caster.skill;
  if(!hit) return null;
  const dmg = ri(80,220);
  target.hp -= dmg;
  return {
    type:"SPELL_HIT",
    source:caster.id,
    target:target.id,
    spell,
    damage:dmg
  };
}

function autoAttack(attacker,target){
  const hit = rand() < attacker.skill;
  if(!hit) return null;
  const dmg = ri(40,90);
  target.hp -= dmg;
  return {
    type:"AUTO_ATTACK",
    source:attacker.id,
    target:target.id,
    damage:dmg
  };
}

/* ================= Frame Simulation ================= */
function simulateGameFrames(durationMin=32) {
  const blue = ROLES.map((r,i)=>createPlayer(`B${i}`, "Blue", r));
  const red  = ROLES.map((r,i)=>createPlayer(`R${i}`, "Red", r));
  const players = [...blue,...red];

  const frames = [];
  const totalFrames = durationMin * 60 * TICK_RATE;

  const pov = pick(players).id; // VOD POV (player or observer anchor)

  for(let f=0; f<totalFrames; f++){
    const time = f / TICK_RATE;
    const minute = Math.floor(time/60);
    const events = [];

    players.forEach(p=>{
      // Respawn
      if(!p.alive && p.respawnAt && time>=p.respawnAt){
        p.alive=true;
        p.hp=1000;
        p.x=p.side==="Blue"?2000:13000;
        p.y=p.side==="Blue"?2000:13000;
        events.push({type:"RESPAWN",player:p.id});
      }

      if(!p.alive) return;

      // Movement (lane or objective)
      const target =
        minute>20 && rand()<0.2
          ? MAP.objectives[rand()<0.5?"baron":"dragon"]
          : pick(MAP.lanes[p.role==="Jungle"?"mid":p.role.toLowerCase()]||MAP.lanes.mid);

      const pos = moveToward(p,target,90/TICK_RATE);
      p.x=pos.x; p.y=pos.y; p.facing=pos.facing;

      // Abilities
      if(rand()<0.02){
        const enemy = pick(players.filter(e=>e.side!==p.side && e.alive));
        if(enemy){
          const e = castSpell(p,enemy,pick(["Q","W","E"]));
          if(e) events.push(e);
        }
      }

      // Autos
      if(rand()<0.03){
        const enemy = pick(players.filter(e=>e.side!==p.side && e.alive));
        if(enemy){
          const e = autoAttack(p,enemy);
          if(e) events.push(e);
        }
      }
    });

    // Death resolution
    players.forEach(p=>{
      if(p.alive && p.hp<=0){
        p.alive=false;
        p.respawnAt = time + 20 + p.level*2;
        events.push({type:"DEATH",player:p.id});
      }
    });

    // Fog of war (per POV)
    const povPlayer = players.find(p=>p.id===pov);
    const visiblePlayers = players
      .filter(p=>p.side===povPlayer.side || visible(povPlayer,p))
      .map(p=>p.id);

    frames.push({
      frame:f,
      time,
      minute,
      pov,
      visiblePlayers,
      players: players.map(p=>({
        id:p.id,
        side:p.side,
        role:p.role,
        champion:p.champion,
        alive:p.alive,
        hp:p.hp,
        mana:p.mana,
        x:p.x,
        y:p.y,
        facing:p.facing
      })),
      events
    });
  }

  return frames;
}

/* ================= Match ================= */
function generateLoLVOD() {
  return {
    matchId:`lol-vod-${ri(10000,99999)}`,
    source:"GRID_Sample",
    tickRate:TICK_RATE,
    map:"SummonersRift",
    frames: simulateGameFrames(ri(28,36))
  };
}

/* ================= Export ================= */
const isMain = process.argv[1] && (process.argv[1] === __filename || process.argv[1].endsWith('lol_vod_generator.js'));
if (isMain) {
  const vod = generateLoLVOD();
  fs.writeFileSync(
    path.join(OUT, "lol_vod_match.json"),
    JSON.stringify(vod, null, 2)
  );
  console.log("LoL VOD Sample written");
}

export { generateLoLVOD };

