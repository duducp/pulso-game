// ─── Audio Context (lazy singleton) ────────────────────────
let audioCtx: AudioContext | null = null;

export function initAudio(): void {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
}

function playTone(freq: number, duration: number, type: OscillatorType, volume = 0.15): void {
  if (!audioCtx) return;
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
}
