// ─── Audio Context (lazy singleton) ────────────────────────
let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}


export function initAudio(): void {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
}

function playTone(freq: number, duration: number, type: OscillatorType, volume = 0.15): void {
  if (!audioCtx || !soundEnabled) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // audio not available
  }
}

/** Short burst of noise with exponential decay — for spark/crackle effects */
function playNoiseBurst(duration: number, volume: number): void {
  if (!audioCtx || !soundEnabled) return;
  try {
    const sampleRate = audioCtx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    if (length < 1) return;
    const buffer = audioCtx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-4 * i / length);
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    source.connect(gain);
    gain.connect(audioCtx.destination);
    source.start();
  } catch {
    // audio not available
  }
}

export function soundPulse(): void {
  playTone(520, 0.12, 'sine', 0.12);
}

export function soundBreak(): void {
  playTone(220, 0.25, 'sawtooth', 0.18);
  setTimeout(() => playTone(320, 0.2, 'sawtooth', 0.15), 100);
}

export function soundRecord(): void {
  playTone(660, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(880, 0.1, 'sine', 0.1), 120);
  setTimeout(() => playTone(1100, 0.15, 'sine', 0.1), 240);
}

export function soundGameOver(): void {
  playTone(300, 0.3, 'sine', 0.1);
  setTimeout(() => playTone(200, 0.4, 'sine', 0.1), 250);
}

export function soundNear(): void {
  playTone(800, 0.06, 'sine', 0.06);
  playNoiseBurst(0.04, 0.04); // subtle spark crackle
}

export function soundPause(): void {
  playTone(300, 0.15, 'sine', 0.04);
  setTimeout(() => playTone(250, 0.2, 'sine', 0.03), 80);
}

export function soundUnpause(): void {
  playTone(350, 0.1, 'sine', 0.03);
  setTimeout(() => playTone(420, 0.15, 'sine', 0.04), 60);
}

export function soundPowerUp(): void {
  playTone(600, 0.08, 'sine', 0.08);
  setTimeout(() => playTone(800, 0.08, 'sine', 0.08), 80);
  setTimeout(() => playTone(1000, 0.1, 'sine', 0.07), 160);
}

export function soundOrbCollect(): void {
  playTone(1200, 0.06, 'sine', 0.04);
}

export function soundNav(): void {
  playTone(880, 0.04, 'sine', 0.03);
}

export function soundBounce(): void {
  playTone(120, 0.08, 'sine', 0.04);
  playNoiseBurst(0.03, 0.025);
}
