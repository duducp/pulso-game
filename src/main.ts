import './style.css';
import { Game } from './game';
import { Renderer } from './renderer';
import { InputManager } from './input';
import { initAudio } from './audio';
import { renderLBInto, showToast, getShareText } from './ui';
import { loadName, saveName, loadList } from './storage';
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
game.loadPersistedData();

// ─── Name input ───────────────────────────────────────────
nameInput.addEventListener('blur', () => {
  const v = nameInput.value.trim().toUpperCase().slice(0, 10);
  if (v) {
    saveName(v);
  }
});

// ─── Button bindings ──────────────────────────────────────
document.getElementById('dailyBtn')!.addEventListener('click', () => {
  initAudio();
  game.beginRun(true);
  startLoop();
});

document.getElementById('freeBtn')!.addEventListener('click', () => {
  initAudio();
  game.beginRun(false);
  startLoop();
});

document.getElementById('retryBtn')!.addEventListener('click', () => {
  initAudio();
  game.beginRun(game.dailyMode);
  startLoop();
});

document.getElementById('shareBtn')!.addEventListener('click', () => {
  const text = getShareText(
    game.score,
    game.currentBest,
    game.dailyMode,
    game.breakCount,
    game.maxCombo,
    game.lastRank,
  );
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast()).catch(() => showToast());
  } else {
    showToast();
  }
});

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
