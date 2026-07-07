import './style.css';
import { Game } from './game';
import { Renderer } from './renderer';
import { InputManager } from './input';
import { soundUnpause } from './audio';
import { renderLBInto } from './ui';
import { loadName, loadList } from './storage';
import { todayStr } from './rng';
import { initStartScreen, setTouchSwiped, setSavedName, updatePlayerStats } from './startScreen';
import { initGameOverScreen } from './gameOverScreen';
import { initPauseScreen, animatePauseClose } from './pauseScreen';

// ─── DOM refs ─────────────────────────────────────────────
const canvas = document.getElementById('game') as HTMLCanvasElement;
canvas.setAttribute('tabindex', '-1');
const lbList = document.getElementById('lbList')!;

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
    setSavedName(n);
    const nameInput = document.getElementById('nameInput') as HTMLInputElement;
    if (nameInput) nameInput.value = n;
  }
});
loadList('lb:daily:' + todayStr()).then((list) => {
  renderLBInto(lbList, list, undefined, 5);
});
game.loadPersistedData().then(() => updatePlayerStats(game));

// ─── PWA: register service worker ─────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // SW registration failed — app works fine without it
    });
  });
}

// ─── Shared state ─────────────────────────────────────────
let rafId = 0;

function goToMenu(): void {
  game.mode = 'menu';
  setTouchSwiped(false);
  const ss = document.getElementById('startScreen');
  ss?.classList.remove('hidden');
  ss?.focus();
  game.reset();
  rafId = requestAnimationFrame(idleLoop);
}

// ─── Game loop ────────────────────────────────────────────
let last = 0;
let acc = 0;

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

// ─── Init modules ─────────────────────────────────────────
const { startScreen } = initStartScreen(game, startLoop);
initGameOverScreen(game, startLoop, goToMenu, canvas);
initPauseScreen(game, goToMenu, startLoop, canvas);

// ─── Start idle render ───────────────────────────────────
rafId = requestAnimationFrame(idleLoop);
startScreen.focus();

// ─── Escape: voltar ao menu (game over) ou retomar (pause) ─
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return;
  // Pause screen: retomar o jogo com animação de saída
  const ps = document.getElementById('pauseScreen');
  if (ps && !ps.classList.contains('hidden') && !ps.classList.contains('closing')) {
    e.preventDefault();
    e.stopPropagation();
    soundUnpause();
    animatePauseClose(() => {
      document.getElementById('wrap')?.classList.remove('paused');
      game.paused = false;
      game.mode = 'playing';
      canvas.focus();
    });
    return;
  }
  // Game over: voltar ao menu
  const os = document.getElementById('overScreen');
  if (os && !os.classList.contains('hidden')) {
    e.preventDefault();
    os.classList.add('hidden');
    goToMenu();
  }
});

// ─── Handle game-over state change ────────────────────────
game.onGameOver = () => {
  loadList('lb:daily:' + todayStr()).then((list) => {
    renderLBInto(lbList, list, undefined, 3);
  });
  updatePlayerStats(game);
};
