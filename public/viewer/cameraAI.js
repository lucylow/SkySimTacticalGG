import * as THREE from "three";

/**
 * Camera AI - Auto-follows action with smooth transitions.
 */
export class CameraAI {
  constructor(camera) {
    this.camera = camera;
    this.target = null;
    this.cooldownUntil = 0;
    this.smoothness = 0.08;
  }

  scoreEvent(event) {
    const weights = {
      KILL: 5,
      OBJECTIVE: 4,
      UTILITY: 2,
      MOVE: 0.5
    };
    return weights[event.type] || 0;
  }

  maybeSwitch(event, now) {
    if (now < this.cooldownUntil) return;

    const score = this.scoreEvent(event);
    if (score >= 4) {
      const pos = event.payload?.position || [0, 0, 0];
      this.target = pos;
      this.cooldownUntil = now + 3000; // 3s lock
    }
  }

  update(dt) {
    if (!this.target) return;

    const desired = {
      x: this.target[0] + 15,
      y: 25,
      z: this.target[2] + 15
    };

    this.camera.position.lerp(
      new THREE.Vector3(desired.x, desired.y, desired.z),
      this.smoothness
    );
    this.camera.lookAt(this.target[0], 0, this.target[2]);
  }
}

/**
 * Multi-camera director AI - Chooses best camera for broadcast-style viewing.
 */
export class DirectorAI {
  constructor(cameras) {
    this.cameras = cameras;
    this.active = "overhead";
    this.lastSwitch = 0;
    this.switchCooldown = 2500; // 2.5s minimum between switches
  }

  score(event) {
    if (event.type === "KILL") {
      return { cam: "follow", score: 5 };
    }
    if (event.type === "OBJECTIVE") {
      return { cam: "overhead", score: 4 };
    }
    if (event.type === "AGENT_SIGNAL") {
      return { cam: "free", score: 3 };
    }
    return null;
  }

  maybeSwitch(event, now) {
    if (now - this.lastSwitch < this.switchCooldown) return;

    const decision = this.score(event);
    if (decision && decision.score >= 4) {
      this.active = decision.cam;
      this.lastSwitch = now;
    }
  }

  update(dt) {
    // Smooth camera transitions could be added here
  }

  getActiveCamera() {
    return this.cameras[this.active];
  }
}


