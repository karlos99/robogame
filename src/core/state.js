export const PRIMARY_COLORS = [
  '#ff2244', '#ff6600', '#ffcc00', '#44dd44', '#44ffff',
  '#4488ff', '#aa44ff', '#ff44aa', '#ffffff', '#888888'
];

export const config = {
  head: 'dome',
  body: 'standard',
  base: 'wheels',
  accessory: 'none',
  colors: { head: '#e8e8e8', body: '#f0f0f0', base: '#444444', accent: '#2255aa', laser: '#ff2244' },
};

export function closestColorIndex(hex) {
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

export function getConfig() {
  return {
    head: config.head,
    body: config.body,
    base: config.base,
    accessory: config.accessory,
    colors: { ...config.colors },
  };
}

export const gameProgress = {
  activeLevel: 0,
  unlockedLevels: [0, 1, 2, 3],

  load() {
    try {
      const saved = localStorage.getItem('jayden_unlocked_levels');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) this.unlockedLevels = parsed;
      }
    } catch (e) { /* ignore */ }
    if (!this.unlockedLevels.length) this.unlockedLevels = [0, 1, 2, 3];
    if (!this.unlockedLevels.includes(3)) this.unlockedLevels.push(3);
  },

  save() {
    try {
      localStorage.setItem('jayden_unlocked_levels', JSON.stringify(this.unlockedLevels));
    } catch (e) { /* ignore */ }
  },

  isUnlocked(lvl) {
    return this.unlockedLevels.includes(lvl);
  },

  unlockNext() {
    const next = this.activeLevel + 1;
    if (next < 3 && !this.unlockedLevels.includes(next)) {
      this.unlockedLevels.push(next);
      this.save();
    }
  },
};
