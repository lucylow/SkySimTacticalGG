import * as THREE from "three";

/**
 * Loads and renders the map geometry.
 * For a hack, we use simplified geometry. In production, load from GLTF/GLB.
 */
export function loadMap(scene) {
  // Ground plane
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid helper for reference
  const gridHelper = new THREE.GridHelper(200, 20, 0x444444, 0x222222);
  scene.add(gridHelper);

  // Simple bombsite markers (A and B sites)
  const siteA = createSiteMarker([-50, 0, -50], 0xff0000);
  const siteB = createSiteMarker([50, 0, 50], 0x0000ff);
  scene.add(siteA);
  scene.add(siteB);

  // Spawn areas (simplified)
  const spawnA = createSpawnArea([-80, 0, -80], 0x00ff00);
  const spawnB = createSpawnArea([80, 0, 80], 0xffff00);
  scene.add(spawnA);
  scene.add(spawnB);
}

function createSiteMarker(position, color) {
  const group = new THREE.Group();
  
  const marker = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 0.5, 16),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 })
  );
  marker.position.set(...position);
  marker.position.y = 0.25;
  group.add(marker);

  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({ color, transparent: true, opacity: 0.7 })
  );
  label.position.set(position[0], 10, position[2]);
  label.scale.set(10, 10, 1);
  group.add(label);

  return group;
}

function createSpawnArea(position, color) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.1, 20),
    new THREE.MeshStandardMaterial({ 
      color, 
      transparent: true, 
      opacity: 0.3,
      emissive: color,
      emissiveIntensity: 0.1
    })
  );
  mesh.position.set(...position);
  return mesh;
}


