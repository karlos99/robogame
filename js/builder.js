import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildDroid } from './robot.js';
import { createStarfield } from './environment.js';

const container = document.getElementById('builder-canvas-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06060e);

const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 50);
camera.position.set(3, 2.5, 4);
camera.lookAt(0, 0.6, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.6, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 2;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI / 2.1;
controls.update();

const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffeedd, 1.8);
keyLight.position.set(4, 8, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 512;
keyLight.shadow.mapSize.height = 512;
keyLight.shadow.camera.near = 0.1;
keyLight.shadow.camera.far = 20;
keyLight.shadow.camera.left = -5;
keyLight.shadow.camera.right = 5;
keyLight.shadow.camera.top = 5;
keyLight.shadow.camera.bottom = -5;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x6688ff, 0.6);
fillLight.position.set(-3, 4, -4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0x88aaff, 0.4);
rimLight.position.set(0, 1, -6);
scene.add(rimLight);

const floorGeo = new THREE.PlaneGeometry(8, 8);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x12121e, roughness: 0.9, metalness: 0.1 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.01;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(8, 16, 0x2a2a4a, 0x1a1a3a);
grid.position.y = 0;
scene.add(grid);

const arrowMat = new THREE.MeshStandardMaterial({ color: 0x44ffaa, emissive: 0x22cc88, emissiveIntensity: 0.7, transparent: true, opacity: 0.6 });
const arrowShaft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.8), arrowMat);
arrowShaft.position.set(0, 0.01, 1.2);
scene.add(arrowShaft);
const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 6), arrowMat);
arrowHead.position.set(0, 0.01, 1.7);
arrowHead.rotation.x = Math.PI / 2;
scene.add(arrowHead);
const arrowLabelMat = new THREE.MeshStandardMaterial({ color: 0x44ffaa, emissive: 0x22cc88, emissiveIntensity: 0.5 });
const arrowDot1 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), arrowLabelMat);
arrowDot1.position.set(0, 0.02, 2.0);
scene.add(arrowDot1);
const arrowDot2 = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), arrowLabelMat);
arrowDot2.position.set(0, 0.02, 2.2);
scene.add(arrowDot2);
const arrowDot3 = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), arrowLabelMat);
arrowDot3.position.set(0, 0.02, 2.35);
scene.add(arrowDot3);

const starfield = createStarfield(500, 30);
scene.add(starfield.points);

let currentDroid = null;
let animRunning = false;
let builderAnimId = null;

const PRIMARY_COLORS = [
  '#ff2244', '#ff6600', '#ffcc00', '#44dd44', '#44ffff',
  '#4488ff', '#aa44ff', '#ff44aa', '#ffffff', '#888888'
];

const config = {
  head: 'dome',
  body: 'standard',
  base: 'wheels',
  accessory: 'none',
  colors: { head: '#e8e8e8', body: '#f0f0f0', base: '#444444', accent: '#2255aa', laser: '#ff2244' }
};

const colorIndices = {};

function closestColorIndex(hex) {
  let best = 0;
  let bestDist = Infinity;
  const r1 = parseInt(hex.slice(1, 3), 16);
  const g1 = parseInt(hex.slice(3, 5), 16);
  const b1 = parseInt(hex.slice(5, 7), 16);
  for (let i = 0; i < PRIMARY_COLORS.length; i++) {
    const h = PRIMARY_COLORS[i];
    const r2 = parseInt(h.slice(1, 3), 16);
    const g2 = parseInt(h.slice(3, 5), 16);
    const b2 = parseInt(h.slice(5, 7), 16);
    const dist = (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
    if (dist < bestDist) { bestDist = dist; best = i; }
  }
  return best;
}

function updateDroid() {
  if (currentDroid) {
    scene.remove(currentDroid);
    disposeGroup(currentDroid);
  }
  currentDroid = buildDroid(config);
  currentDroid.position.y = 0.01;
  scene.add(currentDroid);
  updateStats();
}

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

function updateStats() {
  const d = currentDroid?.userData || { speed: 3, turnSpeed: 0.03, armor: 3 };
  document.getElementById('stat-speed').textContent = 'Speed: ' + d.speed;
  document.getElementById('stat-handling').textContent = 'Turn: ' + Math.round(d.turnSpeed * 100);
  document.getElementById('stat-armor').textContent = 'Armor: ' + d.armor;
}

function animate() {
  if (!animRunning) return;
  builderAnimId = requestAnimationFrame(animate);
  controls.update();
  const time = performance.now() / 1000;
  starfield.update(time);
  renderer.render(scene, camera);
}

export function startAnim() {
  if (!animRunning) {
    animRunning = true;
    animate();
  }
}

export function stopAnim() {
  animRunning = false;
  if (builderAnimId) {
    cancelAnimationFrame(builderAnimId);
    builderAnimId = null;
  }
}

export function init() {
  for (const key of Object.keys(config.colors)) {
    colorIndices[key] = closestColorIndex(config.colors[key]);
  }

  document.querySelectorAll('.part-group[data-options]').forEach(group => {
    const part = group.dataset.part;
    const options = group.dataset.options.split(',');
    const labels = group.dataset.labels.split(',');
    let currentIdx = options.indexOf(config[part]);
    const optionSpan = group.querySelector('.current-option');

    const prevPart = () => {
      currentIdx = (currentIdx - 1 + options.length) % options.length;
      config[part] = options[currentIdx];
      optionSpan.textContent = labels[currentIdx];
      updateDroid();
    };
    const nextPart = () => {
      currentIdx = (currentIdx + 1) % options.length;
      config[part] = options[currentIdx];
      optionSpan.textContent = labels[currentIdx];
      updateDroid();
    };

    group.querySelectorAll('.arrow-btn')[0].addEventListener('click', prevPart);
    group.querySelectorAll('.arrow-btn')[1].addEventListener('click', nextPart);
  });

  document.querySelectorAll('.color-swatch').forEach(swatch => {
    const colorKey = swatch.dataset.colorKey;
    const selector = swatch.closest('.color-selector');
    const arrows = selector.querySelectorAll('.arrow-btn');

    const prevColor = () => {
      colorIndices[colorKey] = (colorIndices[colorKey] - 1 + PRIMARY_COLORS.length) % PRIMARY_COLORS.length;
      const c = PRIMARY_COLORS[colorIndices[colorKey]];
      config.colors[colorKey] = c;
      swatch.style.background = c;
      updateDroid();
    };
    const nextColor = () => {
      colorIndices[colorKey] = (colorIndices[colorKey] + 1) % PRIMARY_COLORS.length;
      const c = PRIMARY_COLORS[colorIndices[colorKey]];
      config.colors[colorKey] = c;
      swatch.style.background = c;
      updateDroid();
    };

    arrows[0].addEventListener('click', prevColor);
    arrows[1].addEventListener('click', nextColor);
  });

  updateDroid();
  startAnim();

  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

export function getConfig() {
  return {
    head: config.head,
    body: config.body,
    base: config.base,
    accessory: config.accessory,
    colors: { ...config.colors }
  };
}

export function cleanup() {
  if (currentDroid) {
    scene.remove(currentDroid);
    disposeGroup(currentDroid);
    currentDroid = null;
  }
}
