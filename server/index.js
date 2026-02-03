// server/index.js
const express = require("express");
const cors = require("cors");

const { generateLoLMatch } = require("./lol_generator");
const { simulateFrames } = require("./lol_frames");
const { computeFeatures } = require("./lol_features");

const app = express();
app.use(cors());
app.use(express.json());

/* ===== Matches ===== */
app.get("/api/lol/match", (req,res)=>{
  const match = generateLoLMatch();
  res.json(match);
});

/* ===== Frames (SSE-like) ===== */
app.get("/api/lol/frames", (req,res)=>{
  const match = generateLoLMatch();
  const frames = simulateFrames(match);

  res.writeHead(200,{
    "Content-Type":"text/event-stream",
    "Cache-Control":"no-cache",
    "Connection":"keep-alive"
  });

  let i=0;
  const iv = setInterval(()=>{
    if(i>=frames.length){clearInterval(iv);res.end();return;}
    res.write(`data:${JSON.stringify(frames[i++])}\n\n`);
  },100);
});

/* ===== Dataset ===== */
app.get("/api/lol/dataset", (req,res)=>{
  const match = generateLoLMatch();
  res.json(computeFeatures(match));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT,()=>console.log(`Mock server on :${PORT}`));
