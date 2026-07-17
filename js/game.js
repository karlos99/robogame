import * as THREE from 'three';
import { buildDroid } from './robot.js';
import { buildCourse, circleRectCollision, circleCircleCollision, getFloorHeight, getStartPos, getGoalPos, updateBeacon, loadTextures, MAP, COLS, ROWS, TILE, W, H } from './obstacles.js';
import { createStarfield, createDustParticles, spawnExplosion, spawnDriftDust, updateDynamicParticles } from './environment.js';
import { AudioSystem } from './audio.js';

const container = document.getElementById('game-canvas-container');
const winOverlay = document.getElementById('win-overlay');
const cooldownFill = document.getElementById('cooldown-fill');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06060e);
scene.fog = new THREE.FogExp2(0x06060e, 0.025);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
camera.position.set(0, 8, -10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(1, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xd0e0ff, 0.95);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfffdf6, 2.5);
sunLight.position.set(15, 25, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048; // sharper shadows
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 60;
sunLight.shadow.camera.left = -30;
sunLight.shadow.camera.right = 30;
sunLight.shadow.camera.top = 30;
sunLight.shadow.camera.bottom = -30;
sunLight.shadow.bias = -0.0005; // reduce shadow acne
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0xaaccff, 0.85);
fillLight.position.set(-15, 18, -12);
scene.add(fillLight);

const backLight = new THREE.DirectionalLight(0xffebd0, 0.6);
backLight.position.set(10, 12, -20);
scene.add(backLight);

const hemiLight = new THREE.HemisphereLight(0xd0e8ff, 0x3d352b, 1.4);
scene.add(hemiLight);

let starfield = null;
let dust = null;
let courseData = null;
let droid = null;
let droidConfig = null;
let pos = { x: 0, z: 0 };
let angle = 0;
let running = false;
let animId = null;
let won = false;
let startTime = 0;
let groundIndicator = null;
let droidY = 0;
let hovering = false;
let laserColorHex = 0xff2244;

// Driving physics velocities and recoil state
let vx = 0;
let vz = 0;
let recoil = 0;
let boostActive = false;
let boostTimer = 0;
let boostCooldownTimer = 0;
const BOOST_DURATION = 2.0;
const BOOST_COOLDOWN = 7.0;
const BOOST_SPEED_MULT = 3.0;
let boostPush = 0;
let boostFlame = null;

// Dynamic lighting
let headlight = null;
let taillight = null;

const keys = {};
const lasers = [];
let lastFireTime = 0;
const FIRE_COOLDOWN = 0.35;
const LASER_SPEED = 28;
const LASER_RANGE = 42;

const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');
const boostFill = document.getElementById('boost-fill');

function disposeGroup(group) {
  group.traverse(child => {
    if (child.isMesh) {
      child.geometry?.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else {
        child.material?.dispose();
      }
    }
  });
}

function resizeRenderer() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w > 0 && h > 0) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
}

function setupEnvironment() {
  if (!starfield) {
    starfield = createStarfield(2000, 80);
    scene.add(starfield.points);
  }
  if (!dust) {
    dust = createDustParticles(150, 40);
    scene.add(dust.points);
  }
}

function setupCourse() {
  if (courseData) {
    scene.remove(courseData.courseGroup);
    disposeGroup(courseData.courseGroup);
  }
  courseData = buildCourse(scene);
}

