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

/** Get reliable viewport dimensions — prefers visualViewport on mobile */
function getViewportDims(): { w: number; h: number } {
  const vv = window.visualViewport;
  if (vv && vv.width > 0 && vv.height > 0) {
    return { w: vv.width, h: vv.height };
  }
  return { w: window.innerWidth, h: window.innerHeight };
}

function resize(): void {
  renderer.resize();
  if (game) {
    const { w, h } = getViewportDims();
    game.setDimensions(w, h);
  }
}
window.addEventListener('resize', resize);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resize);
}

// Use viewport dims instead of canvas.clientWidth (can be 0 before first layout)
const { w: initW, h: initH } = getViewportDims();
const game = new Game(initW, initH);
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
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  game.mode = 'menu';
  setTouchSwiped(false);
  canvas.classList.add('hidden');
  const ss = document.getElementById('startScreen');
  ss?.classList.remove('hidden');
  ss?.focus();
  game.reset();
}

// ─── Game loop ────────────────────────────────────────────
let last = 0;
let acc = 0;

function startLoop(): void {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  canvas.classList.remove('hidden');
  const ss = document.getElementById('startScreen');
  ss?.classList.add('hidden');
  last = performance.now();
  acc = 0;
  rafId = requestAnimationFrame(loop);
}

function loop(now: number): void {
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

  if (game.mode === 'over' || game.mode === 'menu') {
    if (game.mode === 'menu') canvas.classList.add('hidden');
    rafId = 0;
    return;
  }

  rafId = requestAnimationFrame(loop);
}

// ─── Init modules ─────────────────────────────────────────
const { startScreen } = initStartScreen(game, startLoop);
initGameOverScreen(game, startLoop, goToMenu, canvas);
initPauseScreen(game, goToMenu, startLoop, canvas);

// ─── Start idle render ───────────────────────────────────
canvas.classList.add('hidden');
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

// ─── Pause button (mobile) ──────────────────────────────
document.getElementById('pauseBtn')!.addEventListener('click', () => {
  const ps = document.getElementById('pauseScreen');
  if (game.mode === 'playing') {
    game.togglePause();
  } else if (game.mode === 'paused' && ps && !ps.classList.contains('closing')) {
    soundUnpause();
    animatePauseClose(() => {
      document.getElementById('wrap')?.classList.remove('paused');
      game.paused = false;
      game.mode = 'playing';
      canvas.focus();
    });
  }
});

// ─── Handle game-over state change ────────────────────────
game.onGameOver = () => {
  loadList('lb:daily:' + todayStr()).then((list) => {
    renderLBInto(lbList, list, undefined, 3);
  });
  updatePlayerStats(game);
};
