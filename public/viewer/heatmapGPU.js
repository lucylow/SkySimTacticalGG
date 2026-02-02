import * as THREE from "three";

/**
 * GPU-instanced heatmap renderer for kill/movement density.
 */
export class HeatmapGPU {
  constructor(scene) {
    this.scene = scene;
    this.gridSize = 50;
    this.cellSize = 4;
    this.heatmap = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
    this.maxIntensity = 0;
    this.instancedMesh = null;
    this.enabled = false;
    this.init();
  }

  init() {
    const COUNT = this.gridSize * this.gridSize;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial();
    
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, COUNT);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.instancedMesh);
    this.updateInstances();
  }

  updateKill(x, z) {
    if (!this.enabled) return;
    
    const gx = Math.floor((x + 100) / this.cellSize);
    const gz = Math.floor((z + 100) / this.cellSize);
    
    if (gx >= 0 && gx < this.gridSize && gz >= 0 && gz < this.gridSize) {
      this.heatmap[gx][gz] += 1;
      this.maxIntensity = Math.max(this.maxIntensity, this.heatmap[gx][gz]);
      this.updateInstances();
    }
  }

  updateInstances() {
    const dummy = new THREE.Object3D();
    const colors = new Float32Array(this.gridSize * this.gridSize * 3);
    let index = 0;

    for (let x = 0; x < this.gridSize; x++) {
      for (let z = 0; z < this.gridSize; z++) {
        const intensity = this.heatmap[x][z];
        
        if (intensity > 0) {
          const height = Math.max(0.1, (intensity / Math.max(1, this.maxIntensity)) * 5);
          const worldX = x * this.cellSize - 100;
          const worldZ = z * this.cellSize - 100;

          dummy.position.set(worldX, height * 0.5, worldZ);
          dummy.scale.set(1, height, 1);
          dummy.updateMatrix();
          this.instancedMesh.setMatrixAt(index, dummy.matrix);

          // Color based on intensity (blue to red)
          const hue = 0.7 - (intensity / Math.max(1, this.maxIntensity)) * 0.5;
          const color = new THREE.Color().setHSL(hue, 1, 0.5);
          colors[index * 3] = color.r;
          colors[index * 3 + 1] = color.g;
          colors[index * 3 + 2] = color.b;
        } else {
          // Hide empty cells
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          this.instancedMesh.setMatrixAt(index, dummy.matrix);
        }

        index++;
      }
    }

    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  toggle() {
    this.enabled = !this.enabled;
    this.instancedMesh.visible = this.enabled;
  }

  reset() {
    this.heatmap = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
    this.maxIntensity = 0;
    this.updateInstances();
  }
}