function placeDroid() {
  if (droid) {
    scene.remove(droid);
    disposeGroup(droid);
  }
  droid = buildDroid(droidConfig);
  droid.castShadow = true;
  const start = courseData.startPos;
  pos.x = start.x;
  pos.z = start.z;
  angle = 0;
  // Initialize driving velocity
  vx = 0;
  vz = 0;
  recoil = 0;

  droid.position.set(pos.x, 0.01, pos.z);
  droid.rotation.y = 0;
  scene.add(droid);

  // Initialize dynamic headlight and taillight
  if (headlight) {
    scene.remove(headlight);
    scene.remove(headlight.target);
    headlight = null;
  }
  headlight = new THREE.SpotLight(0xffffff, 8, 20, Math.PI / 4, 0.5, 1.2);
  headlight.castShadow = true;
  headlight.shadow.mapSize.width = 1024;
  headlight.shadow.mapSize.height = 1024;
  headlight.shadow.camera.near = 0.5;
  headlight.shadow.camera.far = 25;
  headlight.shadow.bias = -0.0005;
  scene.add(headlight);
  scene.add(headlight.target);

  if (taillight) {
    scene.remove(taillight);
    taillight = null;
  }
  taillight = new THREE.PointLight(0xff0000, 0.5, 4);
  scene.add(taillight);

  if (!groundIndicator) {
    groundIndicator = new THREE.Group();
    const giMat = new THREE.MeshStandardMaterial({ color: 0x44ffaa, emissive: 0x22cc88, emissiveIntensity: 0.8, transparent: true, opacity: 0.5, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.025, 8, 24), giMat);
    ring.rotation.x = Math.PI / 2;
    groundIndicator.add(ring);
    const arrowShaft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.5), giMat);
    arrowShaft.position.set(0, 0, 0.85);
    groundIndicator.add(arrowShaft);
    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 5), giMat);
    arrowHead.rotation.x = -Math.PI / 2;
    arrowHead.position.set(0, 0, 1.15);
    groundIndicator.add(arrowHead);
    groundIndicator.position.y = 0.03;
  }
  groundIndicator.position.x = pos.x;
  groundIndicator.position.z = pos.z;
  groundIndicator.rotation.y = angle;
  scene.add(groundIndicator);
}

export async function start(config) {
  droidConfig = config;
  won = false;
  droidY = 0;
  hovering = false;
  boostActive = false;
  boostTimer = 0;
  boostCooldownTimer = 0;
  boostPush = 0;
  if (boostFlame) {
    scene.remove(boostFlame);
    disposeGroup(boostFlame);
    boostFlame = null;
  }
  laserColorHex = new THREE.Color(config.colors.laser || '#ff2244').getHex();
  winOverlay.classList.add('hidden');

  resizeRenderer();

  await loadTextures();

  setupEnvironment();
  setupCourse();
  placeDroid();

  startTime = performance.now() / 1000;

  AudioSystem.startEngine();

  if (!running) {
    running = true;
    loop();
  }
}

export function stop() {
  running = false;
  AudioSystem.stopEngine();
  if (animId) { cancelAnimationFrame(animId); animId = null; }
}

export function cleanup() {
  stop();
  for (const l of lasers) {
    scene.remove(l.mesh);
    if (l.light) scene.remove(l.light);
  }
  lasers.length = 0;
  if (droid) { scene.remove(droid); disposeGroup(droid); }
  if (courseData) { scene.remove(courseData.courseGroup); disposeGroup(courseData.courseGroup); }
  if (groundIndicator) { scene.remove(groundIndicator); }
  
  if (headlight) {
    scene.remove(headlight);
    scene.remove(headlight.target);
    headlight = null;
  }
  if (taillight) {
    scene.remove(taillight);
    taillight = null;
  }
  if (boostFlame) {
    scene.remove(boostFlame);
    disposeGroup(boostFlame);
    boostFlame = null;
  }
  
  boostActive = false;
  boostTimer = 0;
  boostCooldownTimer = 0;
  boostPush = 0;
  
  courseData = null;
  droid = null;
  droidY = 0;
  hovering = false;
}

function loop() {
  if (!running) return;
  animId = requestAnimationFrame(loop);
  update();
  updateLasers();
  updateDynamicParticles(scene);
  render();
}

function activateBoost() {
  boostActive = true;
  boostTimer = BOOST_DURATION;
  boostCooldownTimer = BOOST_COOLDOWN;
  boostPush = 1.0;
  createBoostFlame();
}

function createBoostFlame() {
  if (boostFlame) {
    scene.remove(boostFlame);
    disposeGroup(boostFlame);
  }
  boostFlame = new THREE.Group();

  const flameGeo = new THREE.ConeGeometry(0.28, 0.9, 8, 4);
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 2.5,
    transparent: true, opacity: 0.9, depthWrite: false
  });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.rotation.x = Math.PI / 2;
  flame.position.z = -0.45;
  flame.name = 'flameCore';
  boostFlame.add(flame);

  const innerGeo = new THREE.ConeGeometry(0.12, 0.55, 8, 4);
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x44aaff, emissive: 0x2288ff, emissiveIntensity: 3.0,
    transparent: true, opacity: 0.9, depthWrite: false
  });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  inner.rotation.x = Math.PI / 2;
  inner.position.z = -0.48;
  inner.name = 'flameInner';
  boostFlame.add(inner);

  const glowGeo = new THREE.ConeGeometry(0.42, 1.3, 8, 4);
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 1.5,
    transparent: true, opacity: 0.35, depthWrite: false
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = Math.PI / 2;
  glow.position.z = -0.45;
  glow.name = 'flameGlow';
  boostFlame.add(glow);

  scene.add(boostFlame);
}

