import { gameProgress, config, closestColorIndex, PRIMARY_COLORS, getConfig } from './core/state.js';
import { init as initBuilder, cleanup as cleanupBuilder, startAnim as startBuilderAnim, stopAnim as stopBuilderAnim } from './screens/builder.js';
import { init as initGame, start as startGame, stop as stopGame, cleanup as cleanupGame } from './screens/game.js';
import { selectMap } from './world/maps.js';

const builderScreen = document.getElementById('screen-builder');
const gameScreen = document.getElementById('screen-game');
const welcomeScreen = document.getElementById('screen-welcome');

let switching = false;

export const App = {
  init() {
    gameProgress.load();

    initBuilder();
    initGame();

    document.getElementById('enter-garage-btn').addEventListener('click', () => this.showBuilder());
    document.getElementById('launch-btn').addEventListener('click', () => this.showGame());
    document.getElementById('back-btn').addEventListener('click', () => this.showWelcome());

    document.getElementById('win-back-btn').addEventListener('click', () => {
      gameProgress.unlockNext();
      this.showWelcome();
    });

    const cards = document.querySelectorAll('.level-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const lvl = parseInt(card.getAttribute('data-level'));
        if (gameProgress.isUnlocked(lvl)) {
          gameProgress.activeLevel = lvl;
          selectMap(lvl);
          this.updateLevelSelectionUI();
        }
      });
    });

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('SW registered:', reg.scope))
          .catch(err => console.error('SW registration failed:', err));
      });
    }

    let deferredPrompt;
    const installBtn = document.getElementById('pwa-install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (installBtn) installBtn.style.display = 'inline-flex';
    });

    installBtn?.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA install choice: ${outcome}`);
      deferredPrompt = null;
      if (installBtn) installBtn.style.display = 'none';
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA installed');
      if (installBtn) installBtn.style.display = 'none';
    });

    this.updateLevelSelectionUI();
  },

  updateLevelSelectionUI() {
    const cards = document.querySelectorAll('.level-card');
    cards.forEach(card => {
      const lvl = parseInt(card.getAttribute('data-level'));
      const statusSpan = card.querySelector('.level-status');
      card.classList.remove('locked');
      if (statusSpan) statusSpan.textContent = lvl === 3 ? 'Random' : lvl === 4 ? 'Sweep' : 'Unlocked';
      if (lvl === gameProgress.activeLevel) {
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
    welcomeScreen.classList.add('active');
    this.updateLevelSelectionUI();
  },

  showBuilder() {
    if (switching) return;
    welcomeScreen.classList.remove('active');
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
    const cfg = getConfig();
    if (gameProgress.activeLevel === 3) {
      selectMap(3);
    } else if (gameProgress.activeLevel === 4) {
      selectMap(4);
    }
    await startGame(cfg);
    switching = false;
  },
};
