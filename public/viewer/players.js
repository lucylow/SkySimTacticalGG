import * as THREE from "three";

/**
 * Manages player meshes, movement, and trajectory trails.
 */
export class PlayerManager {
  constructor(scene) {
    this.scene = scene;
    this.players = {};
    this.trails = {};
    this.teamColors = {
      teamA: 0x00ffcc,
      teamB: 0xff6600
    };
  }

  spawn(id, pos, team = "teamA") {
    // Remove existing player if respawning
    if (this.players[id]) {
      this.scene.remove(this.players[id]);
      if (this.players[id].trailLine) {
        this.scene.remove(this.players[id].trailLine);
      }
    }

    // Create player mesh (capsule shape)
    const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
    const material = new THREE.MeshStandardMaterial({ 
      color: this.teamColors[team] || 0xffffff,
      emissive: this.teamColors[team] || 0xffffff,
      emissiveIntensity: 0.2
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(pos[0], 1, pos[2]);
    mesh.castShadow = true;
    this.scene.add(mesh);

    this.players[id] = mesh;
    this.trails[id] = [];
    this.players[id].team = team;
  }

  move(id, pos) {
    if (!this.players[id]) return;

    const p = this.players[id];
    p.position.set(pos[0], 1, pos[2]);

    // Track trajectory
    this.trails[id].push([...pos]);
    if (this.trails[id].length > 50) {
      this.trails[id].shift();
    }

    this.drawTrail(id);
  }

  drawTrail(id) {
    if (!this.players[id] || this.trails[id].length < 2) return;

    const points = this.trails[id].map(
      p => new THREE.Vector3(p[0], 0.05, p[2])
    );

    // Remove old trail
    if (this.players[id].trailLine) {
      this.scene.remove(this.players[id].trailLine);
    }

    // Create new trail line
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const team = this.players[id].team || "teamA";
    const color = this.teamColors[team] || 0xffffff;
    const material = new THREE.LineBasicMaterial({ 
      color,
      transparent: true,
      opacity: 0.6,
      linewidth: 2
    });

    const line = new THREE.Line(geometry, material);
    this.players[id].trailLine = line;
    this.scene.add(line);
  }

  kill(id) {
    if (this.players[id]) {
      // Change color to red, fade out
      this.players[id].material.color.set(0xff0000);
      this.players[id].material.emissive.set(0xff0000);
      this.players[id].material.transparent = true;
      this.players[id].material.opacity = 0.5;
      
      // Animate death
      const startY = this.players[id].position.y;
      const animate = () => {
        if (this.players[id].position.y > 0) {
          this.players[id].position.y -= 0.05;
          requestAnimationFrame(animate);
        }
      };
      animate();
    }
  }

  remove(id) {
    if (this.players[id]) {
      this.scene.remove(this.players[id]);
      if (this.players[id].trailLine) {
        this.scene.remove(this.players[id].trailLine);
      }
      delete this.players[id];
      delete this.trails[id];
    }
  }

  getPlayer(id) {
    return this.players[id];
  }

  getAllPlayers() {
    return Object.values(this.players);
  }
}


