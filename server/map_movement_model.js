// server/map_movement_model.js
// Self-contained Node module implementing a map-aware movement + event model for Valorant.
// No external deps. Exports: generateValorantReplayFramesWithMap(match, ticksPerRound=160, options={})

const fs = require('fs');
const path = require('path');

function xorShift32(seed) {
  let x = seed >>> 0 || 88675123;
  return function () {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 0xffffffff;
  };
}

function makeRng(seed){
  const r = xorShift32(seed||20260203);
  return {
    float:(a=0,b=1)=>a+(b-a)*r(),
    int:(a,b)=>Math.floor(a+(b-a+1)*r()),
    choice:(arr)=>arr[Math.floor(r()*arr.length)]
  };
}

const MAP_TEMPLATES = {
  Ascent: {
    spawnA:{x:200,y:5000}, spawnB:{x:9800,y:5000},
    sites: {
      A: { center:{x:5100,y:3950}, radius:250, attackersPath:[{x:200,y:5000},{x:1800,y:4600},{x:3600,y:4300},{x:4800,y:4100},{x:5100,y:3950}], defendersPath:[{x:9800,y:5000},{x:8000,y:4700},{x:6200,y:4500},{x:5400,y:4200},{x:5100,y:3950}]},
      B: { center:{x:5100,y:6050}, radius:250, attackersPath:[{x:200,y:5000},{x:1800,y:5400},{x:3600,y:5800},{x:4800,y:6000},{x:5100,y:6050}], defendersPath:[{x:9800,y:5000},{x:8000,y:5300},{x:6200,y:5500},{x:5400,y:5800},{x:5100,y:6050}]},
      Mid:{center:{x:5200,y:5000}, radius:300, attackersPath:[{x:200,y:5000},{x:3000,y:5000},{x:5200,y:5000}], defendersPath:[{x:9800,y:5000},{x:7000,y:5000},{x:5200,y:5000}]}
    }
  }
};

function dist(a,b){const dx=a.x-b.x, dy=a.y-b.y; return Math.hypot(dx,dy);} 
function lerp(a,b,t){return a+(b-a)*t;}
function lerp2(p,q,t){return {x:lerp(p.x,q.x,t), y:lerp(p.y,q.y,t)};}

function smoothPath(path, jitter=8, rng){
  const out=[]; let prev=null;
  for(let i=0;i<path.length;i++){
    const p=path[i];
    const jx = (rng.float(-1,1))*jitter;
    const jy = (rng.float(-1,1))*jitter;
    const q={x:p.x+jx,y:p.y+jy};
    if(prev){
      // subdivide for smoothness
      const seg = Math.max(3, Math.min(10, Math.floor(dist(prev,q)/350)));
      for(let s=1;s<=seg;s++) out.push(lerp2(prev,q,s/seg));
    } else {
      out.push(q);
    }
    prev=q;
  }
  return out;
}

function waypointPathFor(side, siteKey, map){
  const site = map.sites[siteKey];
  return side==='attack' ? site.attackersPath : site.defendersPath;
}

function pickPlan(side, map, rng){
  const sites = Object.keys(map.sites);
  const target = rng.choice(sites);
  const path = waypointPathFor(side, target, map);
  return { targetSite: target, rawPath: path };
}

function buildPlayersIndex(match){
  const idx={};
  (match.players||[]).forEach(p=>{ idx[p.id]=p; });
  return idx;
}

