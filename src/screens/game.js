import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3, Color3, Color4 } from '@babylonjs/core/Maths/math';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { SpotLight } from '@babylonjs/core/Lights/spotLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { buildDroid } from '../droid/robot.js';
import { buildCourse, updateBeacon, loadTextures } from '../world/course.js';
import { circleRectCollision, circleCircleCollision, getFloorHeight, getStartPos, getGoalPos, MAP, COLS, ROWS, TILE, W, H } from '../world/maps.js';
import { createStarfield, createDustParticles, spawnExplosion, spawnDriftDust, updateDynamicParticles, disposeEnvironment } from '../effects/particles.js';
import { AudioSystem } from '../audio/audio.js';
import { drawMinimap } from '../ui/minimap.js';
import { isMobile, setupTouchControls } from '../ui/touch.js';

const container = document.getElementById('game-canvas-container');
const winOverlay = document.getElementById('win-overlay');
const cooldownFill = document.getElementById('cooldown-fill');
const boostFill = document.getElementById('boost-fill');

let engine, scene, camera;
let starfield = null;
let dust = null;
let courseData = null;
let droid = null;
let droidConfig = null;
let pos = { x: 0, z: 0 };
let angle = 0;
let running = false;
let won = false;
let startTime = 0;
let droidY = 0;
let hovering = false;
let laserColorHex = 0xff2244;

let vx = 0, vz = 0, recoil = 0;
let boostActive = false, boostTimer = 0, boostCooldownTimer = 0;
const BOOST_DURATION = 2.0, BOOST_COOLDOWN = 7.0, BOOST_SPEED_MULT = 3.0;
let boostPush = 0;
let boostFlame = null;

let headlight = null, taillight = null;
let groundIndicator = null;

const keys = {};
const lasers = [];
let lastFireTime = 0;
const FIRE_COOLDOWN = 0.35;
const LASER_SPEED = 28;
const LASER_RANGE = 42;

let shadowGen = null;

function hexToColor3(hex) {
  if (typeof hex === 'number') return new Color3(((hex >> 16) & 0xff) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255);
  const str = hex.startsWith('#') ? hex : '#' + hex;
  return new Color3(parseInt(str.slice(1, 3), 16) / 255, parseInt(str.slice(3, 5), 16) / 255, parseInt(str.slice(5, 7), 16) / 255);
}

