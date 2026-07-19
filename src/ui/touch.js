const isMobileOrTablet = window.matchMedia('(max-width: 1024px)').matches || window.matchMedia('(hover: none) and (pointer: coarse)').matches;

export function isMobile() {
  return isMobileOrTablet;
}

let _touchKeys = {};

export function getTouchKeys() {
  return _touchKeys;
}

export function setupTouchControls(keys) {
  _touchKeys = keys;

  const touchSetup = (btnId, keyName) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const press = e => { e.preventDefault(); keys[keyName] = true; };
    const release = e => { e.preventDefault(); keys[keyName] = false; };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('pointerup', release);
    btn.addEventListener('touchend', release, { passive: false });
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('touchcancel', release, { passive: false });
    btn.addEventListener('pointerout', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('contextmenu', e => e.preventDefault());
  };

  touchSetup('btn-forward', 'arrowup');
  touchSetup('btn-back', 'arrowdown');
  touchSetup('btn-turn-left', 'arrowleft');
  touchSetup('btn-turn-right', 'arrowright');

  const touchControls = document.getElementById('touch-controls');
  touchControls?.addEventListener('contextmenu', e => e.preventDefault());
}
