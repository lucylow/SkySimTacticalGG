import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.156/build/three.module.js";
import { loadMap } from "./map.js";
import { PlayerManager } from "./players.js";
import { ReplayState } from "./stateEngine.js";
import { Timeline } from "./timeline.js";
import { ReplaySocket } from "./ws.js";
import { CameraAI, DirectorAI } from "./cameraAI.js";
import { HeatmapGPU } from "./heatmapGPU.js";

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
scene.fog = new THREE.Fog(0x111111, 50, 200);

// Create multiple camera rigs
const cameras = {
  follow: new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500),
  overhead: new THREE.OrthographicCamera(-50, 50, 50, -50, 0.1, 500),
  free: new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 800)
};

// Initialize cameras
cameras.follow.position.set(40, 60, 40);
cameras.follow.lookAt(0, 0, 0);
cameras.overhead.position.set(0, 100, 0);
cameras.overhead.lookAt(0, 0, 0);
cameras.free.position.set(60, 80, 60);
cameras.free.lookAt(0, 0, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(50, 80, 50);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Load map
loadMap(scene);

// Initialize systems
const players = new PlayerManager(scene);
const replay = new ReplayState(players);
const timeline = new Timeline(replay);
const director = new DirectorAI(cameras);
const heatmap = new HeatmapGPU(scene);

// Mode management
let MODE = "viewer";
window.setMode = (m) => {
  MODE = m;
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === m);
  });
  document.getElementById("stats-panel").classList.toggle("hidden", m !== "analyst" && m !== "coach");
};

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => window.setMode(btn.dataset.mode));
});

// WebSocket connection
const wsUrl = `ws://${window.location.hostname}:8000/ws/replay`;
const socket = new ReplaySocket(wsUrl, (event) => {
  replay.apply(event);
  director.maybeSwitch(event, performance.now());
  
  if (event.type === "KILL" && MODE === "analyst") {
    const pos = event.payload?.position || [0, 0, 0];
    heatmap.updateKill(pos[0], pos[2]);
  }
  
  if (event.type === "AGENT_SIGNAL") {
    showAIInsight(event);
  }
});

// UI Controls
const scrubber = document.getElementById("scrubber");
const clock = document.getElementById("clock");
const playPauseBtn = document.getElementById("play-pause");
const resetBtn = document.getElementById("reset");

scrubber.addEventListener("input", (e) => {
  const t = parseFloat(e.target.value);
  timeline.seek(t);
});

playPauseBtn.addEventListener("click", () => {
  replay.togglePause();
  playPauseBtn.textContent = replay.paused ? "▶" : "⏸";
});

resetBtn.addEventListener("click", () => {
  replay.reset();
  timeline.seek(0);
});

// Animation loop
let lastTime = performance.now();
function animate() {
  requestAnimationFrame(animate);
  
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  
  if (!replay.paused) {
    replay.update(dt);
  }
  
  director.update(dt);
  const activeCam = director.getActiveCamera();
  
  renderer.render(scene, activeCam);
  
  // Update UI
  const progress = timeline.getProgress();
  scrubber.value = progress * 100;
  clock.textContent = formatTime(timeline.getCurrentTime());
}

animate();

// Window resize
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  Object.values(cameras).forEach(cam => {
    if (cam.isPerspectiveCamera) {
      cam.aspect = width / height;
      cam.updateProjectionMatrix();
    }
  });
});

// Helper functions
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function showAIInsight(signal) {
  const panel = document.getElementById("ai-insights");
  panel.innerHTML = `
    <strong>${signal.type}</strong><br>
    Confidence: ${(signal.confidence * 100).toFixed(0)}%<br>
    ${signal.explanation?.description || ""}
  `;
  panel.classList.remove("hidden");
  setTimeout(() => panel.classList.add("hidden"), 5000);
}

// Load Sample events if WebSocket fails
fetch("/Sample/events.json")
  .then(r => r.json())
  .catch(() => null)
  .then(events => {
    if (events) {
      replay.load(events);
    }
  });