function initScene() {
  if (engine) return;
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  engine = new Engine(canvas, true, { adaptToDeviceRatio: !isMobile() });
  scene = new Scene(engine);
  scene.clearColor = new Color4(0.024, 0.024, 0.055, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.025;
  scene.fogColor = new Color3(0.024, 0.024, 0.055);

  camera = new FreeCamera('cam', new Vector3(0, 8, -10), scene);
  camera.minZ = 0.1;
  camera.maxZ = 80;
  camera.fov = 50 * Math.PI / 180;

  const hemiLight = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.95;
  hemiLight.diffuse = new Color3(0.82, 0.87, 1);
  hemiLight.groundColor = new Color3(0.24, 0.21, 0.17);

  const sunLight = new DirectionalLight('sun', new Vector3(-0.4, -0.8, -0.3), scene);
  sunLight.position = new Vector3(15, 25, 10);
  sunLight.intensity = 2.5;
  sunLight.diffuse = new Color3(1, 0.99, 0.96);
  sunLight.shadowEnabled = !isMobile();
  shadowGen = new ShadowGenerator(isMobile() ? 512 : 2048, sunLight);
  shadowGen.usePercentageCloserFiltering = true;
  shadowGen.bias = -0.0005;

  const fillLight = new DirectionalLight('fill', new Vector3(0.3, -0.6, 0.3), scene);
  fillLight.intensity = 0.85;
  fillLight.diffuse = new Color3(0.67, 0.8, 1);

  const backLight = new DirectionalLight('back', new Vector3(0, -0.5, 0.5), scene);
  backLight.intensity = 0.6;
  backLight.diffuse = new Color3(1, 0.92, 0.82);

  window.addEventListener('resize', () => { if (engine) engine.resize(); });
}

function setupEnvironment() {
  if (!starfield) starfield = createStarfield(scene, 2000, 80);
  if (!dust) dust = createDustParticles(scene, 150, 40);
}

function setupCourse() {
  if (courseData) {
    courseData.courseGroup.dispose();
  }
  courseData = buildCourse(scene, shadowGen);
}

function placeDroid() {
  if (droid) {
    droid.dispose();
    droid = null;
  }
  droid = buildDroid(droidConfig, scene);
  shadowGen.addShadowCastingMesh(droid);

  const start = courseData.startPos;
  pos.x = start.x;
  pos.z = start.z;
  angle = 0;
  vx = 0; vz = 0; recoil = 0;

  droid.position.set(pos.x, 0.01, pos.z);
  droid.rotation.y = 0;

  // Headlight
  if (headlight) headlight.dispose();
  const headHeight = droidConfig.body === 'heavy' ? 0.95 : droidConfig.body === 'slim' ? 1.35 : 1.05;
  headlight = new SpotLight('headlight', new Vector3(pos.x, headHeight, pos.z), new Vector3(0, 0, 1), Math.PI / 4, 0.5, scene);
  headlight.diffuse = new Color3(1, 1, 1);
  headlight.intensity = 8;
  headlight.range = 20;
  if (!isMobile()) {
    headlight.shadowEnabled = true;
  } else {
    headlight.shadowEnabled = false;
  }

  // Taillight
  if (taillight) taillight.dispose();
  taillight = new PointLight('taillight', new Vector3(pos.x, 0.4, pos.z - 0.6), scene);
  taillight.diffuse = new Color3(1, 0, 0);
  taillight.intensity = 0.5;
  taillight.range = 4;

  // Ground indicator
  if (!groundIndicator) {
    groundIndicator = new TransformNode('groundIndicator', scene);
    const giMat = new StandardMaterial('giMat', scene);
    giMat.emissiveColor = new Color3(0.27, 1, 0.67);
    giMat.disableLighting = true;
    giMat.alpha = 0.5;
    const ring = MeshBuilder.CreateTorus('giRing', { diameter: 1.2, thickness: 0.025, tessellation: 24 }, scene);
    ring.material = giMat;
    ring.rotation.x = Math.PI / 2;
    ring.parent = groundIndicator;
    ring.isPickable = false;
    const shaft = MeshBuilder.CreateBox('giShaft', { width: 0.06, height: 0.015, depth: 0.5 }, scene);
    shaft.material = giMat;
    shaft.position.set(0, 0, 0.85);
    shaft.parent = groundIndicator;
    shaft.isPickable = false;
    const head = MeshBuilder.CreateCylinder('giHead', { diameterTop: 0, diameterBottom: 0.2, height: 0.2, tessellation: 5 }, scene);
    head.material = giMat;
    head.rotation.x = -Math.PI / 2;
    head.position.set(0, 0, 1.15);
    head.parent = groundIndicator;
    head.isPickable = false;
  }
  groundIndicator.position.set(pos.x, 0.03, pos.z);
  groundIndicator.rotation.y = angle;
}

export async function start(config) {
  initScene();

  droidConfig = config;
  won = false;
  droidY = 0;
  hovering = false;
  updateHoverUI();
  boostActive = false;
  boostTimer = 0;
  boostCooldownTimer = 0;
  boostPush = 0;
  if (boostFlame) { boostFlame.dispose(); boostFlame = null; }

  try {
    const col = hexToColor3(config.colors.laser || '#ff2244');
    laserColorHex = Math.round(col.r * 255) * 65536 + Math.round(col.g * 255) * 256 + Math.round(col.b * 255);
  } catch (e) {
    laserColorHex = 0xff2244;
  }

  winOverlay.classList.add('hidden');
  engine.resize();

  await loadTextures(scene);

  setupEnvironment();
  setupCourse();
  placeDroid();

  startTime = performance.now() / 1000;
  AudioSystem.startEngine();

  setupTouchControls(keys);

  if (!running) {
    running = true;
    engine.runRenderLoop(gameLoop);
  }
}

export function stop() {
  running = false;
  AudioSystem.stopEngine();
  if (engine) engine.stopRenderLoop();
}

export function cleanup() {
  stop();
  for (const l of lasers) {
    if (l.mesh) l.mesh.dispose();
    if (l.light) l.light.dispose();
  }
  lasers.length = 0;
  if (droid) { droid.dispose(); droid = null; }
  if (courseData) { courseData.courseGroup.dispose(); courseData = null; }
  if (groundIndicator) { groundIndicator.dispose(); groundIndicator = null; }
  if (headlight) { headlight.dispose(); headlight = null; }
  if (taillight) { taillight.dispose(); taillight = null; }
  if (boostFlame) { boostFlame.dispose(); boostFlame = null; }
  disposeEnvironment();
  boostActive = false;
  boostTimer = 0;
  boostCooldownTimer = 0;
  boostPush = 0;
  droidY = 0;
  hovering = false;
  updateHoverUI();
}

function gameLoop() {
  if (!running) return;
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
  if (boostFlame) { boostFlame.dispose(); }
  boostFlame = new TransformNode('boostFlame', scene);

  const flameMat = new StandardMaterial('flameMat', scene);
  flameMat.emissiveColor = new Color3(1, 0.4, 0);
  flameMat.disableLighting = true;
  flameMat.alpha = 0.9;

  const flame = MeshBuilder.CreateCylinder('flame', { diameterTop: 0, diameterBottom: 0.56, height: 0.9, tessellation: 8 }, scene);
  flame.material = flameMat;
  flame.rotation.x = Math.PI / 2;
  flame.position.z = -0.45;
  flame.parent = boostFlame;
  flame.isPickable = false;

  const innerMat = new StandardMaterial('innerMat', scene);
  innerMat.emissiveColor = new Color3(0.27, 0.67, 1);
  innerMat.disableLighting = true;
  innerMat.alpha = 0.9;
  const inner = MeshBuilder.CreateCylinder('inner', { diameterTop: 0, diameterBottom: 0.24, height: 0.55, tessellation: 8 }, scene);
  inner.material = innerMat;
  inner.rotation.x = Math.PI / 2;
  inner.position.z = -0.48;
  inner.parent = boostFlame;
  inner.isPickable = false;

  const glowMat = new StandardMaterial('glowMat', scene);
  glowMat.emissiveColor = new Color3(1, 0.67, 0);
  glowMat.disableLighting = true;
  glowMat.alpha = 0.35;
  const glow = MeshBuilder.CreateCylinder('glow', { diameterTop: 0, diameterBottom: 0.84, height: 1.3, tessellation: 8 }, scene);
  glow.material = glowMat;
  glow.rotation.x = Math.PI / 2;
  glow.position.z = -0.45;
  glow.parent = boostFlame;
  glow.isPickable = false;
}

function deactivateBoost() {
  if (boostFlame) { boostFlame.dispose(); boostFlame = null; }
}

function fireLaser() {
  const now = performance.now() / 1000;
  if (now - lastFireTime < FIRE_COOLDOWN) return;
  lastFireTime = now;

  AudioSystem.playLaser();
  recoil = 1.0;

  const fwd = new Vector3(Math.sin(angle), 0, Math.cos(angle));
  const laserColor = hexToColor3(laserColorHex);

  const laserGroup = new TransformNode('laser', scene);
  const laserMat = new StandardMaterial('laserMat', scene);
  laserMat.emissiveColor = laserColor;
  laserMat.disableLighting = true;
  laserMat.alpha = 0.95;
  const laserMesh = MeshBuilder.CreateCylinder('laser', { diameter: 0.05, height: 0.65, tessellation: 6 }, scene);
  laserMesh.material = laserMat;
  laserMesh.rotation.x = Math.PI / 2;
  laserMesh.parent = laserGroup;
  laserMesh.isPickable = false;

  const muzzleMat = new StandardMaterial('muzzleMat', scene);
  muzzleMat.emissiveColor = laserColor.scale(2.2);
  muzzleMat.disableLighting = true;
  muzzleMat.alpha = 0.8;
  const muzzle = MeshBuilder.CreateSphere('muzzle', { diameter: 0.14, segments: 8 }, scene);
  muzzle.material = muzzleMat;
  muzzle.parent = laserGroup;
  muzzle.isPickable = false;

  const bodyHeight = droidConfig.body === 'heavy' ? 0.9 : droidConfig.body === 'slim' ? 1.3 : 1.0;
  const bodyRadius = droidConfig.body === 'heavy' ? 0.65 : droidConfig.body === 'slim' ? 0.40 : 0.55;

  laserGroup.position.set(pos.x, bodyHeight * 0.55, pos.z);
  laserGroup.position.addInPlace(fwd.scale(bodyRadius + 0.3));

  const laserLight = new PointLight('laserLight', laserGroup.position.clone(), scene);
  laserLight.diffuse = laserColor;
  laserLight.intensity = 2.5;
  laserLight.range = 4;

  lasers.push({
    mesh: laserGroup,
    light: laserLight,
    dir: fwd.clone(),
    spawnTime: performance.now() / 1000,
    startPos: laserGroup.position.clone(),
  });
}

function updateLasers() {
  for (let i = lasers.length - 1; i >= 0; i--) {
    const l = lasers[i];
    const distFromStart = Vector3.Distance(l.mesh.position, l.startPos);

    if (distFromStart > LASER_RANGE) {
      l.mesh.dispose();
      if (l.light) l.light.dispose();
      lasers.splice(i, 1);
      continue;
    }

    const step = LASER_SPEED * (1 / 60);
    l.mesh.position.addInPlace(l.dir.scale(step));
    if (l.light) l.light.position.copyFrom(l.mesh.position);

    const lx = l.mesh.position.x;
    const lz = l.mesh.position.z;
    let hitSomething = false;

    for (let oIdx = courseData.obstacles.length - 1; oIdx >= 0; oIdx--) {
      const o = courseData.obstacles[oIdx];
      const ly = l.mesh.position.y;

      if (o.type === 'wall') {
        const wallMinY = o.y || 0;
        const wallMaxY = wallMinY + 2.5;
        if (ly < wallMinY || ly > wallMaxY) continue;
      } else {
        if (Math.abs((o.y || 0) + 0.25 - ly) > 0.8) continue;
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
          spawnDriftDust(scene, l.mesh.position, o.type === 'crate' ? 0xffcc33 : 0x66ff88);
          if (o.hp <= 0) {
            const explPos = o.mesh.position.clone();
            explPos.y += 0.2;
            spawnExplosion(scene, explPos, o.type === 'crate' ? 0xff8800 : 0x33ff66);
            AudioSystem.playExplosion();
            if (o.gridPos) MAP[o.gridPos.r][o.gridPos.c] = 0;
            o.mesh.dispose();
            courseData.obstacles.splice(oIdx, 1);
          }
        } else {
          spawnDriftDust(scene, l.mesh.position, 0x888899);
        }
        break;
      }
    }

    if (hitSomething) {
      l.mesh.dispose();
      if (l.light) l.light.dispose();
      lasers.splice(i, 1);
      continue;
    }

    const fade = 1 - (distFromStart / LASER_RANGE);
    l.mesh.children[0].material.alpha = fade;
    if (l.light) l.light.intensity = fade * 2.5;
    if (distFromStart > LASER_RANGE * 0.8) l.mesh.children[1].isVisible = false;
  }
}