function deactivateBoost() {
  if (boostFlame) {
    scene.remove(boostFlame);
    disposeGroup(boostFlame);
    boostFlame = null;
  }
}

function fireLaser() {
  const now = performance.now() / 1000;
  if (now - lastFireTime < FIRE_COOLDOWN) return;
  lastFireTime = now;

  AudioSystem.playLaser();
  recoil = 1.0; // Trigger weapon recoil animation

  const fwd = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));

  const laserMat = new THREE.MeshStandardMaterial({ color: laserColorHex, emissive: laserColorHex, emissiveIntensity: 1.8, transparent: true, opacity: 0.95 });
  const laserGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.65, 6);
  const laserMesh = new THREE.Mesh(laserGeo, laserMat);
  laserMesh.rotation.x = Math.PI / 2;

  const muzzleMat = new THREE.MeshStandardMaterial({ color: laserColorHex, emissive: laserColorHex, emissiveIntensity: 2.2, transparent: true, opacity: 0.8 });
  const muzzleGeo = new THREE.SphereGeometry(0.07, 8, 6);
  const muzzleFlash = new THREE.Mesh(muzzleGeo, muzzleMat);

  const laserGroup = new THREE.Group();
  laserGroup.add(laserMesh);
  laserGroup.add(muzzleFlash);

  const bodyHeight = droidConfig.body === 'heavy' ? 0.9 : droidConfig.body === 'slim' ? 1.3 : 1.0;
  const bodyRadius = droidConfig.body === 'heavy' ? 0.65 : droidConfig.body === 'slim' ? 0.40 : 0.55;

  laserGroup.position.set(pos.x, bodyHeight * 0.55, pos.z);
  laserGroup.position.add(fwd.clone().multiplyScalar(bodyRadius + 0.3));
  laserGroup.lookAt(laserGroup.position.clone().add(fwd));
  scene.add(laserGroup);

  lasers.push({
    mesh: laserGroup,
    dir: fwd.clone(),
    spawnTime: performance.now() / 1000,
    startPos: laserGroup.position.clone()
  });

  const laserLight = new THREE.PointLight(laserColorHex, 2.5, 4);
  laserLight.position.copy(laserGroup.position);
  scene.add(laserLight);
  lasers[lasers.length - 1].light = laserLight;
}

function updateLasers() {
  const now = performance.now() / 1000;
  for (let i = lasers.length - 1; i >= 0; i--) {
    const l = lasers[i];

    if (l.mesh.position.distanceTo(l.startPos) > LASER_RANGE) {
      scene.remove(l.mesh);
      if (l.light) scene.remove(l.light);
      lasers.splice(i, 1);
      continue;
    }

    const step = LASER_SPEED * (1 / 60);
    l.mesh.position.addScaledVector(l.dir, step);
    if (l.light) l.light.position.copy(l.mesh.position);

    // Collision detection with walls and destructible obstacles
    const lx = l.mesh.position.x;
    const lz = l.mesh.position.z;
    let hitSomething = false;

    for (let oIdx = courseData.obstacles.length - 1; oIdx >= 0; oIdx--) {
      const o = courseData.obstacles[oIdx];
      const ly = l.mesh.position.y;
      
      if (o.type === 'wall') {
        const wallMinY = o.y || 0;
        const wallMaxY = wallMinY + 2.5;
        if (ly < wallMinY || ly > wallMaxY) {
          continue;
        }
      } else {
        if (Math.abs((o.y || 0) + 0.25 - ly) > 0.8) {
          continue;
        }
      }

      let collided = false;
      if (o.type === 'wall' || o.type === 'crate') {
        collided = circleRectCollision(lx, lz, 0.12, o.x, o.z, o.w, o.h);
      } else if (o.type === 'barrel') {
        collided = circleCircleCollision(lx, lz, 0.12, o.x, o.z, o.r);
      }

      if (collided) {
        hitSomething = true;

        if (o.type === 'crate' || o.type === 'barrel') {
          o.hp--;
          // Spawn hit sparks
          spawnDriftDust(scene, l.mesh.position, o.type === 'crate' ? 0xffcc33 : 0x66ff88);

          if (o.hp <= 0) {
            // Explode!
            spawnExplosion(scene, o.mesh.position.clone().add(new THREE.Vector3(0, 0.2, 0)), o.type === 'crate' ? 0xff8800 : 0x33ff66);
            AudioSystem.playExplosion();

            // Clear obstacle grid pos in MAP array to update minimap dynamically
            if (o.gridPos) {
              MAP[o.gridPos.r][o.gridPos.c] = 0;
            }

            // Remove mesh and clean resources
            courseData.courseGroup.remove(o.mesh);
            o.mesh.traverse(child => {
              if (child.isMesh) {
                child.geometry?.dispose();
                if (Array.isArray(child.material)) {
                  child.material.forEach(m => m.dispose());
                } else {
                  child.material?.dispose();
                }
              }
            });

            // Splice out of active hitboxes list
            courseData.obstacles.splice(oIdx, 1);
          }
        } else {
          // Wall hit sparks
          spawnDriftDust(scene, l.mesh.position, 0x888899);
        }
        break;
      }
    }

    if (hitSomething) {
      scene.remove(l.mesh);
      if (l.light) scene.remove(l.light);
      lasers.splice(i, 1);
      continue;
    }

    const dist = l.mesh.position.distanceTo(l.startPos);
    const fade = 1 - (dist / LASER_RANGE);
    l.mesh.children[0].material.opacity = fade;
    if (l.light) l.light.intensity = fade * 2.5;

    if (dist > LASER_RANGE * 0.8) {
      l.mesh.children[1].visible = false;
    }
  }
}

