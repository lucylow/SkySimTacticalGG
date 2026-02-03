// server/valorant_generator.js
// Enhanced Valorant Sample generator with map-aware movement, multi-shot engagement,
// facing vectors / peek model, per-player-round feature extraction, and CSV export.
//
// Usage (manual):
//   node server/valorant_generator.js
// This will generate JSON files into server/data/ and a consolidated CSV server/data/valorant_dataset.csv
//
// The exported functions are also used by server/server.js to (re)generate on demand.
//
// NOTE: no external dependencies required.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------------- Seeded RNG ----------------
function xorShift32(seed) {
  let x = seed >>> 0 || 88675123;
  return function () {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}
const RNG_SEED = 20260203;
const rand = xorShift32(RNG_SEED);
function randFloat(a = 0, b = 1) { return a + (b - a) * rand(); }
function randInt(a, b) { return Math.floor(randFloat(a, b + 1)); }
function randChoice(arr) { return arr[Math.floor(randFloat(0, arr.length))]; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function nowSec() { return Math.floor(Date.now() / 1000); }
function mkId(prefix) { return `${prefix}-${Math.floor(randFloat(100000, 999999))}`; }

// ---------------- Domain constants ----------------
const AGENTS = ['Jett','Sova','Sage','Viper','Reyna','Omen','Phoenix','Breach','Killjoy','Raze','Cypher','Brimstone','Skye','KAY/O','Neon','Astra'];
const WEAPONS = {
  Classic:{cost:0,power:0.05,acc:0.45,rate:6},
  Shorty:{cost:150,power:0.07,acc:0.4,rate:12},
  Frenzy:{cost:400,power:0.12,acc:0.35,rate:10},
  Ghost:{cost:500,power:0.35,acc:0.8,rate:6},
  Sheriff:{cost:800,power:0.6,acc:0.7,rate:1.2},
  Spectre:{cost:1600,power:0.5,acc:0.65,rate:10},
  Bulldog:{cost:2050,power:0.55,acc:0.68,rate:8},
  Guardian:{cost:2500,power:0.6,acc:0.72,rate:1.5},
  Phantom:{cost:2900,power:0.9,acc:0.78,rate:8},
  Vandal:{cost:2900,power:0.9,acc:0.76,rate:8},
  Operator:{cost:5000,power:1.3,acc:0.95,rate:0.6},
  Judge:{cost:1500,power:0.7,acc:0.45,rate:3}
};
const MAP_LIST = ['Ascent','Bind','Split'];
const ROUND_REWARD = { winBase:3250, loseBase:900, kill:200, plant:300, defuse:300 };

// ---------------- Map templates (coarse) ----------------
// Coordinates approx. same scale as earlier code (0..10000)
const MAP_TEMPLATES = {
  Ascent: {
    spawnA:{x:200,y:5000}, spawnB:{x:9800,y:5000},
    sites: {
      A: { center:{x:5100,y:3950}, radius:250, attackersPath:[{x:200,y:5000},{x:1800,y:4600},{x:3600,y:4300},{x:4800,y:4100},{x:5100,y:3950}], defendersPath:[{x:9800,y:5000},{x:8000,y:4700},{x:6200,y:4500},{x:5400,y:4200},{x:5100,y:3950}]},
      B: { center:{x:5100,y:6050}, radius:250, attackersPath:[{x:200,y:5000},{x:1800,y:5400},{x:3600,y:5800},{x:4800,y:6000},{x:5100,y:6050}], defendersPath:[{x:9800,y:5000},{x:8000,y:5300},{x:6200,y:5500},{x:5400,y:5800},{x:5100,y:6050}]},
      Mid:{center:{x:5200,y:5000}, radius:300, attackersPath:[{x:200,y:5000},{x:3000,y:5000},{x:5200,y:5000}], defendersPath:[{x:9800,y:5000},{x:7000,y:5000},{x:5200,y:5000}]}
    }
  },
  Bind: {
    spawnA:{x:200,y:5200}, spawnB:{x:9800,y:4800},
    sites: {
      A: { center:{x:5000,y:4200}, radius:260, attackersPath:[{x:200,y:5200},{x:2200,y:4800},{x:4000,y:4400},{x:4800,y:4300},{x:5000,y:4200}], defendersPath:[{x:9800,y:4800},{x:7600,y:4600},{x:5400,y:4400},{x:5000,y:4200}]},
      B: { center:{x:5200,y:6000}, radius:260, attackersPath:[{x:200,y:5200},{x:2200,y:5600},{x:4200,y:5800},{x:5000,y:6000},{x:5200,y:6000}], defendersPath:[{x:9800,y:4800},{x:7600,y:5200},{x:5400,y:5600},{x:5200,y:6000}]},
      Mid:{center:{x:5100,y:5100}, radius:280, attackersPath:[{x:200,y:5200},{x:2600,y:5100},{x:5200,y:5100}], defendersPath:[{x:9800,y:4800},{x:7400,y:4950},{x:5200,y:5100}]}
    }
  },
  Split: {
    spawnA:{x:200,y:4800}, spawnB:{x:9800,y:5200},
    sites: {
      A: { center:{x:4800,y:3800}, radius:240, attackersPath:[{x:200,y:4800},{x:2000,y:4300},{x:3600,y:4000},{x:4400,y:3900},{x:4800,y:3800}], defendersPath:[{x:9800,y:5200},{x:7600,y:4800},{x:6000,y:4500},{x:5000,y:4100},{x:4800,y:3800}]},
      B: { center:{x:5400,y:6200}, radius:240, attackersPath:[{x:200,y:4800},{x:2200,y:5300},{x:3800,y:5700},{x:4600,y:5900},{x:5400,y:6200}], defendersPath:[{x:9800,y:5200},{x:7600,y:5400},{x:6000,y:5600},{x:5400,y:6200}]},
      Mid:{center:{x:5200,y:5000}, radius:300, attackersPath:[{x:200,y:4800},{x:3000,y:5000},{x:5200,y:5000}], defendersPath:[{x:9800,y:5200},{x:7000,y:5100},{x:5200,y:5000}]}
    }
  }
};

// ---------------- Player & match generation utilities ----------------
function makePlayer(idx) {
  const agent = randChoice(AGENTS);
  const baseSkill = clamp(0.35 + randFloat(-0.12, 0.25), 0.05, 0.98);
  const id = `val-player-${idx+1}`;
  return {
    id,
    name: `Player${idx+1}`,
    agent,
    role: agentRole(agent),
    baseSkill,
    mmr: Math.round(1200 + baseSkill * 1400 + randFloat(-120, 120)),
    preferredWeapon: randChoice(Object.keys(WEAPONS))
  };
}
function agentRole(agent) {
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

// ---------------- Buy decision model (player-level) ----------------
function chooseBuy(wallet, teamMoney, oppMoney, isPistol, risk) {
  if (isPistol) { // pistol rules
    if (wallet >= 800 && randFloat() < 0.6) return { type:'Pistol', weapon: randChoice(['Ghost','Sheriff','Classic']) };
    return { type:'Pistol', weapon:'Classic' };
  }
  if (wallet < 800) return { type:'Eco', weapon:'Classic' };
  if (teamMoney >= 12000 && wallet >= 2900) return { type:'Full', weapon: randChoice(['Phantom','Vandal','Operator']) };
  if (oppMoney - teamMoney > 3000 && wallet >= 1500 && randFloat() < risk) return { type:'Force', weapon: randChoice(['Spectre','Bulldog','Phantom']) };
  if (wallet >= 1600 && wallet < 2900) return { type:'Partial', weapon: randChoice(['Spectre','Bulldog','Guardian']) };
  if (wallet >= 2900) return { type:'Full', weapon: randChoice(['Phantom','Vandal']) };
  return { type:'Eco', weapon:'Classic' };
}

// ---------------- Movement, facing & multi-shot engagement engine ----------------
// helpers
function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
function lerp(a,b,t){ return {x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t}; }
function cumulativeLengths(path){ const cum=[0]; for(let i=1;i<path.length;i++){ cum.push(cum[i-1]+dist(path[i-1],path[i])); } return cum; }
function pathPosition(path, cumLen, progress){ // progress 0..1
  if(progress<=0) return path[0];
  if(progress>=1) return path[path.length-1];
  const total=cumLen[cumLen.length-1];
  const d=progress*total;
  let i=0; while(i<cumLen.length-1 && d>=cumLen[i+1]) i++;
  const segLen=cumLen[i+1]-cumLen[i] || 1;
  const t=(d-cumLen[i])/segLen;
  return lerp(path[i], path[i+1], t);
}

// facing vector approx: velocity from previous position
// multi-shot engagement: attacker fires N shots at cadence 'rate' (shots per second) until victim dies or run out.
// At each shot compute hit probability = weapon.acc * (attackerSkill/(attackerSkill+defSkill)) * facingFactor * distanceFactor * peekFactor
// facingFactor: dot product between attacker facing and defender facing (if defender not facing attacker, attacker gets small bonus)
// peekFactor: if attacker approaching from angle behind defender -> small surprise bonus.

function simulateRoundFrames(match, roundIdx, roundObj, mapTemplate, ticksPerRound=180, tickHz=12) {
  // Build pathways for players: attackers go to random site path; defenders hold their site paths or rotate
  const frames = [];
  const siteChoice = roundObj.site || (randFloat()<0.6 ? 'A' : 'B');
  const site = mapTemplate.sites[siteChoice];
  const attackers = match.players.slice(0,5).map(p=>p.id);
  const defenders = match.players.slice(5,10).map(p=>p.id);

  // precompute per-player path and cum lengths
  const playerPlan = {};
  for(const p of match.players) {
    const side = attackers.includes(p.id) ? 'attackers' : 'defenders';
    const path = (side==='attackers') ? site.attackersPath : site.defendersPath;
    const cum = cumulativeLengths(path);
    // start near spawn
    const spawn = (side==='attackers') ? mapTemplate.spawnA : mapTemplate.spawnB;
    playerPlan[p.id] = { path, cum, spawn, progress:0, lastPos: {x:spawn.x+randFloat(-20,20), y:spawn.y+randFloat(-20,20)}, lastFacing:{x:1,y:0}, alive:true, hp:100 };
  }

  // compute buys map for quick lookup
  const buysMap = {};
  for(const b of roundObj.buys) buysMap[b.playerId]=b;

  // engagement state: shot cooldown per player (seconds until next shot)
  const shotCooldown = {}; // playerId -> seconds left
  const hpMap = {};
  for(const p of match.players){ hpMap[p.id]=100; shotCooldown[p.id]=0; }

  // per-shot model params
  function distanceFactor(d){
    // <200 good, 200-800 moderate, >800 low
    if(d<200) return 1.0;
    if(d<600) return 0.8;
    if(d<1100) return 0.55;
    return 0.3;
  }
  function facingFactor(attFacing, defFacing, attPos, defPos){
    // compute unit vectors and cos angle
    const av = normalize(attFacing), dv = normalize(defFacing || {x:0,y:1});
    const rel = normalize({x:defPos.x-attPos.x,y:defPos.y-attPos.y});
    // if defender facing away (dot(defFacing, rel) < -0.1) then attacker gets advantage
    const defAway = (dv.x*rel.x + dv.y*rel.y) < -0.2 ? 1.12 : 1.0;
    // attacker facing toward -> slight boost
    const attToward = (av.x*rel.x + av.y*rel.y) > 0.2 ? 1.05 : 1.0;
    return defAway * attToward;
  }
  function normalize(v){
    const n = Math.hypot(v.x||0, v.y||0) || 1;
    return {x:(v.x||0)/n, y:(v.y||0)/n};
  }

  // simulate ticks
  for(let t=0; t<ticksPerRound; t++){
    const ts = roundObj.startTime + Math.floor(t / tickHz);
    const tickRecord = { round: roundObj.roundNumber, tick: t, ts, players: [], events: [] };
    // update movement progress for each player
    for(const p of match.players){
      const plan = playerPlan[p.id];
      if(!plan.alive) {
        // dead players remain at lastPos
        tickRecord.players.push({ id:p.id, x: Math.round(plan.lastPos.x), y: Math.round(plan.lastPos.y), hp:hpMap[p.id] });
        continue;
      }
      // speed proportional to baseSkill and buyType: stronger buys -> slightly faster (confidence)
      const buy = buysMap[p.id] || { buyType:'Eco' };
      const buyMult = buy.buyType==='Full' ? 1.1 : buy.buyType==='Partial' ? 1.02 : buy.buyType==='Pistol' ? 1.0 : 0.9;
      const baseSpeed = 1200 + (p.baseSkill - 0.45) * 500; // units per sec
      const speed = baseSpeed * buyMult * (0.8 + randFloat(0,0.4));
      const deltaProgress = (speed / 10000) / tickHz; // scale to path length normalized
      plan.progress = clamp(plan.progress + deltaProgress, 0, 1);

      const pos = pathPosition(plan.path, plan.cum, plan.progress);
      // facing vector from last pos to new pos
      const facing = { x: pos.x - plan.lastPos.x, y: pos.y - plan.lastPos.y };
      plan.lastFacing = normalize(facing);
      plan.lastPos = pos;
      tickRecord.players.push({ id:p.id, x: Math.round(pos.x), y: Math.round(pos.y), hp: hpMap[p.id] });
    }

    // engagement detection: find cross-team pairs within mutual detection distance
    const playerPositions = tickRecord.players.reduce((acc, it)=>{ acc[it.id]=it; return acc; }, {});
    const ids = Object.keys(playerPositions);
    // simple O(n^2) loop given small player numbers
    for(let i=0;i<ids.length;i++){
      for(let j=i+1;j<ids.length;j++){
        const a = ids[i], b = ids[j];
        const sideA = buysMap[a].side, sideB = buysMap[b].side;
        if(sideA === sideB) continue;
        const pa = playerPositions[a], pb = playerPositions[b];
        const d = dist(pa,pb);
        if(d > 1200) continue; // too far
        // chance that they notice each other increases with proximity and facing
        const noticeProb = clamp(0.02 + 0.5 * (1 - d/1200), 0.02, 0.95);
        if(randFloat() > noticeProb) continue;
        // decide who shoots first: whoever has shorter shotCooldown or higher initiative (skill*weapon)
        const buyA = buysMap[a], buyB = buysMap[b];
        const weaponA = WEAPONS[buyA.weapon] || WEAPONS.Classic;
        const weaponB = WEAPONS[buyB.weapon] || WEAPONS.Classic;
        const initA = match.players.find(p=>p.id===a).baseSkill * (weaponA.power) * (1 + (shotCooldown[a] ? 0 : 0.12));
        const initB = match.players.find(p=>p.id===b).baseSkill * (weaponB.power) * (1 + (shotCooldown[b] ? 0 : 0.12));
        const attackerId = initA >= initB ? a : b;
        const defenderId = attackerId === a ? b : a;
        // simulate burst sequence: attacker fires up to N shots until defender HP <=0 or shots consumed
        const attackerBuy = buysMap[attackerId]; const defenderBuy = buysMap[defenderId];
        const weaponAtk = WEAPONS[attackerBuy.weapon] || WEAPONS.Classic;
        const weaponDef = WEAPONS[defenderBuy.weapon] || WEAPONS.Classic;
        const atkSkill = match.players.find(p=>p.id===attackerId).baseSkill;
        const defSkill = match.players.find(p=>p.id===defenderId).baseSkill;

        // shots-per-second rate
        const rate = weaponAtk.rate; // e.g., 8 shots/s
        const timeBetweenShots = 1.0 / rate;
        // simulate up to 6 shots or until defender dies
        const maxShots = Math.min(8, Math.ceil(7 * weaponAtk.rate)); // cap
        for(let s=0; s<maxShots; s++){
          // compute hit probability
          const dFactor = distanceFactor(d);
          const facingA = playerPlan[attackerId].lastFacing || {x:1,y:0};
          const facingB = playerPlan[defenderId].lastFacing || {x:1,y:0};
          const faceFactor = facingFactor(facingA, facingB, playerPositions[attackerId], playerPositions[defenderId]);
          // peek/surprise: attacker moving faster into defender from angle -> slight bonus
          const approachVector = normalize({x: playerPositions[defenderId].x - playerPositions[attackerId].x, y: playerPositions[defenderId].y - playerPositions[attackerId].y});
          const defLook = playerPlan[defenderId].lastFacing || {x:1,y:0};
          const relFacingDot = defLook.x*approachVector.x + defLook.y*approachVector.y; // if < -0.2 defender facing away
          const surprise = relFacingDot < -0.2 ? 1.2 : 1.0;

          const baseAcc = weaponAtk.acc || 0.5;
          const pHit = clamp(baseAcc * (atkSkill/(atkSkill+defSkill)) * dFactor * faceFactor * surprise, 0.01, 0.98);

          // sample hit
          const shotRoll = randFloat();
          tickRecord.events.push({ type:'shot', ts:ts, shooter: attackerId, target: defenderId, shotIndex: s, pHit: +pHit.toFixed(3), distance: Math.round(d) });
          if(shotRoll < pHit){
            // compute damage per hit ~ weapon power * (30..120)
            const dmg = Math.round((weaponAtk.power * 120 + randFloat(-10, 10)));
            hpMap[defenderId] -= dmg;
            tickRecord.events.push({ type:'hit', ts:ts, shooter: attackerId, target: defenderId, damage: dmg, hpRemaining: Math.max(0, hpMap[defenderId]) });
            if(hpMap[defenderId] <= 0){
              // kill
              tickRecord.events.push({ type:'kill', ts:ts, attacker: attackerId, victim: defenderId });
              playerPlan[defenderId].alive = false;
              break; // stop shots at this defender
            }
          }
          // otherwise miss -> defender may return fire in subsequent loop
          // small per-shot cooldown bookkeeping
        } // shots
      } // pair loop
    } // pair nested loop

    // emit ability events occasionally
    if(randFloat() < 0.045){
      const p = randChoice(match.players).id;
      tickRecord.events.push({ type:'ability', ts, playerId:p, ability: 'generic_ability' });
    }

    // push frame
    frames.push(tickRecord);
  } // ticks

  // add round_end summary
  frames.push({ round: roundObj.roundNumber, tick: ticksPerRound, ts: roundObj.startTime + Math.ceil(roundObj.durationSec), events:[{ type:'round_end', winner: roundObj.winner }] });
  return frames;
}

// ---------------- Match & rounds simulation ----------------
function generateValorantMatch({ rounds=24, mapName=null } = {}) {
  const id = mkId('val-match');
  const map = mapName || randChoice(MAP_LIST);
  const t0 = nowSec() - randInt(3600, 3600*4);
  // players
  const players = Array.from({length:10}).map((_,i)=>makePlayer(i));
  // initial wallets
  const wallets = {}; players.forEach(p=>wallets[p.id]=800);
  const roundsArr = [];
  let attackersWins=0, defendersWins=0;
  for(let r=1;r<=rounds;r++){
    const isPistol = (r===1) || (r===Math.ceil(rounds/2)+1);
    const teamMoney = {
      attackers: players.slice(0,5).reduce((s,p)=>s+wallets[p.id],0),
      defenders: players.slice(5,10).reduce((s,p)=>s+wallets[p.id],0)
    };
    // buys
    const buys = [];
    for(const p of players){
      const side = players.indexOf(p) < 5 ? 'attackers' : 'defenders';
      const risk = 0.05 + (p.baseSkill - 0.4) * 0.3 + randFloat(-0.05,0.12);
      const choice = chooseBuy(wallets[p.id], teamMoney[side], teamMoney[side==='attackers'?'defenders':'attackers'], isPistol, risk);
      const weaponInfo = WEAPONS[choice.weapon] || WEAPONS.Classic;
      const purchased = weaponInfo.cost <= wallets[p.id];
      if(purchased) wallets[p.id] -= weaponInfo.cost;
      buys.push({ playerId: p.id, side, buyType: choice.type, weapon: choice.weapon, spent: purchased?weaponInfo.cost:0, purchased, walletAfter: wallets[p.id]});
    }
    // determine winner via team power + randomness
    function teamPower(side){
      const teamBuys = buys.filter(b=>b.side===side);
      let s=0;
      for(const b of teamBuys){
        const ply = players.find(pp=>pp.id===b.playerId);
        const wp = (WEAPONS[b.weapon] && WEAPONS[b.weapon].power) || 0.35;
        const mult = b.buyType==='Full'?1.0:(b.buyType==='Partial'?0.85:(b.buyType==='Pistol'?0.65:0.5));
        s += ply.baseSkill * wp * mult * (1 + wallets[b.playerId]/12000);
      }
      return s * (1 + randFloat(-0.07, 0.07));
    }
    const atkPower = teamPower('attackers'), defPower = teamPower('defenders');
    const rawProb = atkPower / (atkPower + defPower);
    const probAdj = isPistol ? randFloat(-0.18, 0.18) : randFloat(-0.06,0.06);
    const winProbAttack = clamp(rawProb + probAdj, 0.02, 0.98);
    const attackWins = randFloat() < winProbAttack;
    const winner = attackWins ? 'attackers' : 'defenders';
    if(winner==='attackers') attackersWins++; else defendersWins++;

    // per-player round stats
    const playerRoundResults = [];
    for(const b of buys){
      const ply = players.find(pp=>pp.id===b.playerId);
      let expKills = ply.baseSkill * ((b.buyType==='Eco')?0.5:(b.buyType==='Pistol')?0.8:1.0) * ((winner===b.side)?1.2:0.6);
      expKills = clamp(expKills * (1 + randFloat(-0.6,0.6)), 0, 7);
      const kills = Math.max(0, Math.round(expKills + randFloat(-1.5,1.5)));
      const assists = Math.round(kills * randFloat(0,0.7));
      const deaths = (winner===b.side) ? randInt(0,2) : Math.max(1, randInt(1,4));
      const damage = Math.round(kills * (30 + (WEAPONS[b.weapon] ? WEAPONS[b.weapon].power*120 : 40)) + assists*20 + randFloat(0,80));
      const abilityUses = Math.max(0, Math.round(ply.baseSkill*3 + (ply.role==='Controller'?1.5:0) + randFloat(-1,2)));
      playerRoundResults.push({ playerId: b.playerId, side: b.side, kills, assists, deaths, damage, abilityUses, planted:false, defused:false, payout:0 });
    }
    // plant/defuse heuristics
    let spikePlanted=false, plantPlayer=null;
    if(winner==='attackers' && randFloat() < 0.6){
      spikePlanted = true;
      const planter = playerRoundResults.filter(pr=>pr.side==='attackers' && pr.kills>=0);
      if(planter.length) {
        plantPlayer = randChoice(planter).playerId;
        playerRoundResults.find(pr=>pr.playerId===plantPlayer).planted=true;
      }
    }
    if(winner==='defenders' && randFloat()<0.06 && spikePlanted){
      const defuserCandidates = playerRoundResults.filter(pr=>pr.side==='defenders');
      if(defuserCandidates.length) defuserCandidates[0].defused=true;
    }
    // payouts
    for(const pr of playerRoundResults){
      const teamWin = pr.side===winner;
      const base = teamWin ? ROUND_REWARD.winBase : ROUND_REWARD.loseBase;
      const killReward = pr.kills * ROUND_REWARD.kill;
      const plantBonus = pr.planted ? ROUND_REWARD.plant : 0;
      const defuseBonus = pr.defused ? ROUND_REWARD.defuse : 0;
      pr.payout = base + killReward + plantBonus + defuseBonus;
      // update wallets
      const buyEntry = buys.find(b=>b.playerId===pr.playerId);
      wallets[pr.playerId] += pr.payout;
      buyEntry.walletAfter = wallets[pr.playerId];
    }
    const roundObj = {
      roundNumber: r,
      startTime: t0 + (r-1)*90,
      durationSec: randInt(35,120),
      buys,
      playerRoundResults,
      spikePlanted,
      plantPlayer,
      winner,
      winProbAttack: +winProbAttack.toFixed(3),
      site: randFloat()<0.6?'A':'B'
    };
    roundsArr.push(roundObj);
  } // rounds

  const match = {
    id: mkId('val-match'),
    title: `Valorant Sample ${Math.floor(randFloat(1000,9999))}`,
    map: map,
    startedAt: t0,
    roundsPlayed: rounds,
    players: players.map(p=>({id:p.id,name:p.name,agent:p.agent,role:p.role,baseSkill:p.baseSkill,mmr:p.mmr})),
    rounds: roundsArr,
    finalScore:{attackers:attackersWins,defenders:defendersWins},
    generatedAt: nowSec()
  };

  return match;
}

// ---------------- Frame generator (per match) using multi-shot engine ----------------
function generateReplayFramesForMatch(match, opts={ticksPerRound:160, tickHz:12}) {
  const { frames } = generateValorantReplayFramesWithMap(match, opts.ticksPerRound, { tickHz: opts.tickHz });
  return frames;
}

// simulateRoundFrames is defined earlier (we reuse) - but ensure it is in scope
// For brevity, reuse the function above with the same name simulateRoundFrames
// If not found (this file is self-contained) we call simulateRoundFrames defined earlier in file scope.

// ---------------- Feature extraction and CSV export ----------------
function extractFeaturesForMatch(match, rolling=5) {
  // Flatten per-player-round rows
  const rows=[];
  for(const rnd of match.rounds){
    for(const pr of rnd.playerRoundResults){
      const buy = rnd.buys.find(b=>b.playerId===pr.playerId);
      const player = match.players.find(p=>p.id===pr.playerId);
      rows.push({
        matchId: match.id,
        roundNumber: rnd.roundNumber,
        playerId: pr.playerId,
        side: pr.side,
        buyType: buy?buy.buyType:'NA',
        weapon: buy?buy.weapon:'NA',
        spent: buy?buy.spent:0,
        walletAfter: buy?buy.walletAfter:0,
        kills: pr.kills,
        assists: pr.assists,
        deaths: pr.deaths,
        damage: pr.damage,
        abilityUses: pr.abilityUses,
        planted: pr.planted?1:0,
        defused: pr.defused?1:0,
        payout: pr.payout,
        baseSkill: player.baseSkill,
        winProbAttack: rnd.winProbAttack,
        roundWinnerIsPlayerTeam: pr.side===rnd.winner?1:0
      });
    }
  }
  // compute rolling features per player
  const byPlayer = {};
  for(const r of rows){
    if(!byPlayer[r.playerId]) byPlayer[r.playerId]=[];
    r.avgKillsLast5 = avgOfLastN(byPlayer[r.playerId].map(x=>x.kills),5);
    r.avgSpentLast5 = avgOfLastN(byPlayer[r.playerId].map(x=>x.spent),5);
    r.numFullBuysLast5 = (byPlayer[r.playerId].slice(-5).filter(x=>x.buyType==='Full').length) || 0;
    byPlayer[r.playerId].push(r);
  }
  return rows;
}

function avgOfLastN(arr, n){
  if(!arr || arr.length===0) return 0;
  const slice = arr.slice(-n);
  const s = slice.reduce((a,b)=>a+(b||0),0);
  return +(s / slice.length).toFixed(3);
}

// ---------------- CSV writer ----------------
function writeCSV(rows, outFile) {
  if(!rows || rows.length===0) {
    fs.writeFileSync(outFile,'');
    return;
  }
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(',')];
  for(const r of rows){
    const vals = keys.map(k=>{
      const v=r[k];
      if(v===null||v===undefined) return '';
      if(typeof v === 'string') return `"${String(v).replace(/"/g,'""')}"`;
      return String(v);
    });
    lines.push(vals.join(','));
  }
  fs.writeFileSync(outFile, lines.join('\n'));
}

// ---------------- Top-level produce function ----------------
export function produceDataset({count=5, rounds=26, ticksPerRound=160, writeCSV=true}={}) {
  const matchesIndex = [];
  const allFeatureRows=[];
  for(let i=0;i<count;i++){
    const match = generateValorantMatch({ rounds, mapName: randChoice(MAP_LIST) });
    // generate replay frames
    match.replayFrames = generateReplayFramesForMatch(match, { ticksPerRound, tickHz: 12 });
    // write match JSON
    const fname = path.join(OUT_DIR, `${match.id}.json`);
    fs.writeFileSync(fname, JSON.stringify(match, null, 2));
    console.log('Wrote', fname);
    matchesIndex.push({ id: match.id, title: match.title, map: match.map });
    // features
    const rows = extractFeaturesForMatch(match, 5);
    allFeatureRows.push(...rows);
  }
  // write index
  fs.writeFileSync(path.join(OUT_DIR,'valorant_matches_index.json'), JSON.stringify(matchesIndex, null, 2));
  console.log('Wrote index for', matchesIndex.length, 'matches');

  if(writeCSV){
    const csvFile = path.join(OUT_DIR, 'valorant_dataset.csv');
    writeCSV(allFeatureRows, csvFile);
    console.log('Wrote CSV dataset to', csvFile, 'rows:', allFeatureRows.length);
  }
  return { matchesIndex, rows: allFeatureRows };
}

// ---------------- If run as script ----------------
import { argv } from 'process';
if (argv[1] === __filename) {
  console.log('Generating enhanced Valorant Sample dataset (map-aware, multi-shot, facing/peek, CSV) ...');
  produceDataset({ count: 4, rounds: 26, ticksPerRound: 160, writeCSV: true });
  console.log('Done. Files in server/data/');
}

// Export for server usage
export { generateValorantMatch, generateReplayFramesForMatch, extractFeaturesForMatch };

