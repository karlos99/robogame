import * as THREE from 'three';

export const TILE = 2;
export const COLS = 25;
export const ROWS = 19;
export const W = COLS * TILE;
export const H = ROWS * TILE;

export const MAPS = [
  // MAP 0 (S-Curve Gateway)
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 'S', 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 9, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 5, 6, 5, 5, 5, 5, 5, 5, 5, 6, 1],
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 5, 6, 5, 6, 6, 6, 6, 6, 5, 6, 1],
    [1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 5, 6, 5, 6, 0, 0, 0, 6, 5, 6, 1],
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 5, 6, 5, 6, 0, 1, 0, 6, 5, 6, 1],
    [1, 0, 2, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 5, 6, 5, 6, 0, 1, 0, 6, 5, 6, 1],
    [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 6, 5, 6, 0, 1, 0, 6, 5, 6, 1],
    [1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 5, 6, 5, 6, 0, 1, 0, 6, 5, 6, 1],
    [1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 5, 6, 0, 1, 0, 6, 5, 6, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 5, 6, 5, 6, 0, 1, 0, 6, 5, 6, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 5, 6, 5, 6, 0, 1, 0, 6, 5, 6, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 5, 6, 5, 6, 0, 1, 0, 6, 5, 6, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 5, 8, 5, 6, 0, 1, 0, 6, 5, 6, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 'RR', 5, 5, 5, 5, 5, 5, 5, 5, 6, 0, 1, 0, 6, 5, 6, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 6, 0, 0, 0, 6, 5, 6, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 6, 6, 6, 6, 6, 5, 6, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ],
  // MAP 1 (Double-Ramp Loop)
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 'S', 0, 0, 0, 1, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0, 1],
    [1, 0, 1, 1, 0, 1, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 0, 1],
    [1, 0, 1, 1, 0, 1, 5, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 5, 0, 1],
    [1, 0, 0, 0, 0, 1, 5, 6, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 6, 5, 0, 1],
    [1, 1, 1, 1, 0, 1, 5, 6, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 5, 6, 5, 0, 1],
    [1, 0, 0, 0, 0, 1, 5, 6, 5, 6, 0, 1, 1, 1, 1, 1, 1, 1, 0, 6, 5, 6, 5, 0, 1],
    [1, 0, 2, 1, 1, 1, 5, 6, 5, 6, 0, 1, 2, 0, 0, 0, 0, 1, 0, 6, 5, 6, 5, 0, 1],
    [1, 0, 1, 0, 0, 0, 5, 6, 5, 6, 0, 1, 1, 1, 1, 1, 0, 1, 0, 6, 5, 6, 5, 0, 1],
    [1, 0, 1, 0, 1, 1, 5, 6, 5, 6, 0, 0, 0, 0, 0, 1, 0, 1, 0, 6, 5, 6, 5, 0, 1],
    [1, 0, 1, 0, 1, 1, 5, 6, 5, 6, 1, 1, 1, 1, 0, 1, 0, 1, 0, 6, 5, 6, 5, 0, 1],
    [1, 0, 1, 0, 1, 1, 5, 6, 5, 6, 1, 0, 0, 1, 0, 1, 0, 1, 0, 6, 5, 6, 5, 0, 1],
    [1, 0, 1, 0, 0, 0, 5, 6, 5, 6, 1, 0, 3, 1, 0, 1, 0, 1, 0, 6, 5, 6, 5, 0, 1],
    [1, 0, 1, 1, 1, 1, 5, 6, 5, 6, 1, 1, 1, 1, 0, 1, 0, 1, 0, 6, 5, 6, 5, 0, 1],
    [1, 0, 0, 0, 0, 0, 5, 6, 5, 6, 0, 1, 0, 1, 0, 1, 0, 1, 0, 6, 5, 6, 5, 0, 1],
    [1, 0, 1, 1, 1, 0, 'RU', 6, 5, 6, 0, 1, 0, 1, 0, 1, 0, 1, 0, 'RU', 5, 6, 5, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 6, 5, 9, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 6, 6, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ],
  // MAP 2 (The Fortress)
  [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 'S', 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 2, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 5, 5, 5, 5, 6, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 5, 6, 6, 5, 6, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 5, 6, 5, 5, 6, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 5, 6, 5, 6, 6, 0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 2, 0, 0, 1, 5, 6, 5, 5, 5, 'RR', 5, 5, 5, 5, 5, 0, 1], // East-rising ramp
    [1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 0, 1],
    [1, 0, 1, 1, 1, 0, 'RU', 5, 5, 5, 5, 5, 5, 5, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 1], // North-rising ramp
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 5, 9, 1], // goal 9
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 6, 6, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ]
];

