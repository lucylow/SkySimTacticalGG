// server/server.cjs
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const VAL_FILE = path.join(DATA_DIR, 'valorant.json');
const LOL_FILE = path.join(DATA_DIR, 'lol.json');

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const app = express();
app.use(cors());
app.use(express.json());

// simple: return games list
app.get('/api/games', (req, res) => {
  res.json([{ id: 'valorant', name: 'Valorant' }, { id: 'league', name: 'League of Legends' }]);
});

/* -------------- Valorant endpoints -------------- */

// list matches
app.get('/api/valorant/matches', (req, res) => {
  const data = readJson(VAL_FILE);
  if (!data) return res.status(500).json({ error: 'valorant dataset missing, run seed' });
  const summary = data.matches.map(m => ({ id: m.id, title: m.title, map: m.map, startedAt: m.startedAt, durationSec: m.durationSec || 3600 }));
  res.json(summary);
});

// match detail
app.get('/api/valorant/match/:id', (req, res) => {
  const id = req.params.id;
  const data = readJson(VAL_FILE);
  if (!data) return res.status(500).json({ error: 'valorant dataset missing' });
  const match = data.matches.find(m => m.id === id);
  if (!match) return res.status(404).json({ error: 'match not found' });
  res.json(match);
});

// replay metadata (fast)
app.get('/api/valorant/match/:id/replay', (req, res) => {
  const data = readJson(VAL_FILE);
  const match = data.matches.find(m => m.id === req.params.id);
  if (!match) return res.status(404).json({ error: 'not found' });
  res.json({ id: match.id, frames: match.replayFrames.length, players: match.players.map(p => ({ id: p.id, name: p.name })) });
});

// SSE streaming of replay frames: /replay/valorant/:id/stream
app.get('/replay/valorant/:id/stream', (req, res) => {
  const id = req.params.id;
  const data = readJson(VAL_FILE);
  if (!data) return res.status(500).json({ error: 'valorant dataset missing' });
  const match = data.matches.find(m => m.id === id);
  if (!match) return res.status(404).json({ error: 'match not found' });

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.flushHeaders();

  // stream frames at configurable speed
  const speed = parseFloat(req.query.speed) || 1.0; // 1 = realtime-ish
  let i = 0;
  const frames = match.replayFrames;
  const intervalMs = Math.max(10, Math.round(1000 / 10 / speed)); // 10 fps-ish default

  const iv = setInterval(() => {
    if (i >= frames.length) {
      res.write(`event: done\n`);
      res.write(`data: ${JSON.stringify({ finished: true })}\n\n`);
      clearInterval(iv);
      res.end();
      return;
    }
    const f = frames[i];
    // emit as message and also typed events for important events
    res.write(`event: frame\n`);
    res.write(`data: ${JSON.stringify({ tick: f.tick, players: f.players.length })}\n\n`);

    // emit individual events within frame if exist
    if (Array.isArray(f.events) && f.events.length > 0) {
      f.events.forEach(ev => {
        res.write(`event: ${ev.type}\n`);
        res.write(`data: ${JSON.stringify(ev)}\n\n`);
      });
    }

    // send small heartbeat
    if (i % 50 === 0) {
      res.write(`: heartbeat\n\n`);
    }

    i++;
  }, intervalMs);

  req.on('close', () => {
    clearInterval(iv);
  });
});

/* -------------- League endpoints -------------- */

app.get('/api/lol/matches', (req, res) => {
  const data = readJson(LOL_FILE);
  if (!data) return res.status(500).json({ error: 'league dataset missing, run seed' });
  res.json(data.matches.map(m => ({ id: m.id, title: m.title, durationMinutes: m.durationMinutes })));
});

app.get('/api/lol/match/:id', (req, res) => {
  const data = readJson(LOL_FILE);
  const match = data.matches.find(m => m.id === req.params.id);
  if (!match) return res.status(404).json({ error: 'match not found' });
  res.json(match);
});

// replay metadata (fast)
app.get('/api/lol/match/:id/replay', (req, res) => {
  const data = readJson(LOL_FILE);
  const match = data.matches.find(m => m.id === req.params.id);
  if (!match) return res.status(404).json({ error: 'match not found' });
  res.json({ id: match.id, frames: match.replayFrames.length, players: match.players.map(p => ({ id: p.id, name: p.name })) });
});

app.get('/replay/lol/:id/stream', (req, res) => {
  const id = req.params.id;
  const data = readJson(LOL_FILE);
  if (!data) return res.status(500).json({ error: 'league dataset missing' });
  const match = data.matches.find(m => m.id === id);
  if (!match) return res.status(404).json({ error: 'match not found' });

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.flushHeaders();

  const speed = parseFloat(req.query.speed) || 1.0;
  let i = 0;
  const frames = match.replayFrames;
  const intervalMs = Math.max(50, Math.round(1000 / 2 / speed)); // low fps - 2 fps for coarse frames

  const iv = setInterval(() => {
    if (i >= frames.length) {
      res.write(`event: done\n`);
      res.write(`data: ${JSON.stringify({ finished: true })}\n\n`);
      clearInterval(iv);
      res.end();
      return;
    }
    const f = frames[i];
    res.write(`event: frame\n`);
    res.write(`data: ${JSON.stringify({ tick: f.tick, minute: f.minute, players: f.players.length })}\n\n`);
    if (Array.isArray(f.events) && f.events.length > 0) {
      f.events.forEach(ev => {
        res.write(`event: ${ev.type}\n`);
        res.write(`data: ${JSON.stringify(ev)}\n\n`);
      });
    }
    if (i % 20 === 0) res.write(`: heartbeat\n\n`);
    i++;
  }, intervalMs);

  req.on('close', () => clearInterval(iv));
});

/* ---------------- default / static --------------- */
app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: Date.now() }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Mock server listening on http://localhost:${PORT}`));