function update() {
  if (won) return;

  // 1. Direct Arrow Keys inputs (Direct vehicle relative tank control)
  let directForward = 0;
  let directTurn = 0;
  if (keys['arrowup']) directForward = 1;
  if (keys['arrowdown']) directForward = -1;
  if (keys['arrowleft']) directTurn = 1;   // Spin left
  if (keys['arrowright']) directTurn = -1; // Spin right

  // 2. Camera-relative WASD inputs
  let camForward = 0;
  let camRight = 0;
  if (keys['w']) camForward = 1;
  if (keys['s']) camForward = -1;
  if (keys['a']) camRight = -1;
  if (keys['d']) camRight = 1;

  const hasDirectInput = directForward !== 0 || directTurn !== 0;
  const hasCamInput = camForward !== 0 || camRight !== 0;

  // Animation and tail-light helper variables
  let inputForward = 0;
  let inputTurn = 0;

  const stats = droid?.userData || { speed: 3, turnSpeed: 0.03, hitboxRadius: 0.45, baseType: 'wheels' };
  const baseType = stats.baseType || 'wheels';

  // Recoil decay for weapon recoil
  if (recoil > 0) {
    recoil -= 0.08;
    if (recoil < 0) recoil = 0;
  }
  if (droid?.userData?.turretBarrel) {
    const bodyRadius = droidConfig.body === 'heavy' ? 0.65 : droidConfig.body === 'slim' ? 0.40 : 0.55;
    droid.userData.turretBarrel.position.z = bodyRadius * 0.35 - recoil * 0.2;
  }

  // Directions based on current heading
  let dirX = Math.sin(angle);
  let dirZ = Math.cos(angle);
  let rightX = Math.cos(angle);
  let rightZ = -Math.sin(angle);

  // Project global velocity to local
  let vForward = vx * dirX + vz * dirZ;
  let vRight = vx * rightX + vz * rightZ;

  // Physics profiles based on base
  let accelRate = 0.0006;
  let maxSpeed = stats.speed * 0.036;
  let dragForward = 0.06;
  let dragRight = 0.85; // high traction defaults
  let steerPower = stats.turnSpeed;

  if (baseType === 'wheels') {
    accelRate = 0.0010;
    maxSpeed = stats.speed * 0.046;
    dragForward = 0.05;
    dragRight = 0.82; // slight sliding
    steerPower = stats.turnSpeed * 2.0; // fast wheels steering
  } else if (baseType === 'tracks') {
    accelRate = 0.0008;
    maxSpeed = stats.speed * 0.034;
    dragForward = 0.07;
    dragRight = 0.98; // absolute traction
    steerPower = stats.turnSpeed * 2.5;
  } else if (baseType === 'hovers') {
    accelRate = 0.0007;
    maxSpeed = stats.speed * 0.042;
    dragForward = 0.04;
    dragRight = 0.07; // high slide
    steerPower = stats.turnSpeed * 1.8;
  }

  if (boostActive) {
    maxSpeed *= BOOST_SPEED_MULT;
    if (boostPush > 0) {
      vForward += maxSpeed * 1.5 * boostPush;
      boostPush = 0;
    }
  }

  if (hasDirectInput) {
    // Wheels turn less when stationary
    let actualSteerPower = steerPower;
    if (baseType === 'wheels') {
      const speedRatio = Math.min(Math.abs(vForward) / (maxSpeed * 0.4), 1.0);
      actualSteerPower = steerPower * (0.45 + 0.55 * speedRatio);
    }
    
    // Direct spin/turn
    angle += directTurn * actualSteerPower;

    // Direct forward/back acceleration
    if (directForward > 0) {
      vForward += accelRate * stats.speed;
    } else if (directForward < 0) {
      vForward -= accelRate * stats.speed * 0.8;
    }

    inputForward = directForward;
    inputTurn = directTurn;
  } else if (hasCamInput) {
    // Project WASD into camera-relative target angle
    const camAngle = Math.atan2(
      camera.position.x - pos.x,
      camera.position.z - pos.z
    );

    const moveAngle = camAngle + Math.atan2(camRight, camForward);
    const targetAngle = -moveAngle + Math.PI;

    let angleDiff = targetAngle - angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Wheels turn only when moving
    let actualSteerPower = steerPower;
    if (baseType === 'wheels') {
      const speedRatio = Math.min(Math.abs(vForward) / (maxSpeed * 0.4), 1.0);
      actualSteerPower = steerPower * (0.45 + 0.55 * speedRatio);
    }

    // Turn robot towards target direction
    angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), actualSteerPower);

    // Apply forward engine acceleration
    vForward += accelRate * stats.speed;

    inputForward = 1; // moving forward relative to current heading
    inputTurn = Math.sign(angleDiff);
  }

  // Apply drag
  vForward *= (1 - dragForward);
  vRight *= (1 - dragRight);

  // Speed caps
  if (vForward > maxSpeed) vForward = maxSpeed;
  if (vForward < -maxSpeed * 0.6) vForward = -maxSpeed * 0.6;

  // Recompute local directions after steering
  dirX = Math.sin(angle);
  dirZ = Math.cos(angle);
  rightX = Math.cos(angle);
  rightZ = -Math.sin(angle);

  // Reconstruct global velocities
  vx = vForward * dirX + vRight * rightX;
  vz = vForward * dirZ + vRight * rightZ;

  const r = stats.hitboxRadius;
  let newX = pos.x + vx;
  let newZ = pos.z + vz;

  // Slidable collision response
  if (!collides(newX, newZ, r)) {
    pos.x = newX;
    pos.z = newZ;
  } else {
    if (!collides(newX, pos.z, r)) {
      pos.x = newX;
      vz *= 0.15;
    } else if (!collides(pos.x, newZ, r)) {
      pos.z = newZ;
      vx *= 0.15;
    } else {
      vx = 0;
      vz = 0;
      vForward = 0;
      vRight = 0;
    }
  }

  // Engine audio updates
  const audioSpeedRatio = maxSpeed > 0 ? Math.abs(vForward) / maxSpeed : 0;
  AudioSystem.updateEngine(audioSpeedRatio);

  // Taillights activation
  if (taillight) {
    const braking = (inputForward < 0) || (vForward > 0.01 && inputForward < 0);
    taillight.intensity = braking ? 2.5 : (vForward > 0.01 ? 0.3 : 0.8);
    const tailPos = new THREE.Vector3(pos.x, 0.4 + droidY, pos.z).addScaledVector(new THREE.Vector3(dirX, 0, dirZ), -r - 0.15);
    taillight.position.copy(tailPos);
  }

  // Headlights alignment
  if (headlight) {
    const headHeight = droidConfig.body === 'heavy' ? 0.95 : droidConfig.body === 'slim' ? 1.35 : 1.05;
    const fwdVec = new THREE.Vector3(dirX, 0, dirZ);
    headlight.position.set(pos.x, headHeight + droidY, pos.z).addScaledVector(fwdVec, r + 0.1);
    headlight.target.position.copy(headlight.position).addScaledVector(fwdVec, 6);
    headlight.target.updateMatrixWorld();
  }

  // Trailing animations & particles
  const isMoving = Math.abs(vForward) > 0.005 || Math.abs(vRight) > 0.005;
  const time = performance.now() / 1000;

  if (droid) {
    // Wheels rolling
    if (baseType === 'wheels' && droid.userData.wheels) {
      const rollAmount = vForward * 6.0;
      for (const w of droid.userData.wheels) {
        w.rotation.y += rollAmount;
      }
      
      const drifting = Math.abs(vRight) > maxSpeed * 0.18;
      if (drifting && Math.random() < 0.35) {
        spawnDriftDust(scene, new THREE.Vector3(pos.x, 0.02, pos.z), 0x333333); // black skid smoke
      } else if (isMoving && Math.random() < 0.08) {
        spawnDriftDust(scene, new THREE.Vector3(pos.x, 0.02, pos.z), 0x8888aa); // dust
      }
    }

    // Tracks rolling
    if (baseType === 'tracks' && droid.userData.rollers) {
      const rollAmount = vForward * 5.0 + (inputTurn * steerPower * 3.0);
      for (const roller of droid.userData.rollers) {
        roller.rotation.y += rollAmount;
      }
      if (isMoving && Math.random() < 0.12) {
        spawnDriftDust(scene, new THREE.Vector3(pos.x, 0.02, pos.z), 0x7a7a8f);
      }
    }

    // Hover glow pulse
    if (baseType === 'hovers') {
      const intensity = Math.sin(time * 12) * 0.15 + 0.85;
      if (droid.userData.hoverGlows) {
        for (const glow of droid.userData.hoverGlows) {
          glow.material.emissiveIntensity = intensity;
        }
      }
      if (Math.random() < 0.18) {
        spawnDriftDust(scene, new THREE.Vector3(pos.x + (Math.random()-0.5)*0.6, 0.05, pos.z + (Math.random()-0.5)*0.6), 0x44aaff); // blue sparks
      }
    }

    // Radar accessory rotate
    if (droid.userData.radarHead) {
      droid.userData.radarHead.rotation.y = time * 2.5;
    }

    // Jetpack flame scale
    if (droid.userData.jetpackFlames) {
      const flameScale = inputForward > 0 ? (1.3 + Math.sin(time * 30) * 0.2) : (isMoving ? (0.8 + Math.sin(time * 20) * 0.1) : (0.2 + Math.sin(time * 10) * 0.05));
      for (const flame of droid.userData.jetpackFlames) {
        flame.scale.set(flameScale, flameScale, flameScale);
        flame.material.emissiveIntensity = 0.5 + flameScale * 0.5;
      }
    }

    // Core pulsing
    if (droid.userData.thrusterCore) {
      droid.userData.thrusterCore.material.emissiveIntensity = 1.0 + Math.sin(time * 8) * 0.4;
    }
  }

  if (droid) {
    droid.rotation.y = angle;
    droid.position.x = pos.x;
    droid.position.z = pos.z;
  }

  if (groundIndicator) {
    groundIndicator.position.x = pos.x;
    groundIndicator.position.z = pos.z;
    groundIndicator.rotation.y = angle;
  }

  const floorY = getFloorHeight(pos.x, pos.z);
  const hoverTarget = hovering ? 1.8 : 0;
  const bobbing = baseType === 'hovers' ? (Math.sin(time * 4) * 0.08 + 0.15) : 0;
  const targetY = floorY + hoverTarget + bobbing;
  droidY += (targetY - droidY) * 0.12;
  if (droid) {
    droid.position.y = 0.01 + droidY;
  }

  // Bound constraints
  const margin = 0.3;
  pos.x = Math.max(-W / 2 + margin, Math.min(W / 2 - margin, pos.x));
  pos.z = Math.max(-H / 2 + margin, Math.min(H / 2 - margin, pos.z));

  // Boost timers
  const dt = 1 / 60;
  if (boostActive) {
    boostTimer -= dt;
    if (boostTimer <= 0) {
      boostActive = false;
      boostTimer = 0;
      deactivateBoost();
    }
  }
  if (boostCooldownTimer > 0) {
    boostCooldownTimer -= dt;
    if (boostCooldownTimer < 0) boostCooldownTimer = 0;
  }

  const goal = courseData.goalPos;
  const gdx = pos.x - goal.x;
  const gdz = pos.z - goal.z;
  const gdy = (droidY || 0) - (goal.y || 0);
  if (gdx * gdx + gdz * gdz < 0.8 && Math.abs(gdy) < 0.5) {
    won = true;
    AudioSystem.playGoal();
    AudioSystem.stopEngine();
    winOverlay.classList.remove('hidden');
    document.getElementById('win-back-btn').focus();
  }
}