export let MAP = MAPS[0];

export function generateRandomMap() {
  const R = ROWS, C = COLS;
  const grid = Array.from({ length: R }, () => Array(C).fill(1));
  const visited = Array.from({ length: R }, () => Array(C).fill(false));

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function carve(r, c) {
    visited[r][c] = true;
    grid[r][c] = 0;
    const dirs = shuffle([[-2, 0], [2, 0], [0, -2], [0, 2]]);
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 2 && nr < R - 2 && nc >= 2 && nc < C - 2 && !visited[nr][nc]) {
        grid[r + dr / 2][c + dc / 2] = 0;
        carve(nr, nc);
      }
    }
  }

  carve(2, 2);

  // Ensure goal region is reachable on lower level
  for (let c = 2; c < C - 2; c++) {
    if (grid[2][c] === 0) {
      for (let cc = c; cc <= 22; cc++) grid[2][cc] = 0;
      break;
    }
  }
  grid[1][1] = 0;
  grid[1][2] = 0;
  grid[2][1] = 0;

  // Clear upper platform region
  for (let r = 1; r <= 4; r++) {
    for (let c = 16; c <= 23; c++) {
      grid[r][c] = 5;
    }
  }
  grid[1][23] = 9;
  grid[1][1] = 'S';
  grid[2][18] = 6;
  grid[3][19] = 6;
  grid[4][17] = 6;
  grid[5][17] = 'RU';
  grid[4][17] = 5;
  grid[6][17] = 0;

  // Randomly place crates and barrels in remaining wall cells
  for (let r = 1; r < R - 1; r++) {
    for (let c = 1; c < C - 1; c++) {
      if (grid[r][c] === 1) {
        const rnd = Math.random();
        if (rnd < 0.10) grid[r][c] = 2;
        else if (rnd < 0.17) grid[r][c] = 3;
      }
    }
  }

  MAP = grid;
  MAPS[3] = grid;
}

export function selectMap(index) {
  if (index === 3) {
    generateRandomMap();
  } else {
    MAP = MAPS[index];
  }
}

export function getFloorHeight(x, z) {
  const c = Math.floor((x + W / 2) / TILE);
  const r = Math.floor((z + H / 2) / TILE);

  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return 0;

  const cell = MAP[r][c];

  if (cell === 5 || cell === 9 || cell === 6 || cell === 7 || cell === 8) {
    return 1.5;
  }

  const localX = ((x + W / 2) / TILE) - c;
  const localZ = ((z + H / 2) / TILE) - r;

  if (cell === 'RU') {
    return (1 - localZ) * 1.5;
  }
  if (cell === 'RD') {
    return localZ * 1.5;
  }
  if (cell === 'RL') {
    return (1 - localX) * 1.5;
  }
  if (cell === 'RR') {
    return localX * 1.5;
  }

  return 0;
}

const texLoader = new THREE.TextureLoader();

let groundTexColor = null;
let groundTexNormal = null;
let groundTexRough = null;
let wallTexColor = null;
let wallTexNormal = null;
let wallTexRough = null;
let texturesLoaded = false;
let beaconParts = [];