function update() {
  if (won) return;

  let directForward = 0, directTurn = 0;
  if (keys['arrowup']) directForward = 1;
  if (keys['arrowdown']) directForward = -1;
  if (keys['arrowleft']) directTurn = 1;
  if (keys['arrowright']) directTurn = -1;

  let camForward = 0, camRight = 0;
  if (keys['w']) camForward = 1;
  if (keys['s']) camForward = -1;
  if (keys['a']) camRight = -1;
  if (keys['d']) camRight = 1;

  const hasDirectInput = directForward !== 0 || directTurn !== 0;
  const hasCamInput = camForward !== 0 || camRight !== 0;

  let inputForward = 0, inputTurn = 0;
  const stats = droid?.metadata || { speed: 3, turnSpeed: 0.03, hitboxRadius: 0.45, baseType: 'wheels' };
  const baseType = stats.baseType || 'wheels';

  if (recoil > 0) { recoil -= 0.08; if (recoil < 0) recoil = 0; }
  if (droid?.metadata?.turretBarrel) {
    const bodyRadius = droidConfig.body === 'heavy' ? 0.65 : droidConfig.body === 'slim' ? 0.40 : 0.55;
    droid.metadata.turretBarrel.position.z = bodyRadius * 0.35 - recoil * 0.2;
  }

  let dirX = Math.sin(angle), dirZ = Math.cos(angle);
  let rightX = Math.cos(angle), rightZ = -Math.sin(angle);
  let vForward = vx * dirX + vz * dirZ;
  let vRight = vx * rightX + vz * rightZ;

  let accelRate = 0.0006;
  let maxSpeed = stats.speed * 0.036;
  let dragForward = 0.06, dragRight = 0.85;
  let steerPower = stats.turnSpeed;

  if (baseType === 'wheels') {
    accelRate = 0.0010; maxSpeed = stats.speed * 0.046;
    dragForward = 0.05; dragRight = 0.82; steerPower = stats.turnSpeed * 2.0;
  } else if (baseType === 'tracks') {
    accelRate = 0.0008; maxSpeed = stats.speed * 0.034;
    dragForward = 0.07; dragRight = 0.98; steerPower = stats.turnSpeed * 2.5;
  } else if (baseType === 'hovers') {
    accelRate = 0.0007; maxSpeed = stats.speed * 0.042;
    dragForward = 0.04; dragRight = 0.07; steerPower = stats.turnSpeed * 1.8;
  }

  if (boostActive) {
    maxSpeed *= BOOST_SPEED_MULT;
    vForward += accelRate * stats.speed * 2.5;
    if (boostPush > 0) { vForward += maxSpeed * 1.5 * boostPush; boostPush = 0; }
  }

  if (hasDirectInput) {
    let actualSteerPower = steerPower;
    if (baseType === 'wheels') {
      const speedRatio = Math.min(Math.abs(vForward) / (maxSpeed * 0.4), 1.0);
      actualSteerPower = steerPower * (0.45 + 0.55 * speedRatio);
    }
    angle += directTurn * actualSteerPower;
    if (directForward > 0) vForward += accelRate * stats.speed;
    else if (directForward < 0) vForward -= accelRate * stats.speed * 0.8;
    inputForward = directForward;
    inputTurn = directTurn;
  } else if (hasCamInput) {
    const camAngle = Math.atan2(camera.position.x - pos.x, camera.position.z - pos.z);
    const moveAngle = camAngle + Math.atan2(camRight, camForward);
    const targetAngle = -moveAngle + Math.PI;
    let angleDiff = targetAngle - angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    let actualSteerPower = steerPower;
    if (baseType === 'wheels') {
      const speedRatio = Math.min(Math.abs(vForward) / (maxSpeed * 0.4), 1.0);
      actualSteerPower = steerPower * (0.45 + 0.55 * speedRatio);
    }
    angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), actualSteerPower);
    vForward += accelRate * stats.speed;
    inputForward = 1;
    inputTurn = Math.sign(angleDiff);
  }

  vForward *= (1 - dragForward);
  vRight *= (1 - dragRight);
  if (vForward > maxSpeed) vForward = maxSpeed;
  if (vForward < -maxSpeed * 0.6) vForward = -maxSpeed * 0.6;

  dirX = Math.sin(angle); dirZ = Math.cos(angle);
  rightX = Math.cos(angle); rightZ = -Math.sin(angle);
  vx = vForward * dirX + vRight * rightX;
  vz = vForward * dirZ + vRight * rightZ;

  const r = stats.hitboxRadius;
  let newX = pos.x + vx, newZ = pos.z + vz;

  if (!collides(newX, newZ, r)) {
    pos.x = newX; pos.z = newZ;
  } else {
    if (!collides(newX, pos.z, r)) { pos.x = newX; vz *= 0.15; }
    else if (!collides(pos.x, newZ, r)) { pos.z = newZ; vx *= 0.15; }
    else { vx = 0; vz = 0; vForward = 0; vRight = 0; }
  }

  const audioSpeedRatio = maxSpeed > 0 ? Math.abs(vForward) / maxSpeed : 0;
  AudioSystem.updateEngine(audioSpeedRatio);

  if (taillight) {
    const braking = (inputForward < 0) || (vForward > 0.01 && inputForward < 0);
    taillight.intensity = braking ? 2.5 : (vForward > 0.01 ? 0.3 : 0.8);
    const tailPos = new Vector3(pos.x, 0.4 + droidY, pos.z).add(new Vector3(-dirX, 0, -dirZ).scale(r + 0.15));
    taillight.position.copyFrom(tailPos);
  }

  if (headlight) {
    const headHeight = droidConfig.body === 'heavy' ? 0.95 : droidConfig.body === 'slim' ? 1.35 : 1.05;
    const fwdVec = new Vector3(dirX, 0, dirZ);
    headlight.position.set(pos.x, headHeight + droidY, pos.z);
    headlight.position.addInPlace(fwdVec.scale(r + 0.1));
    const targetPos = headlight.position.clone().addInPlace(fwdVec.scale(6));
    headlight.direction = targetPos.subtract(headlight.position).normalize();
  }

  const isMoving = Math.abs(vForward) > 0.005 || Math.abs(vRight) > 0.005;
  const time = performance.now() / 1000;

  if (droid) {
    if (baseType === 'wheels' && droid.metadata?.wheels) {
      const rollAmount = vForward * 6.0;
      for (const w of droid.metadata.wheels) w.rotation.y += rollAmount;
      const drifting = Math.abs(vRight) > maxSpeed * 0.18;
      if (drifting && Math.random() < 0.35) spawnDriftDust(scene, new Vector3(pos.x, 0.02, pos.z), 0x333333);
      else if (isMoving && Math.random() < 0.08) spawnDriftDust(scene, new Vector3(pos.x, 0.02, pos.z), 0x8888aa);
    }
    if (baseType === 'tracks' && droid.metadata?.rollers) {
      const rollAmount = vForward * 5.0 + (inputTurn * steerPower * 3.0);
      for (const roller of droid.metadata.rollers) roller.rotation.y += rollAmount;
      if (isMoving && Math.random() < 0.12) spawnDriftDust(scene, new Vector3(pos.x, 0.02, pos.z), 0x7a7a8f);
    }
    if (baseType === 'hovers') {
      const intensity = Math.sin(time * 12) * 0.15 + 0.85;
      if (droid.metadata?.hoverGlows) {
        for (const glow of droid.metadata.hoverGlows) {
          if (glow.material) glow.material.emissiveColor = new Color3(0.27 * intensity, 0.67 * intensity, 1);
        }
      }
      if (Math.random() < 0.18) spawnDriftDust(scene, new Vector3(pos.x + (Math.random() - 0.5) * 0.6, 0.05, pos.z + (Math.random() - 0.5) * 0.6), 0x44aaff);
    }
    if (droid.metadata?.radarHead) droid.metadata.radarHead.rotation.y = time * 2.5;
    if (droid.metadata?.jetpackFlames) {
      const flameScale = inputForward > 0 ? (1.3 + Math.sin(time * 30) * 0.2) : (isMoving ? (0.8 + Math.sin(time * 20) * 0.1) : (0.2 + Math.sin(time * 10) * 0.05));
      for (const flame of droid.metadata.jetpackFlames) {
        flame.scaling.setAll(flameScale);
        if (flame.material) flame.material.emissiveColor = new Color3(0.17 * (0.5 + flameScale * 0.5), 0.4 * (0.5 + flameScale * 0.5), 1);
      }
    }
    if (droid.metadata?.thrusterCore && droid.metadata.thrusterCore.material) {
      droid.metadata.thrusterCore.material.emissiveColor = new Color3(0.07, 0.4, 0.87).scale(1.0 + Math.sin(time * 8) * 0.4);
    }

    droid.rotation.y = angle;
    droid.position.x = pos.x;
    droid.position.z = pos.z;
  }

  if (groundIndicator) {
    groundIndicator.position.set(pos.x, 0.03, pos.z);
    groundIndicator.rotation.y = angle;
  }

  const floorY = getFloorHeight(pos.x, pos.z);
  const hoverTarget = hovering ? 1.8 : 0;
  const bobbing = baseType === 'hovers' ? (Math.sin(time * 4) * 0.08 + 0.15) : 0;
  const targetY = floorY + hoverTarget + bobbing;
  droidY += (targetY - droidY) * 0.12;
  if (droid) droid.position.y = 0.01 + droidY;

  const margin = 0.3;
  pos.x = Math.max(-W / 2 + margin, Math.min(W / 2 - margin, pos.x));
  pos.z = Math.max(-H / 2 + margin, Math.min(H / 2 - margin, pos.z));

  const dt = 1 / 60;
  if (boostActive) {
    boostTimer -= dt;
    if (boostTimer <= 0) { boostActive = false; boostTimer = 0; deactivateBoost(); }
  }
  if (boostCooldownTimer > 0) { boostCooldownTimer -= dt; if (boostCooldownTimer < 0) boostCooldownTimer = 0; }

  const goal = courseData.goalPos;
  const gdx = pos.x - goal.x, gdz = pos.z - goal.z, gdy = (droidY || 0) - (goal.y || 0);
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
    if (!isRamp(currentCell) && !isRamp(targetCell)) return true;
  }

  for (const o of courseData.obstacles) {
    if (o.type === 'wall') {
      const wallMinY = o.y || 0;
      const wallMaxY = wallMinY + 2.5;
      if (y + 1.2 <= wallMinY || y >= wallMaxY) continue;
    } else {
      if (Math.abs((o.y || 0) - y) > 0.5) continue;
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

  const camDist = 6, camHeight = 4;
  const behind = new Vector3(-Math.sin(angle), 0, -Math.cos(angle));
  const targetPos = new Vector3(pos.x + behind.x * camDist, camHeight + (droidY || 0), pos.z + behind.z * camDist);
  camera.position = Vector3.Lerp(camera.position, targetPos, 0.12);
  const lookTarget = new Vector3(pos.x, 0.5 + (droidY || 0) * 0.5, pos.z);
  camera.setTarget(lookTarget);

  if (starfield) starfield.update(elapsed);
  if (dust) dust.update();
  updateBeacon(elapsed);

  // Occlusion transparency
  if (droid && camera && courseData && courseData.courseGroup) {
    const camToDroid = droid.position.subtract(camera.position);
    const droidDist = camToDroid.length();
    const dir = camToDroid.normalize();

    courseData.courseGroup.getChildMeshes().forEach(child => {
      if (child.name === 'wallBox') {
        const wallPos = child.getAbsolutePosition();
        const camToWall = wallPos.subtract(camera.position);
        const wallDist = camToWall.length();
        let targetOpacity = 1.0;
        if (wallDist < droidDist) {
          const dot = Vector3.Dot(camToWall, dir);
          if (dot > 0) {
            const projection = dir.scale(dot);
            const perpDist = camToWall.subtract(projection).length();
            if (perpDist < 1.3) targetOpacity = 0.25;
          }
        }
        if (child.material) {
          child.material.alpha = targetOpacity;
        }
      }
    });
  }

  if (boostFlame && droid) {
    const behindVec = new Vector3(-Math.sin(angle), 0, -Math.cos(angle));
    boostFlame.position.copyFrom(droid.position).addInPlace(behindVec.scale(0.5));
    boostFlame.position.y += 0.35;
    boostFlame.rotation.y = angle;
    boostFlame.setEnabled(boostActive);
    if (boostActive) {
      const pulse = 1.0 + Math.sin(time * 28) * 0.2;
      boostFlame.scaling.setAll(pulse);
    }
  }

  drawMinimap(pos, angle);

  const now = performance.now() / 1000;
  const sinceLastFire = now - lastFireTime;
  const ready = sinceLastFire >= FIRE_COOLDOWN;
  cooldownFill.style.width = ready ? '100%' : ((sinceLastFire / FIRE_COOLDOWN) * 100) + '%';
  cooldownFill.style.background = ready ? '#44ffaa' : '#' + laserColorHex.toString(16).padStart(6, '0');

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

  const boostBtn = document.getElementById('btn-boost');
  if (boostBtn) {
    if (boostActive) { boostBtn.classList.add('boosting'); boostBtn.classList.remove('cooldown'); }
    else if (boostCooldownTimer > 0) { boostBtn.classList.remove('boosting'); boostBtn.classList.add('cooldown'); }
    else { boostBtn.classList.remove('boosting'); boostBtn.classList.remove('cooldown'); }
  }
}

function updateHoverUI() {
  const hoverBtn = document.getElementById('btn-hover');
  if (hoverBtn) {
    if (hovering) hoverBtn.classList.add('active-state');
    else hoverBtn.classList.remove('active-state');
  }
}

export function init() {
  document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') { e.preventDefault(); if (running && !won) fireLaser(); }
    if (e.key.toLowerCase() === 'h') { hovering = !hovering; updateHoverUI(); }
    if (e.key.toLowerCase() === 'enter') {
      if (running && !won && boostCooldownTimer <= 0 && !boostActive) { e.preventDefault(); activateBoost(); }
    }
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key)) e.preventDefault();
  });
  document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  const shootBtn = document.getElementById('btn-shoot');
  const triggerShoot = e => { e.preventDefault(); if (running && !won) fireLaser(); };
  shootBtn?.addEventListener('pointerdown', triggerShoot);
  shootBtn?.addEventListener('touchstart', triggerShoot, { passive: false });

  const hoverBtn = document.getElementById('btn-hover');
  const triggerHover = e => { e.preventDefault(); hovering = !hovering; updateHoverUI(); };
  hoverBtn?.addEventListener('pointerdown', triggerHover);
  hoverBtn?.addEventListener('touchstart', triggerHover, { passive: false });

  const boostBtn = document.getElementById('btn-boost');
  const triggerBoost = e => { e.preventDefault(); if (running && !won && boostCooldownTimer <= 0 && !boostActive) activateBoost(); };
  boostBtn?.addEventListener('pointerdown', triggerBoost);
  boostBtn?.addEventListener('touchstart', triggerBoost, { passive: false });

  const touchControls = document.getElementById('touch-controls');
  touchControls?.addEventListener('contextmenu', e => e.preventDefault());
  shootBtn?.addEventListener('contextmenu', e => e.preventDefault());
  hoverBtn?.addEventListener('contextmenu', e => e.preventDefault());
  boostBtn?.addEventListener('contextmenu', e => e.preventDefault());
}
