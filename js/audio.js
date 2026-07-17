let audioCtx = null;
let engineOsc = null;
let engineGain = null;

function initAudio() {
  if (audioCtx) return;
  // Initialize standard browser AudioContext on first play
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

export const AudioSystem = {
  playLaser() {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  },

  playExplosion() {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Synthesize noise for explosion
    const bufferSize = audioCtx.sampleRate * 0.45;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(12, audioCtx.currentTime + 0.45);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    noise.start();
    noise.stop(audioCtx.currentTime + 0.45);
  },

  startEngine() {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (engineOsc) return;

    engineOsc = audioCtx.createOscillator();
    engineGain = audioCtx.createGain();

    engineOsc.type = 'triangle';
    engineOsc.frequency.setValueAtTime(45, audioCtx.currentTime);

    engineGain.gain.setValueAtTime(0.04, audioCtx.currentTime);

    engineOsc.connect(engineGain);
    engineGain.connect(audioCtx.destination);

    engineOsc.start();
  },

  updateEngine(speedRatio) {
    if (!audioCtx || !engineOsc) return;
    // Map velocity ratio to pitch and volume
    const targetFreq = 45 + Math.abs(speedRatio) * 95;
    engineOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.05);

    const targetGain = 0.02 + Math.abs(speedRatio) * 0.06;
    engineGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.05);
  },

  stopEngine() {
    if (engineOsc) {
      try {
        engineOsc.stop();
        engineOsc.disconnect();
        engineGain.disconnect();
      } catch (e) {}
      engineOsc = null;
      engineGain = null;
    }
  },

  playGoal() {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const t = audioCtx.currentTime;
    const playNote = (freq, start, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + start);
      gain.gain.setValueAtTime(0.12, t + start);
      gain.gain.exponentialRampToValueAtTime(0.005, t + start + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t + start);
      osc.stop(t + start + duration);
    };

    playNote(261.63, 0.0, 0.15); // C4
    playNote(329.63, 0.1, 0.15); // E4
    playNote(392.00, 0.2, 0.15); // G4
    playNote(523.25, 0.3, 0.4);  // C5
  }
};