function simulateRoundFrames(roundNumber, sideByPlayer, map, opts, rng){
  const ticksPerRound = opts.ticksPerRound||160;
  const tickHz = opts.tickHz||12;
  const runSpeed = opts.runSpeed||350; // units/sec
  const walkSpeed = opts.walkSpeed||210;
  const engageRange = opts.engageRange||520; // start fighting if within this range
  const killBaseProb = opts.killBaseProb||0.02; // per tick baseline on contact
  const utilityChance = opts.utilityChance||0.08; // per 2s

  const players = Object.keys(sideByPlayer);
  const plans = {};
  const smoothedPaths = {};

  for(const pid of players){
    const side = sideByPlayer[pid];
    const plan = pickPlan(side, map, rng);
    plans[pid]=plan;
    smoothedPaths[pid]=smoothPath(plan.rawPath, 14, rng);
  }

  const state = {};
  for(const pid of players){
    const pathPts = smoothedPaths[pid];
    state[pid] = { idx:0, pos: {...pathPts[0]}, alive:true, side: sideByPlayer[pid], site: null, speedMult: rng.float(0.9,1.1) };
  }

  const frames=[]; const events=[];

  function moveTowards(pid){
    const s = state[pid]; if(!s.alive) return;
    const pts = smoothedPaths[pid];
    if(s.idx >= pts.length-1) return;
    const cur = s.pos; const nxt = pts[s.idx+1];
    const speed = (s.side==='attack'?runSpeed:walkSpeed) * s.speedMult / tickHz;
    const d = dist(cur,nxt);
    if(d <= speed){ s.pos = { ...nxt }; s.idx++; }
    else { s.pos = lerp2(cur,nxt,speed/d); }
    // site enter/leave
    for(const siteKey of Object.keys(map.sites)){
      const site = map.sites[siteKey];
      const inside = dist(s.pos, site.center) <= site.radius;
      if(inside && s.site!==siteKey){ events.push({type:'enter_site', roundNumber, pid, site:siteKey}); s.site=siteKey; }
      if(!inside && s.site===siteKey){ events.push({type:'leave_site', roundNumber, pid, site:siteKey}); s.site=null; }
    }
  }

  function maybeUtility(tick){
    if(tick%Math.floor(tickHz*2)!==0) return;
    for(const pid of players){
      const s = state[pid]; if(!s.alive) continue;
      if(rng.float()<utilityChance){
        const ability = ['smoke','flash','recon','molly'][rng.int(0,3)];
        events.push({type:'utility', roundNumber, tick, pid, ability, pos:{...s.pos}});
      }
    }
  }

  function handleEngagements(){
    const aliveAtk = players.filter(id=>state[id].alive && state[id].side==='attack');
    const aliveDef = players.filter(id=>state[id].alive && state[id].side==='defend');
    for(const a of aliveAtk){
      for(const d of aliveDef){
        const da = dist(state[a].pos, state[d].pos);
        if(da < engageRange){
          // symmetric kill chance modulated by baseSkill if available
          const aSkill = opts.playerIndex[a]?.baseSkill ?? 0.5;
          const dSkill = opts.playerIndex[d]?.baseSkill ?? 0.5;
          const aKillProb = killBaseProb * (1.0 + 0.8*(aSkill - dSkill));
          const dKillProb = killBaseProb * (1.0 + 0.8*(dSkill - aSkill));
          if(rng.float()<aKillProb){ state[d].alive=false; events.push({type:'kill', roundNumber, killer:a, victim:d, pos:{...state[d].pos}}); }
          else if(rng.float()<dKillProb){ state[a].alive=false; events.push({type:'kill', roundNumber, killer:d, victim:a, pos:{...state[a].pos}}); }
        }
      }
    }
  }

  for(let t=0;t<ticksPerRound;t++){
    for(const pid of players) moveTowards(pid);
    maybeUtility(t);
    handleEngagements();
    const frame={ roundNumber, tick:t, players: players.map(pid=>({id:pid, side:state[pid].side, alive:state[pid].alive?1:0, x:state[pid].pos.x, y:state[pid].pos.y})) };
    frames.push(frame);
  }

  return { frames, events };
}

function generateValorantReplayFramesWithMap(match, ticksPerRound=160, options={}){
  const rng = makeRng(options.seed||20260203);
  const mapName = match.map || match.mapName || 'Ascent';
  const map = MAP_TEMPLATES[mapName] || MAP_TEMPLATES.Ascent;
  // side mapping best-effort: first 5 attack, next 5 defend unless match has sides
  const sideByPlayer = {};
  const players = match.players || [];
  for(let i=0;i<players.length;i++){
    const p = players[i];
    const side = p.side || (i<Math.floor(players.length/2)?'attack':'defend');
    sideByPlayer[p.id]=side;
  }

  const allFrames=[]; const allEvents=[];
  const playerIndex = players.reduce((acc,p)=>{acc[p.id]=p;return acc;},{});
  for(const rnd of match.rounds || []){
    const { frames, events } = simulateRoundFrames(rnd.roundNumber||rnd.roundIndex||rnd.round||0, sideByPlayer, map, { ticksPerRound, tickHz: options.tickHz||12, playerIndex }, rng);
    allFrames.push(...frames);
    allEvents.push(...events);
  }

  return { frames: allFrames, events: allEvents };
}

module.exports = { generateValorantReplayFramesWithMap, MAP_TEMPLATES };
