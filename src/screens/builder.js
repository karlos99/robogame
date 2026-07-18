import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { Vector3, Color3, Color4 } from '@babylonjs/core/Maths/math';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { buildDroid } from '../droid/robot.js';
import { config, closestColorIndex, PRIMARY_COLORS, getConfig } from '../core/state.js';

const container = document.getElementById('builder-canvas-container');

let engine, scene, camera, starfield;
let currentDroid = null;
let animRunning = false;

const colorIndices = {};

function initScene() {
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);

  engine = new Engine(canvas, true, { adaptToDeviceRatio: true });
  scene = new Scene(engine);
  scene.clearColor = new Color4(0.024, 0.024, 0.055, 1);

  camera = new ArcRotateCamera('cam', Math.PI * 0.65, Math.PI * 0.38, 5.5, new Vector3(0, 0.6, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 2;
  camera.upperRadiusLimit = 10;
  camera.upperBetaLimit = Math.PI / 2.1;
  camera.wheelPrecision = 30;
  camera.panningSensibility = 0;
  camera.inertia = 0.92;

  const hemiLight = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.95;
  hemiLight.diffuse = new Color3(0.82, 0.87, 1);
  hemiLight.groundColor = new Color3(0.24, 0.21, 0.17);

  const sunLight = new DirectionalLight('sun', new Vector3(-0.4, -0.8, -0.3), scene);
  sunLight.position = new Vector3(4, 8, 6);
  sunLight.intensity = 2.5;
  sunLight.diffuse = new Color3(1, 0.99, 0.96);

  const fillLight = new DirectionalLight('fill', new Vector3(0.3, -0.6, 0.3), scene);
  fillLight.intensity = 0.85;
  fillLight.diffuse = new Color3(0.67, 0.8, 1);

  const backLight = new DirectionalLight('back', new Vector3(0, -0.5, 0.5), scene);
  backLight.intensity = 0.6;
  backLight.diffuse = new Color3(1, 0.92, 0.82);

  const floor = MeshBuilder.CreateGround('floor', { width: 8, height: 8 }, scene);
  const floorMat = new StandardMaterial('floorMat', scene);
  floorMat.diffuseColor = new Color3(0.07, 0.07, 0.12);
  floorMat.specularColor = new Color3(0.02, 0.02, 0.02);
  floor.material = floorMat;
  floor.position.y = -0.01;
  floor.receiveShadows = true;

  const grid = MeshBuilder.CreateGround('grid', { width: 8, height: 8, subdivisions: 16 }, scene);
  const gridMat = new StandardMaterial('gridMat', scene);
  gridMat.wireframe = true;
  gridMat.emissiveColor = new Color3(0.12, 0.12, 0.2);
  gridMat.disableLighting = true;
  grid.material = gridMat;
  grid.position.y = 0.01;

  // Forward indicator arrow on floor
  const arrowMat = new StandardMaterial('arrowMat', scene);
  arrowMat.emissiveColor = new Color3(0.27, 1, 0.67);
  arrowMat.disableLighting = true;
  arrowMat.alpha = 0.6;
  const arrowShaft = MeshBuilder.CreateBox('arrowShaft', { width: 0.08, height: 0.02, depth: 0.8 }, scene);
  arrowShaft.material = arrowMat;
  arrowShaft.position.set(0, 0.01, 1.2);
  const arrowHead = MeshBuilder.CreateCylinder('arrowHead', { diameterTop: 0, diameterBottom: 0.24, height: 0.25, tessellation: 6 }, scene);
  arrowHead.material = arrowMat;
  arrowHead.position.set(0, 0.01, 1.7);
  arrowHead.rotation.x = Math.PI / 2;

  const dotMat = new StandardMaterial('dotMat', scene);
  dotMat.emissiveColor = new Color3(0.27, 1, 0.67);
  dotMat.disableLighting = true;
  for (let i = 0; i < 3; i++) {
    const dot = MeshBuilder.CreateSphere('dot' + i, { diameter: 0.06 - i * 0.01, segments: 6 }, scene);
    dot.material = dotMat;
    dot.position.set(0, 0.02, 2.0 + i * 0.15);
  }

  // Starfield - simplified with emissive spheres
  const starMat = new StandardMaterial('starMat', scene);
  starMat.disableLighting = true;
  starMat.emissiveColor = new Color3(0.9, 0.9, 1);
  starMat.alpha = 0.6;
  const stars = [];
  for (let i = 0; i < 500; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 30 * (0.5 + Math.random() * 0.5);
    const star = MeshBuilder.CreateSphere('star' + i, { diameter: 0.05 + Math.random() * 0.1, segments: 4 }, scene);
    star.material = starMat;
    star.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      Math.abs(r * Math.cos(phi)) * 0.6 + 5,
      r * Math.sin(phi) * Math.sin(theta)
    );
    star.isPickable = false;
    stars.push(star);
  }
  starfield = stars;

  engine.runRenderLoop(() => {
    if (scene && !scene.isDisposed) {
      const time = performance.now() / 1000;
      // Twinkle stars
      for (const s of starfield) {
        const twinkle = Math.sin(time * 2 + s.position.x * 0.5 + s.position.z * 0.3) * 0.15 + 0.6;
        s.scaling.setAll(twinkle);
      }
      scene.render();
    }
  });

  window.addEventListener('resize', () => {
    if (engine && !engine.isDisposed) engine.resize();
  });
}