export function loadTextures() {
  return new Promise(resolve => {
    let loaded = 0;
    const total = 6;
    const check = () => { loaded++; if (loaded >= total) { texturesLoaded = true; resolve(); } };
    const onErr = () => check();

    texLoader.load('assets/textures/metal_plates/MetalPlates001_2K-JPG_Color.jpg', t => { t.wrapT = t.wrapS = THREE.RepeatWrapping; t.repeat.set(2, 2); groundTexColor = t; check(); }, undefined, onErr);
    texLoader.load('assets/textures/metal_plates/MetalPlates001_2K-JPG_NormalGL.jpg', t => { t.wrapT = t.wrapS = THREE.RepeatWrapping; t.repeat.set(2, 2); groundTexNormal = t; check(); }, undefined, onErr);
    texLoader.load('assets/textures/metal_plates/MetalPlates001_2K-JPG_Roughness.jpg', t => { t.wrapT = t.wrapS = THREE.RepeatWrapping; t.repeat.set(2, 2); groundTexRough = t; check(); }, undefined, onErr);
    texLoader.load('assets/textures/sci_fi_panel/Concrete028_2K-JPG_Color.jpg', t => { t.wrapT = t.wrapS = THREE.RepeatWrapping; t.repeat.set(1, 1); wallTexColor = t; check(); }, undefined, onErr);
    texLoader.load('assets/textures/sci_fi_panel/Concrete028_2K-JPG_NormalGL.jpg', t => { t.wrapT = t.wrapS = THREE.RepeatWrapping; t.repeat.set(1, 1); wallTexNormal = t; check(); }, undefined, onErr);
    texLoader.load('assets/textures/sci_fi_panel/Concrete028_2K-JPG_Roughness.jpg', t => { t.wrapT = t.wrapS = THREE.RepeatWrapping; t.repeat.set(1, 1); wallTexRough = t; check(); }, undefined, onErr);
  });
}

export function getStartPos() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (MAP[r][c] === 'S') {
        const x = (c + 0.5) * TILE - W / 2;
        const z = (r + 0.5) * TILE - H / 2;
        return { x, y: getFloorHeight(x, z), z };
      }
  return { x: -W / 2 + TILE, y: 0, z: H / 2 - TILE };
}

export function getGoalPos() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (MAP[r][c] === 9) {
        const x = (c + 0.5) * TILE - W / 2;
        const z = (r + 0.5) * TILE - H / 2;
        return { x, y: getFloorHeight(x, z), z };
      }
  return { x: W / 2 - TILE, y: 0, z: -H / 2 + TILE };
}


function createStreetlight(x, z, colorHex, courseGroup) {
  const lightGroup = new THREE.Group();
  lightGroup.position.set(x, 0, z);

  // Vertical pole
  const poleGeo = new THREE.CylinderGeometry(0.03, 0.05, 2.2, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x181818, metalness: 0.8, roughness: 0.2 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 1.1;
  pole.castShadow = true;
  lightGroup.add(pole);

  // Horizontal bracket pointing inwards
  const angleToCenter = Math.atan2(-z, -x);
  const bracketGeo = new THREE.BoxGeometry(0.04, 0.04, 0.5);
  const bracket = new THREE.Mesh(bracketGeo, poleMat);
  bracket.position.set(Math.cos(angleToCenter) * 0.2, 2.15, Math.sin(angleToCenter) * 0.2);
  bracket.rotation.y = -angleToCenter + Math.PI / 2;
  lightGroup.add(bracket);

  // Light bulb (emissive sphere)
  const bulbGeo = new THREE.SphereGeometry(0.08, 10, 10);
  const bulbMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 4.0
  });
  const bulb = new THREE.Mesh(bulbGeo, bulbMat);
  bulb.position.set(Math.cos(angleToCenter) * 0.45, 2.1, Math.sin(angleToCenter) * 0.45);
  lightGroup.add(bulb);

  // Spotlight pointing down
  const spot = new THREE.SpotLight(colorHex, 8, 15, Math.PI / 3, 0.5, 1.2);
  spot.position.set(x + Math.cos(angleToCenter) * 0.45, 2.1, z + Math.sin(angleToCenter) * 0.45);
  spot.target.position.set(x + Math.cos(angleToCenter) * 0.45, 0, z + Math.sin(angleToCenter) * 0.45);
  
  // Disable street light shadows on mobile/tablet to save 4 shadow map render passes per frame
  const isMobileOrTablet = window.matchMedia('(max-width: 1024px)').matches || window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  spot.castShadow = !isMobileOrTablet;
  spot.shadow.mapSize.width = 512;
  spot.shadow.mapSize.height = 512;
  spot.shadow.bias = -0.001;

  courseGroup.add(spot);
  courseGroup.add(spot.target);
  courseGroup.add(lightGroup);
}