function collides(x, z, r) {
  const y = getFloorHeight(x, z);
  const currentY = getFloorHeight(pos.x, pos.z);
  if (y - currentY > 0.4) {
    const currentC = Math.floor((pos.x + W / 2) / TILE);
    const currentR = Math.floor((pos.z + H / 2) / TILE);
    const targetC = Math.floor((x + W / 2) / TILE);
    const targetR = Math.floor((z + H / 2) / TILE);
    const currentCell = MAP[currentR]?.[currentC];
    const targetCell = MAP[targetR]?.[targetC];
    const isRamp = (cell) => ['RU', 'RD', 'RL', 'RR'].includes(cell);
    if (!isRamp(currentCell) && !isRamp(targetCell)) {
      return true; // Blocked: can only go up paths using the ramp!
    }
  }

  for (const o of courseData.obstacles) {
    if (o.type === 'wall') {
      const wallMinY = o.y || 0;
      const wallMaxY = wallMinY + 2.5;
      const robotMinY = y;
      const robotMaxY = y + 1.2;
      if (robotMaxY <= wallMinY || robotMinY >= wallMaxY) {
        continue;
      }
    } else {
      if (Math.abs((o.y || 0) - y) > 0.5) {
        continue;
      }
    }

    if (o.type === 'wall' || o.type === 'crate') {
      if (circleRectCollision(x, z, r, o.x, o.z, o.w, o.h)) return true;
    } else if (o.type === 'barrel') {
      if (circleCircleCollision(x, z, r, o.x, o.z, o.r)) return true;
    }
  }
  return false;
}