function updateDroid() {
  if (currentDroid) {
    currentDroid.dispose();
    currentDroid = null;
  }
  currentDroid = buildDroid(config, scene);
  currentDroid.position.y = 0.01;
  updateStats();
}

function updateStats() {
  const d = currentDroid?.metadata || { speed: 3, turnSpeed: 0.03, armor: 3 };
  document.getElementById('stat-speed').textContent = 'Speed: ' + d.speed;
  document.getElementById('stat-handling').textContent = 'Turn: ' + Math.round(d.turnSpeed * 100);
  document.getElementById('stat-armor').textContent = 'Armor: ' + d.armor;
}

export function startAnim() {
  animRunning = true;
}

export function stopAnim() {
  animRunning = false;
}

export function init() {
  initScene();

  for (const key of Object.keys(config.colors)) {
    colorIndices[key] = closestColorIndex(config.colors[key]);
  }

  document.querySelectorAll('.part-group[data-options]').forEach(group => {
    const part = group.dataset.part;
    const options = group.dataset.options.split(',');
    const labels = group.dataset.labels ? group.dataset.labels.split(',') : options;
    let currentIdx = options.indexOf(config[part]);
    if (currentIdx === -1) currentIdx = 0;
    const optionSpan = group.querySelector('.current-option');

    const prevPart = () => {
      currentIdx = (currentIdx - 1 + options.length) % options.length;
      config[part] = options[currentIdx];
      if (optionSpan) optionSpan.textContent = labels[currentIdx];
      updateDroid();
    };
    const nextPart = () => {
      currentIdx = (currentIdx + 1) % options.length;
      config[part] = options[currentIdx];
      if (optionSpan) optionSpan.textContent = labels[currentIdx];
      updateDroid();
    };

    const arrows = group.querySelectorAll('.part-selector .arrow-btn');
    if (arrows.length >= 2) {
      arrows[0].addEventListener('click', prevPart);
      arrows[1].addEventListener('click', nextPart);
    }
    if (optionSpan) optionSpan.textContent = labels[currentIdx];
  });

  document.querySelectorAll('.color-swatch').forEach(swatch => {
    const colorKey = swatch.dataset.colorKey;
    const selector = swatch.closest('.color-selector');
    if (!selector) return;
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

    if (arrows.length >= 2) {
      arrows[0].addEventListener('click', prevColor);
      arrows[1].addEventListener('click', nextColor);
    }
    swatch.style.background = config.colors[colorKey];
  });

  updateDroid();
}

export function cleanup() {
  if (currentDroid) {
    currentDroid.dispose();
    currentDroid = null;
  }
}