export function buildCourse(scene) {
  const course = new THREE.Group();
  beaconParts = [];

  let groundMat;
  if (texturesLoaded && groundTexColor) {
    groundMat = new THREE.MeshStandardMaterial({
      map: groundTexColor,
      normalMap: groundTexNormal,
      roughnessMap: groundTexRough,
      roughness: 0.85,
      metalness: 0.45
    });
  } else {
    groundMat = new THREE.MeshStandardMaterial({ color: 0x0f0f1b, roughness: 0.9, metalness: 0.1 });
  }
  const groundGeo = new THREE.PlaneGeometry(W, H);
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, 0);
  ground.receiveShadow = true;
  course.add(ground);

  const gridHelper = new THREE.GridHelper(Math.max(W, H), Math.max(COLS, ROWS), 0x22223a, 0x121220);
  gridHelper.position.y = 0.01;
  course.add(gridHelper);

  const stripGeo = new THREE.BoxGeometry(W, 0.06, 0.04);
  const stripMat = new THREE.MeshStandardMaterial({ color: 0x4488cc, emissive: 0x2244aa, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.5 });
  const edgePositions = [
    { x: 0, z: -H / 2 + 0.02, ry: 0 },
    { x: 0, z: H / 2 - 0.02, ry: 0 },
    { x: -W / 2 + 0.02, z: 0, ry: Math.PI / 2 },
    { x: W / 2 - 0.02, z: 0, ry: Math.PI / 2 }
  ];
  for (const ep of edgePositions) {
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(ep.x, 0.03, ep.z);
    strip.rotation.y = ep.ry;
    course.add(strip);
  }

  // Create 4 streetlights at corners
  const neonColors = [0x00ffff, 0xff00ff, 0x9900ff, 0xffaa00];
  const corners = [
    [-W / 2 + 0.8, -H / 2 + 0.8],
    [W / 2 - 0.8, -H / 2 + 0.8],
    [-W / 2 + 0.8, H / 2 - 0.8],
    [W / 2 - 0.8, H / 2 - 0.8]
  ];
  for (let i = 0; i < 4; i++) {
    createStreetlight(corners[i][0], corners[i][1], neonColors[i], course);
  }

  let wallMat;
  if (texturesLoaded && wallTexColor) {
    wallMat = new THREE.MeshStandardMaterial({
      map: wallTexColor,
      normalMap: wallTexNormal,
      roughnessMap: wallTexRough,
      roughness: 0.8,
      metalness: 0.2
    });
  } else {
    wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3e, roughness: 0.85, metalness: 0.2 });
  }
  const wallCapMat = new THREE.MeshStandardMaterial({ color: 0x3d3d5c, roughness: 0.75, metalness: 0.35 });
  const wallStripMat = new THREE.MeshStandardMaterial({ color: 0x4488cc, emissive: 0x1133aa, emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.6 });

  const crateMat = new THREE.MeshStandardMaterial({ color: 0x9c7a52, roughness: 0.85, metalness: 0.1 });
  const crateStripeMat = new THREE.MeshStandardMaterial({ color: 0x7c5d35, roughness: 0.8 });
  const crateCornerMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.75 });

  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x2c3e2b, roughness: 0.8, metalness: 0.4 });
  const barrelBandMat = new THREE.MeshStandardMaterial({ color: 0x1e2b1d, roughness: 0.75 });
  const barrelRimMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.4, metalness: 0.8 });

  const obstacles = [];
  const startPos = getStartPos();
  const goalPos = getGoalPos();

  // Shared Geometries to optimize memory footprint, heap allocations, and garbage collection
  const slabGeo = new THREE.BoxGeometry(TILE, 0.15, TILE);
  const slabMat = new THREE.MeshStandardMaterial({ color: 0x1f1f2e, roughness: 0.6, metalness: 0.8 });
  const pillarGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.35, 8);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.8, roughness: 0.2 });

  const wallBoxGeo = new THREE.BoxGeometry(TILE, 2.5, TILE);
  const wallCapGeo = new THREE.BoxGeometry(TILE, 0.08, TILE);
  const wallStripGeo = new THREE.BoxGeometry(TILE + 0.02, 0.04, 0.04);

  const crateS = TILE * 0.72;
  const crateBoxGeo = new THREE.BoxGeometry(crateS, crateS, crateS);
  const crateStripeGeo1 = new THREE.BoxGeometry(crateS * 0.06, crateS + 0.01, crateS + 0.01);
  const crateStripeGeo2 = new THREE.BoxGeometry(crateS + 0.01, crateS + 0.01, crateS * 0.06);
  const crateCornerSize = 0.08;
  const crateCornerGeo = new THREE.BoxGeometry(crateCornerSize, crateS + 0.02, crateCornerSize);
  const crateGlowGeo = new THREE.BoxGeometry(crateS * 0.15, crateS * 0.15, crateS * 1.02);
  const crateGlowLedMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 2.0 });

  const rBarrel = TILE * 0.28;
  const hBarrel = TILE * 0.65;
  const barrelCoreGeo = new THREE.CylinderGeometry(rBarrel * 0.8, rBarrel * 0.8, hBarrel * 0.95, 12);
  const barrelCoreMat = new THREE.MeshStandardMaterial({
    color: 0x33ff66,
    emissive: 0x22cc44,
    emissiveIntensity: 2.5,
    roughness: 0.2,
    metalness: 0.1
  });
  const barrelColGeo = new THREE.BoxGeometry(0.04, hBarrel, 0.04);
  const barrelBandGeo = new THREE.CylinderGeometry(rBarrel * 1.05, rBarrel * 1.05, 0.04, 12);
  const barrelRimGeo = new THREE.TorusGeometry(rBarrel * 0.9, 0.02, 6, 12);

  const L = Math.sqrt(TILE * TILE + 1.5 * 1.5);
  const theta = Math.atan2(1.5, TILE);
  const rampBoxLongGeo = new THREE.BoxGeometry(TILE, 0.08, L);
  const rampBoxWideGeo = new THREE.BoxGeometry(L, 0.08, TILE);
  const rampMat = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.7, metalness: 0.5 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff4400, emissiveIntensity: 1.8, roughness: 0.3, metalness: 0.6 });
  const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
  const railGeo = new THREE.BoxGeometry(TILE * 0.92, 0.04, 0.04);
  const railGeoZ = new THREE.BoxGeometry(0.04, 0.04, TILE * 0.92);

  // Helper mesh builders to prevent code duplication
  function createCrateMesh() {
    const crateGroup = new THREE.Group();
    const box = new THREE.Mesh(crateBoxGeo, crateMat);
    box.position.y = crateS / 2;
    box.castShadow = true;
    box.receiveShadow = true;
    crateGroup.add(box);

    const stripe1 = new THREE.Mesh(crateStripeGeo1, crateStripeMat);
    stripe1.position.y = crateS / 2;
    crateGroup.add(stripe1);
    const stripe2 = new THREE.Mesh(crateStripeGeo2, crateStripeMat);
    stripe2.position.y = crateS / 2;
    crateGroup.add(stripe2);

    const corners = [[-1,-1],[-1,1],[1,-1],[1,1]];
    for (const [dx, dz] of corners) {
      const corner = new THREE.Mesh(crateCornerGeo, crateCornerMat);
      corner.position.set(dx * (crateS / 2 - crateCornerSize / 2), crateS / 2, dz * (crateS / 2 - crateCornerSize / 2));
      crateGroup.add(corner);
    }

    const glowLed = new THREE.Mesh(crateGlowGeo, crateGlowLedMat);
    glowLed.position.y = crateS / 2;
    crateGroup.add(glowLed);
    return crateGroup;
  }

  function createBarrelMesh() {
    const barrelGroup = new THREE.Group();
    const plasmaCore = new THREE.Mesh(barrelCoreGeo, barrelCoreMat);
    plasmaCore.position.y = hBarrel / 2;
    barrelGroup.add(plasmaCore);

    for (let a = 0; a < 4; a++) {
      const angle = (a * Math.PI) / 2;
      const col = new THREE.Mesh(barrelColGeo, barrelMat);
      col.position.set(Math.cos(angle) * (rBarrel + 0.01), hBarrel / 2, Math.sin(angle) * (rBarrel + 0.01));
      col.castShadow = true;
      barrelGroup.add(col);
    }

    for (const hFrac of [0.25, 0.5, 0.75]) {
      const band = new THREE.Mesh(barrelBandGeo, barrelBandMat);
      band.position.y = hBarrel * hFrac;
      barrelGroup.add(band);
    }

    const topRim = new THREE.Mesh(barrelRimGeo, barrelRimMat);
    topRim.position.y = hBarrel - 0.01;
    topRim.rotation.x = Math.PI / 2;
    barrelGroup.add(topRim);

    const bottomRim = new THREE.Mesh(barrelRimGeo, barrelRimMat);
    bottomRim.position.y = 0.01;
    bottomRim.rotation.x = Math.PI / 2;
    barrelGroup.add(bottomRim);
    return barrelGroup;
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = MAP[r][c];
      const cx = (c + 0.5) * TILE - W / 2;
      const cz = (r + 0.5) * TILE - H / 2;
      const hw = TILE / 2;
      const hh = TILE / 2;

      // 1. Render Upper Platform Slab (for values 5, 9, 6, 7, 8)
      if (v === 5 || v === 9 || v === 6 || v === 7 || v === 8) {
        const slab = new THREE.Mesh(slabGeo, slabMat);
        slab.position.set(cx, 1.425, cz);
        slab.receiveShadow = true;
        slab.castShadow = true;
        course.add(slab);

        // Support columns/pillars going down to y = 0
        const offsets = [
          [-TILE/2 + 0.1, -TILE/2 + 0.1],
          [TILE/2 - 0.1, -TILE/2 + 0.1],
          [-TILE/2 + 0.1, TILE/2 - 0.1],
          [TILE/2 - 0.1, TILE/2 - 0.1]
        ];
        for (const off of offsets) {
          const pillar = new THREE.Mesh(pillarGeo, pillarMat);
          pillar.position.set(cx + off[0], 1.35 / 2, cz + off[1]);
          pillar.castShadow = true;
          course.add(pillar);
        }
      }

      // 2. Build Walls
      if (v === 1 || v === 6) {
        const wallGroup = new THREE.Group();
        wallGroup.position.set(cx, 0, cz);
        wallGroup.name = "wallGroup";

        const yOffset = v === 6 ? 1.5 : 0;

        const box = new THREE.Mesh(wallBoxGeo, wallMat.clone());
        box.position.set(0, yOffset + 1.25, 0);
        box.castShadow = true;
        box.receiveShadow = true;
        wallGroup.add(box);

        const cap = new THREE.Mesh(wallCapGeo, wallCapMat.clone());
        cap.position.set(0, yOffset + 2.5 + 0.04, 0);
        wallGroup.add(cap);

        const stripX = new THREE.Mesh(wallStripGeo, wallStripMat.clone());
        stripX.position.set(0, yOffset + 1.0, hw);
        wallGroup.add(stripX);
        const stripX2 = new THREE.Mesh(wallStripGeo, wallStripMat.clone());
        stripX2.position.set(0, yOffset + 1.0, -hw);
        wallGroup.add(stripX2);

        course.add(wallGroup);
        obstacles.push({ type: 'wall', y: yOffset, x: cx - hw, z: cz - hh, w: TILE, h: TILE });
      }

      // 3. Build Crates & Barrels
      if (v === 2) {
        const crateGroup = createCrateMesh();
        crateGroup.position.set(cx, 0, cz);
        course.add(crateGroup);
        obstacles.push({ type: 'crate', y: 0, x: cx - crateS / 2, z: cz - crateS / 2, w: crateS, h: crateS, mesh: crateGroup, hp: 2, maxHp: 2, gridPos: { r, c } });
      } else if (v === 7) {
        const crateGroup = createCrateMesh();
        crateGroup.position.set(cx, 1.5, cz);
        course.add(crateGroup);
        obstacles.push({ type: 'crate', y: 1.5, x: cx - crateS / 2, z: cz - crateS / 2, w: crateS, h: crateS, mesh: crateGroup, hp: 2, maxHp: 2, gridPos: { r, c } });
      } else if (v === 3) {
        const barrelGroup = createBarrelMesh();
        barrelGroup.position.set(cx, 0, cz);
        course.add(barrelGroup);
        obstacles.push({ type: 'barrel', y: 0, x: cx, z: cz, r: rBarrel, mesh: barrelGroup, hp: 1, maxHp: 1, gridPos: { r, c } });
      } else if (v === 8) {
        const barrelGroup = createBarrelMesh();
        barrelGroup.position.set(cx, 1.5, cz);
        course.add(barrelGroup);
        obstacles.push({ type: 'barrel', y: 1.5, x: cx, z: cz, r: rBarrel, mesh: barrelGroup, hp: 1, maxHp: 1, gridPos: { r, c } });
      }

      // 4. Build Ramps with Railings
      if (v === 'RU' || v === 'RD' || v === 'RL' || v === 'RR') {
        const halfT = TILE / 2;
        const railY = 0.54;
        const postY = 0.29;
        const inset = 0.14;

        if (v === 'RU' || v === 'RD') {
          const rampGroup = new THREE.Group();
          rampGroup.position.set(cx, 0.75, cz);
          rampGroup.rotation.x = (v === 'RU') ? -theta : theta;

          const ramp = new THREE.Mesh(rampBoxLongGeo, rampMat);
          ramp.receiveShadow = true;
          ramp.castShadow = true;
          rampGroup.add(ramp);

          for (const side of [-1, 1]) {
            const sx = side * (halfT - inset);
            for (const zPos of [-L / 2 + 0.15, 0, L / 2 - 0.15]) {
              const post = new THREE.Mesh(postGeo, railMat);
              post.position.set(sx, postY, zPos);
              post.castShadow = true;
              rampGroup.add(post);
            }
            const railBar = new THREE.Mesh(railGeo, railMat);
            railBar.position.set(sx, railY, 0);
            railBar.castShadow = true;
            rampGroup.add(railBar);
          }

          course.add(rampGroup);
        } else {
          // RL or RR
          const rampGroup = new THREE.Group();
          rampGroup.position.set(cx, 0.75, cz);
          rampGroup.rotation.z = (v === 'RL') ? -theta : theta;

          const ramp = new THREE.Mesh(rampBoxWideGeo, rampMat);
          ramp.receiveShadow = true;
          ramp.castShadow = true;
          rampGroup.add(ramp);

          for (const side of [-1, 1]) {
            const sz = side * (halfT - inset);
            for (const xPos of [-L / 2 + 0.15, 0, L / 2 - 0.15]) {
              const post = new THREE.Mesh(postGeo, railMat);
              post.position.set(xPos, postY, sz);
              post.castShadow = true;
              rampGroup.add(post);
            }
            const railBar = new THREE.Mesh(railGeoZ, railMat);
            railBar.position.set(0, railY, sz);
            railBar.castShadow = true;
            rampGroup.add(railBar);
          }

          course.add(rampGroup);
        }
      }
    }
  }

  // Teleportation Warp Gate Beacon Setup
  const beaconY = goalPos.y || 0;
  const beaconBaseMat = new THREE.MeshStandardMaterial({
    color: 0xe94560, emissive: 0xe94560, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.2
  });
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.14, 16), beaconBaseMat);
  beacon.position.set(goalPos.x, beaconY + 0.07, goalPos.z);
  course.add(beacon);
  beaconParts.push(beacon);

  const beaconRingGeo = new THREE.TorusGeometry(0.55, 0.025, 8, 24);
  const beaconRingMat = new THREE.MeshStandardMaterial({ color: 0xff6688, emissive: 0xe94560, emissiveIntensity: 0.8, transparent: true, opacity: 0.6 });
  const beaconRing = new THREE.Mesh(beaconRingGeo, beaconRingMat);
  beaconRing.position.set(goalPos.x, beaconY + 0.1, goalPos.z);
  beaconRing.rotation.x = Math.PI / 2;
  course.add(beaconRing);
  beaconParts.push(beaconRing);

  const poleMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8, roughness: 0.15 });
  const beaconPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 8), poleMat);
  beaconPole.position.set(goalPos.x, beaconY + 0.7, goalPos.z);
  course.add(beaconPole);

  const beaconTopMat = new THREE.MeshStandardMaterial({
    color: 0xff3366, emissive: 0xff3366, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.1
  });
  const beaconTop = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), beaconTopMat);
  beaconTop.position.set(goalPos.x, beaconY + 1.4, goalPos.z);
  course.add(beaconTop);
  beaconParts.push(beaconTop);

  const beamGeo = new THREE.CylinderGeometry(0.04, 0.22, 3.5, 12, 1, true);
  const beamMat = new THREE.MeshStandardMaterial({ color: 0xe94560, emissive: 0xe94560, emissiveIntensity: 0.6, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(goalPos.x, beaconY + 3.15, goalPos.z);
  course.add(beam);
  beaconParts.push(beam);

  // Additional Spinning Futuristic Rings for Warp Portal
  const ring1Mat = new THREE.MeshStandardMaterial({ color: 0xff3388, emissive: 0xff1155, emissiveIntensity: 1.0, wireframe: true });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.015, 6, 16), ring1Mat);
  ring1.position.set(goalPos.x, beaconY + 0.7, goalPos.z);
  course.add(ring1);
  beaconParts.push(ring1);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.012, 6, 16), ring1Mat);
  ring2.position.set(goalPos.x, beaconY + 0.7, goalPos.z);
  course.add(ring2);
  beaconParts.push(ring2);

  scene.add(course);

  return { obstacles, startPos, goalPos, courseGroup: course, beaconParts };
}