function render() {
  const time = performance.now() / 1000;
  const elapsed = time - startTime;

  const behind = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle));
  const camDist = 6;
  const camHeight = 4;
  const targetPos = new THREE.Vector3(
    pos.x + behind.x * camDist,
    camHeight + (droidY || 0),
    pos.z + behind.z * camDist
  );

  camera.position.lerp(targetPos, 0.12);
  const lookTarget = new THREE.Vector3(pos.x, 0.5 + (droidY || 0) * 0.5, pos.z);
  camera.lookAt(lookTarget);

  if (starfield) starfield.update(elapsed);
  if (dust) dust.update();
  updateBeacon(elapsed);

  // Occlusion wall transparency fading
  if (droid && camera && courseData && courseData.courseGroup) {
    const camToDroid = new THREE.Vector3().subVectors(droid.position, camera.position);
    const droidDist = camToDroid.length();
    const dir = camToDroid.clone().normalize();

    courseData.courseGroup.children.forEach(child => {
      if (child.name === "wallGroup") {
        const wallPos = child.position.clone();
        const yOffset = child.children[0]?.position.y || 1.25;
        wallPos.y += yOffset;
        
        const camToWall = new THREE.Vector3().subVectors(wallPos, camera.position);
        const wallDist = camToWall.length();

        let targetOpacity = 1.0;

        if (wallDist < droidDist) {
          const dot = camToWall.dot(dir);
          if (dot > 0) {
            const projection = dir.clone().multiplyScalar(dot);
            const perpDist = new THREE.Vector3().subVectors(camToWall, projection).length();

            if (perpDist < 1.3) {
              targetOpacity = 0.25;
            }
          }
        }

        child.children.forEach(mesh => {
          if (mesh.material) {
            mesh.material.transparent = true;
            mesh.material.opacity = targetOpacity;
          }
        });
      }
    });
  }

  if (boostFlame && droid) {
    const behind = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle));
    boostFlame.position.copy(droid.position).addScaledVector(behind, 0.5);
    boostFlame.position.y += 0.35;
    boostFlame.rotation.y = angle;
    boostFlame.visible = boostActive;
    if (boostActive) {
      const pulse = 1.0 + Math.sin(time * 28) * 0.2;
      boostFlame.children.forEach(child => {
        child.scale.set(pulse, pulse, pulse);
        if (child.material) child.material.emissiveIntensity = (child.name === 'flameInner' ? 2.5 : 2.0) + Math.sin(time * 32) * 0.6;
      });
    }
  }

  renderer.render(scene, camera);

  drawMinimap();

  const now = performance.now() / 1000;
  const sinceLastFire = now - lastFireTime;
  const ready = sinceLastFire >= FIRE_COOLDOWN;
  cooldownFill.style.width = ready ? '100%' : ((sinceLastFire / FIRE_COOLDOWN) * 100) + '%';
  const lc = '#' + laserColorHex.toString(16).padStart(6, '0');
  cooldownFill.style.background = ready ? '#44ffaa' : lc;

  if (boostActive) {
    boostFill.style.width = ((boostTimer / BOOST_DURATION) * 100) + '%';
    boostFill.style.background = 'linear-gradient(90deg, #44aaff, #ff6600)';
  } else if (boostCooldownTimer > 0) {
    boostFill.style.width = ((1 - boostCooldownTimer / BOOST_COOLDOWN) * 100) + '%';
    boostFill.style.background = 'linear-gradient(90deg, #555, #666)';
  } else {
    boostFill.style.width = '100%';
    boostFill.style.background = 'linear-gradient(90deg, #00ff88, #00cc66)';
  }
}

