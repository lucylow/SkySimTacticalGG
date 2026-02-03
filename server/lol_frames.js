// server/lol_frames.js
// Frame-level League of Legends simulation (positions, spells, autos, deaths)

const MAP = {
  width: 15000,
  height: 15000,
  lanes: {
    top: [{x:2000,y:13000},{x:7000,y:8000},{x:13000,y:2000}],
    mid: [{x:2000,y:7500},{x:7500,y:7500},{x:13000,y:7500}],
    bot: [{x:2000,y:2000},{x:7000,y:7000},{x:13000,y:13000}]
  }
};

function lerp(a,b,t){return a+(b-a)*t;}
function moveTowards(p, target, speed){
  const dx = target.x - p.x, dy = target.y - p.y;
  const d = Math.sqrt(dx*dx+dy*dy)||1;
  return {
    x: p.x + (dx/d)*speed,
    y: p.y + (dy/d)*speed
  };
}

function createFramePlayer(p, side) {
  return {
    id: p.id,
    champion: p.champion,
    side,
    hp: 1000,
    mana: 500,
    x: side === "Blue" ? 2000 : 13000,
    y: side === "Blue" ? 2000 : 13000,
    facing: 0,
    alive: true
  };
}

function simulateFrames(match, fps = 10) {
  const frames = [];
  const players = {};

  [...match.blue, ...match.red].forEach(p => {
    players[p.id] = createFramePlayer(p, p.id.includes("p1")||p.id.includes("p2")||p.id.includes("p3")||p.id.includes("p4")||p.id.includes("p5") ? "Blue":"Red");
  });

  const totalFrames = match.durationMin * 60 * fps;

  for (let f=0; f<totalFrames; f++) {
    const t = f / fps;
    const minute = Math.floor(t / 60);

    const events = [];

    Object.values(players).forEach(pl => {
      if (!pl.alive) return;

      // random lane drift
      const lane = MAP.lanes[["top","mid","bot"][Math.floor(Math.random()*3)]];
      const target = lane[Math.floor(Math.random()*lane.length)];

      const newPos = moveTowards(pl, target, 80/fps);
      pl.facing = Math.atan2(target.y-pl.y, target.x-pl.x);
      pl.x = newPos.x;
      pl.y = newPos.y;

      // auto attack
      if (Math.random() < 0.03) {
        events.push({
          type: "AUTO_ATTACK",
          source: pl.id,
          damage: Math.round(40 + Math.random()*60)
        });
      }

      // spell cast
      if (Math.random() < 0.015) {
        events.push({
          type: "SPELL_CAST",
          source: pl.id,
          spell: "Q",
          damage: Math.round(120 + Math.random()*180)
        });
      }
    });

    // deaths
    events.forEach(e => {
      if (e.damage && Math.random() < 0.02) {
        const victim = Object.values(players)[Math.floor(Math.random()*10)];
        victim.alive = false;
        events.push({ type: "DEATH", target: victim.id });
      }
    });

    frames.push({
      frame: f,
      time: t,
      minute,
      players: JSON.parse(JSON.stringify(players)),
      events
    });
  }

  return frames;
}

module.exports = { simulateFrames };
