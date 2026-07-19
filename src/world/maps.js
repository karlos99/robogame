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
    [1, 0, 1, 0, 1, 0, 1, 0, 2, 0, 0, 1, 5, 6, 5, 5, 5, 'RR', 5, 5, 5, 5, 5, 0, 1],
    [1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 0, 1],
    [1, 0, 1, 1, 1, 0, 'RU', 5, 5, 5, 5, 5, 5, 5, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 5, 9, 1],
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

  for (let c = 2; c < C - 2; c++) {
    if (grid[2][c] === 0) {
      for (let cc = c; cc <= 22; cc++) grid[2][cc] = 0;
      break;
    }
  }
  grid[1][1] = 0;
  grid[1][2] = 0;
  grid[2][1] = 0;

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

export let currentMapIndex = 0;

export function createVacuumMap() {
  const R = ROWS, C = COLS;
  const grid = Array.from({ length: R }, () => Array(C).fill(0));
  for (let r = 0; r < R; r++) {
    grid[r][0] = 1;
    grid[r][C - 1] = 1;
  }
  for (let c = 0; c < C; c++) {
    grid[0][c] = 1;
    grid[R - 1][c] = 1;
  }
  grid[1][1] = 'S';
  for (let r = 2; r < R - 2; r++) {
    for (let c = 2; c < C - 2; c++) {
      const rnd = Math.random();
      if (rnd < 0.04) grid[r][c] = 2;
      else if (rnd < 0.07) grid[r][c] = 3;
    }
  }
  MAP = grid;
  MAPS[4] = grid;
}

export function selectMap(index) {
  currentMapIndex = index;
  if (index === 3) {
    generateRandomMap();
  } else if (index === 4) {
    createVacuumMap();
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

  if (cell === 'RU') return (1 - localZ) * 1.5;
  if (cell === 'RD') return localZ * 1.5;
  if (cell === 'RL') return (1 - localX) * 1.5;
  if (cell === 'RR') return localX * 1.5;

  return 0;
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