function drawMinimap() {
  const ctx = minimapCtx;
  const cw = minimapCanvas.width;
  const ch = minimapCanvas.height;
  const scaleX = cw / COLS;
  const scaleY = ch / ROWS;

  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, cw, ch);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = MAP[r][c];
      const x = c * scaleX;
      const y = r * scaleY;
      if (v === 1) {
        ctx.fillStyle = '#3a3a5a';
        ctx.fillRect(x, y, scaleX, scaleY);
      } else if (v === 2) {
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(x + 1, y + 1, scaleX - 2, scaleY - 2);
      } else if (v === 3) {
        ctx.fillStyle = '#556B2F';
        ctx.beginPath();
        ctx.arc(x + scaleX / 2, y + scaleY / 2, Math.min(scaleX, scaleY) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else if (v === 9) {
        ctx.fillStyle = '#e94560';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('\u2605', x + scaleX / 2, y + scaleY / 2);
      } else if (v === 'S') {
        ctx.fillStyle = 'rgba(233,69,96,0.2)';
        ctx.beginPath();
        ctx.arc(x + scaleX / 2, y + scaleY / 2, Math.min(scaleX, scaleY) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const mx = ((pos.x + W / 2) / W) * cw;
  const mz = ((pos.z + H / 2) / H) * ch;

  ctx.fillStyle = '#44ddff';
  ctx.beginPath();
  ctx.arc(mx, mz, 3, 0, Math.PI * 2);
  ctx.fill();

  const dirLen = 7;
  const dirX = mx + Math.sin(angle) * dirLen;
  const dirY = mz + Math.cos(angle) * dirLen;
  ctx.strokeStyle = '#44ffaa';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mx, mz);
  ctx.lineTo(dirX, dirY);
  ctx.stroke();

  const headLen = 3;
  const headAngle = 0.5;
  ctx.fillStyle = '#44ffaa';
  ctx.beginPath();
  ctx.moveTo(dirX, dirY);
  ctx.lineTo(
    dirX - Math.sin(angle - headAngle) * headLen,
    dirY - Math.cos(angle - headAngle) * headLen
  );
  ctx.lineTo(
    dirX - Math.sin(angle + headAngle) * headLen,
    dirY - Math.cos(angle + headAngle) * headLen
  );
  ctx.closePath();
  ctx.fill();
}

export function init() {
  document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') {
      e.preventDefault();
      if (running && !won) fireLaser();
    }
    if (e.key.toLowerCase() === 'h') {
      hovering = !hovering;
    }
    if (e.key.toLowerCase() === 'enter') {
      if (running && !won && boostCooldownTimer <= 0 && !boostActive) {
        e.preventDefault();
        activateBoost();
      }
    }
    if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key)) e.preventDefault();
  });
  document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  // Mobile/Touch Overlay Buttons
  const touchSetup = (btnId, keyName) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      keys[keyName] = true;
    });
    const release = e => {
      e.preventDefault();
      keys[keyName] = false;
    };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerout', release);
    btn.addEventListener('pointerleave', release);
  };

  touchSetup('btn-up', 'arrowup');
  touchSetup('btn-down', 'arrowdown');
  touchSetup('btn-left', 'arrowleft');
  touchSetup('btn-right', 'arrowright');

  const shootBtn = document.getElementById('btn-shoot');
  shootBtn?.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (running && !won) fireLaser();
  });

  const hoverBtn = document.getElementById('btn-hover');
  hoverBtn?.addEventListener('pointerdown', e => {
    e.preventDefault();
    hovering = !hovering;
  });

  window.addEventListener('resize', resizeRenderer);
}