export function updateBeacon(time) {
  if (!beaconParts.length) return;
  const pulse = Math.sin(time * 3) * 0.5 + 0.5;

  if (beaconParts[0]) {
    beaconParts[0].material.emissiveIntensity = 0.5 + pulse * 0.5;
  }
  if (beaconParts[1]) {
    beaconParts[1].scale.set(1 + pulse * 0.15, 1 + pulse * 0.15, 1);
    if (beaconParts[1].material) beaconParts[1].material.opacity = 0.3 + pulse * 0.4;
  }
  if (beaconParts[2]) {
    beaconParts[2].material.emissiveIntensity = 0.8 + pulse * 0.8;
  }
  if (beaconParts[3]) {
    if (beaconParts[3].material) beaconParts[3].material.opacity = 0.1 + pulse * 0.15;
  }
  // Animate spinning portal rings!
  if (beaconParts[4]) {
    beaconParts[4].rotation.y = time * 2.0;
    beaconParts[4].rotation.x = time * 0.5;
  }
  if (beaconParts[5]) {
    beaconParts[5].rotation.y = time * -1.5;
    beaconParts[5].rotation.z = time * 0.8;
  }
}

export function circleRectCollision(cx, cz, cr, rx, rz, rw, rh) {
  const nearX = Math.max(rx, Math.min(cx, rx + rw));
  const nearZ = Math.max(rz, Math.min(cz, rz + rh));
  const dx = cx - nearX;
  const dz = cz - nearZ;
  return dx * dx + dz * dz < cr * cr;
}

export function circleCircleCollision(x1, z1, r1, x2, z2, r2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return dx * dx + dz * dz < (r1 + r2) * (r1 + r2);
}
