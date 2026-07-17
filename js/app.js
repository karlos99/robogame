import { init as initBuilder, getConfig as getBuilderConfig, cleanup as cleanupBuilder, startAnim as startBuilderAnim, stopAnim as stopBuilderAnim } from './builder.js';
import { init as initGame, start as startGame, stop as stopGame, cleanup as cleanupGame } from './game.js';
import { selectMap } from './obstacles.js';

const builderScreen = document.getElementById('screen-builder');
const gameScreen = document.getElementById('screen-game');

let switching = false;

export const App = {
  activeLevel: 0,
  unlockedLevels: [0, 1, 2, 3],

  init() {
    initBuilder();
    initGame();

    this.loadUnlockedLevels();

    document.getElementById('enter-garage-btn').addEventListener('click', () => this.showBuilder());
    document.getElementById('launch-btn').addEventListener('click', () => this.showGame());
    document.getElementById('back-btn').addEventListener('click', () => this.showWelcome());
    
    document.getElementById('win-back-btn').addEventListener('click', () => {
      this.unlockNextLevel();
      this.showWelcome();
    });

    const cards = document.querySelectorAll('.level-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const lvl = parseInt(card.getAttribute('data-level'));
        if (this.isLevelUnlocked(lvl)) {
          this.activeLevel = lvl;
          selectMap(lvl);
          this.updateLevelSelectionUI();
        }
      });
    });

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('Service Worker registered successfully:', reg.scope))
          .catch(err => console.error('Service Worker registration failed:', err));
      });
    }

    // PWA Installation Handler
    let deferredPrompt;
    const installBtn = document.getElementById('pwa-install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (installBtn) {
        installBtn.style.display = 'inline-flex';
      }
    });

    installBtn?.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User choice for PWA installation: ${outcome}`);
      deferredPrompt = null;
      if (installBtn) {
        installBtn.style.display = 'none';
      }
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      if (installBtn) {
        installBtn.style.display = 'none';
      }
    });

    this.updateLevelSelectionUI();
  },

  loadUnlockedLevels() {
    try {
      const saved = localStorage.getItem('jayden_unlocked_levels');
      if (saved) {
        this.unlockedLevels = JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    if (!this.unlockedLevels.length) this.unlockedLevels = [0, 1, 2, 3];
    if (!this.unlockedLevels.includes(3)) this.unlockedLevels.push(3);
  },

  saveUnlockedLevels() {
    try {
      localStorage.setItem('jayden_unlocked_levels', JSON.stringify(this.unlockedLevels));
    } catch (e) {
      console.error(e);
    }
  },

  isLevelUnlocked(lvl) {
    return this.unlockedLevels.includes(lvl);
  },

  unlockNextLevel() {
    const next = this.activeLevel + 1;
    if (next < 3 && !this.unlockedLevels.includes(next)) {
      this.unlockedLevels.push(next);
      this.saveUnlockedLevels();
    }
    this.updateLevelSelectionUI();
  },

  updateLevelSelectionUI() {
    const cards = document.querySelectorAll('.level-card');
    cards.forEach(card => {
      const lvl = parseInt(card.getAttribute('data-level'));
      const statusSpan = card.querySelector('.level-status');
      if (this.isLevelUnlocked(lvl)) {
        card.classList.remove('locked');
        if (statusSpan) {
          statusSpan.textContent = lvl === 3 ? 'Random' : 'Unlocked';
        }
      } else {
        card.classList.add('locked');
        if (statusSpan) statusSpan.textContent = 'Locked';
      }
      if (lvl === this.activeLevel) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  },

  showWelcome() {
    stopGame();
    stopBuilderAnim();
    cleanupGame();
    builderScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    document.getElementById('screen-welcome').classList.add('active');
    this.updateLevelSelectionUI();
  },

  showBuilder() {
    if (switching) return;
    document.getElementById('screen-welcome').classList.remove('active');
    gameScreen.classList.remove('active');
    builderScreen.classList.add('active');
    window.dispatchEvent(new Event('resize'));
    startBuilderAnim();
  },

  async showGame() {
    if (switching) return;
    switching = true;
    stopBuilderAnim();
    cleanupGame();
    builderScreen.classList.remove('active');
    gameScreen.classList.add('active');
    const cfg = getBuilderConfig();
    if (this.activeLevel === 3) {
      selectMap(3);
    }
    await startGame(cfg);
    switching = false;
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
