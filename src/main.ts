import './style.css';
import { Game } from './game';
import { Renderer } from './renderer';
import { InputManager } from './input';
import { initAudio, setSoundEnabled, isSoundEnabled } from './audio';
import { renderLBInto, showToast, getShareText } from './ui';
import { loadName, saveName, loadList, loadBest } from './storage';
import { todayStr } from './rng';

// ─── DOM refs ─────────────────────────────────────────────
const canvas = document.getElementById('game') as HTMLCanvasElement;
const nameInput = document.getElementById('nameInput') as HTMLInputElement;
const lbList = document.getElementById('lbList')!;
const lbList2 = document.getElementById('lbList2')!;

// ─── Initialize core systems ──────────────────────────────
const renderer = new Renderer(canvas);

function resize(): void {
  renderer.resize();
  if (game) game.setDimensions(canvas.clientWidth, canvas.clientHeight);
}
window.addEventListener('resize', resize);

const game = new Game(canvas.clientWidth, canvas.clientHeight);
const input = new InputManager(game);

resize();

// ─── Load persisted data ──────────────────────────────────
loadName().then((n) => {
  if (n) {
    nameInput.value = n;
  }
});
loadList('lb:daily:' + todayStr()).then((list) => {
  renderLBInto(lbList, list);
});
// Load best scores for start screen stats
Promise.all([
  loadBest('profile:best:free'),
  loadBest('profile:best:timed'),
  loadBest('profile:best:survival'),
]).then(([free, timed, survival]) => {
  const elFree = document.getElementById('statFree');
  const elTimed = document.getElementById('statTimed');
  const elSurvival = document.getElementById('statSurvival');
  if (elFree) elFree.textContent = String(free);
  if (elTimed) elTimed.textContent = String(timed);
  if (elSurvival) elSurvival.textContent = String(survival);
});
game.loadPersistedData();

// ─── Name input ───────────────────────────────────────────
nameInput.addEventListener('blur', () => {
  const v = nameInput.value.trim().toUpperCase().slice(0, 10);
  if (v) {
    saveName(v);
  }
});

// ─── Button bindings ──────────────────────────────────────
function startMode(mode: import('./types').GameModeType): void {
  initAudio();
  game.beginRun(mode);
  startLoop();
}

document.getElementById('dailyBtn')!.addEventListener('click', () => startMode('daily'));
document.getElementById('freeBtn')!.addEventListener('click', () => startMode('free'));
document.getElementById('timedBtn')!.addEventListener('click', () => startMode('timed'));
document.getElementById('survivalBtn')!.addEventListener('click', () => startMode('survival'));
document.getElementById('zenBtn')!.addEventListener('click', () => startMode('zen'));

document.getElementById('retryBtn')!.addEventListener('click', () => {
  initAudio();
  game.beginRun(game.modeType);
  startLoop();
});

document.getElementById('shareBtn')!.addEventListener('click', () => {
  const text = getShareText(
    game.score,
    game.currentBest,
    game.modeType,
    game.breakCount,
    game.maxCombo,
    game.lastRank,
    Math.round(game.tick),
  );
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast()).catch(() => showToast());
  } else {
    showToast();
  }
});

// ─── Pause screen buttons ─────────────────────────────────
const pauseScreen = document.getElementById('pauseScreen')!;

function closePauseOverlay(): void {
  pauseScreen.classList.remove('visible');
  setTimeout(() => {
    game.paused = false;
    game.mode = 'playing';
    document.getElementById('wrap')?.classList.remove('paused');
  }, 250);
}

document.getElementById('resumeBtn')!.addEventListener('click', () => {
  closePauseOverlay();
});

document.getElementById('restartBtn')!.addEventListener('click', () => {
  pauseScreen.classList.remove('visible');
  document.getElementById('wrap')?.classList.remove('paused');
  game.paused = false;
  initAudio();
  game.beginRun(game.modeType);
  startLoop();
});

document.getElementById('quitBtn')!.addEventListener('click', () => {
  pauseScreen.classList.remove('visible');
  document.getElementById('wrap')?.classList.remove('paused');
  game.paused = false;
  game.mode = 'menu';
  document.getElementById('startScreen')?.classList.remove('hidden');
  game.reset();
  rafId = requestAnimationFrame(idleLoop);
});

const soundToggleBtn = document.getElementById('soundToggleBtn')!;
function updateSoundToggleUI(): void {
  soundToggleBtn.textContent = isSoundEnabled() ? '🔊 Som: ligado' : '🔇 Som: desligado';
}
soundToggleBtn.addEventListener('click', () => {
  setSoundEnabled(!isSoundEnabled());
  updateSoundToggleUI();
});
updateSoundToggleUI();

// ─── Game loop ────────────────────────────────────────────
let last = 0;
let acc = 0;
let rafId = 0;

function startLoop(): void {
  if (rafId) cancelAnimationFrame(rafId);
  last = performance.now();
  acc = 0;
  loop(last);
}

function loop(now: number): void {
  if (game.mode !== 'playing') {
    rafId = requestAnimationFrame(idleLoop);
    return;
  }

  let dt = (now - last) / 1000;
  last = now;
  dt = Math.min(dt, 0.1);
  acc += dt;

  const STEP = 1 / 120;
  while (acc >= STEP) {
    game.update(STEP);
    acc -= STEP;
  }

  renderer.render(game.getState());
  rafId = requestAnimationFrame(loop);
}

function idleLoop(now: number): void {
  if (game.mode === 'playing') {
    rafId = requestAnimationFrame(loop);
    return;
  }
  renderer.idleRender(performance.now() / 1000);
  rafId = requestAnimationFrame(idleLoop);
}

// ─── Start idle render ────────────────────────────────────
rafId = requestAnimationFrame(idleLoop);

// ─── Handle game-over state change ────────────────────────
game.onGameOver = () => {
  // Reload fresh leaderboard data for the start screen too
  loadList('lb:daily:' + todayStr()).then((list) => {
    renderLBInto(lbList, list);
  });
};
