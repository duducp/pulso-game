import './style.css';
import { Game } from './game';
import { Renderer } from './renderer';
import { InputManager } from './input';
import { soundPause, soundUnpause } from './audio';
import { renderLBInto } from './ui';
import { loadName, loadList } from './storage';
import { todayStr } from './helpers';
import { initStartScreen, setTouchSwiped, setSavedName, updatePlayerStats } from './startScreen';
import { initGameOverScreen } from './gameOverScreen';
import { initPauseScreen, animatePauseClose } from './pauseScreen';
import { APP_VERSION, CACHE_NAME } from './version';

// ─── DOM refs ─────────────────────────────────────────────
const canvas = document.getElementById('game') as HTMLCanvasElement;
canvas.setAttribute('tabindex', '-1');
const lbList = document.getElementById('lbList')!;

// ─── Initialize core systems ──────────────────────────────
const renderer = new Renderer(canvas);

function resize(): void {
  renderer.resize();
  if (game) {
    const { w, h } = renderer.getViewportDims();
    game.setDimensions(w, h);
  }
}
window.addEventListener('resize', resize);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resize);
}

// Use viewport dims instead of canvas.clientWidth (can be 0 before first layout)
const { w: initW, h: initH } = renderer.getViewportDims();
const game = new Game(initW, initH);
const input = new InputManager(game);

resize();

// ─── Load persisted data ──────────────────────────────────
const loadedName = loadName();
if (loadedName) {
  setSavedName(loadedName);
  const nameInput = document.getElementById('nameInput') as HTMLInputElement;
  if (nameInput) nameInput.value = loadedName;
}
renderLBInto(lbList, loadList('lb:daily:' + todayStr()), undefined, 5);
game.loadPersistedData().then(() => updatePlayerStats(game));

// ─── PWA: register service worker + cache loaded assets ──
const LOADING_SCREEN = document.getElementById('loadingScreen');

function hideLoading(): void {
  LOADING_SCREEN?.classList.add('hidden');
}

function cacheLoadedResources(): void {
  if (!('caches' in window)) return;
  const origin = location.origin;
  const urls: string[] = [];
  for (const entry of performance.getEntriesByType('resource')) {
    if (entry.name.startsWith(origin + '/')) urls.push(entry.name);
  }
  urls.push(origin + '/fonts/space-grotesk-400.ttf');
  urls.push(origin + '/fonts/space-grotesk-600.ttf');
  urls.push(origin + '/fonts/space-grotesk-700.ttf');
  if (urls.length === 0) return;
  caches.open(CACHE_NAME).then(cache =>
    Promise.allSettled(urls.map(u => cache.add(u).catch(() => {})))
  ).catch(() => {});
}

window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      const sendVersion = () => {
        const sw = reg.installing || reg.waiting || reg.active;
        sw?.postMessage({ type: 'SET_VERSION', version: APP_VERSION });
      };
      if (reg.active) {
        sendVersion();
      } else {
        reg.addEventListener('updatefound', () => {
          reg.installing?.addEventListener('statechange', () => {
            if (reg.installing?.state === 'activated') sendVersion();
          });
        });
      }
    }).catch(() => {});
  }

  if (!('serviceWorker' in navigator) || !('caches' in window)) {
    hideLoading();
    return;
  }

  // Cache all loaded resources once SW is active
  const doCache = () => { cacheLoadedResources(); hideLoading(); };
  if (navigator.serviceWorker.controller) {
    doCache();
  } else {
    navigator.serviceWorker.addEventListener('controllerchange', doCache, { once: true });
  }

  // Fallback: hide loading after 3s regardless
  setTimeout(hideLoading, 3000);
});

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
    return;
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
  renderLBInto(lbList, loadList('lb:daily:' + todayStr()), undefined, 3);
  updatePlayerStats(game);
};

// ─── Pause callback — DOM + sound, called from Game.togglePause ─
game.onPause = () => {
  soundPause();
  document.getElementById('pauseScreen')?.classList.remove('hidden');
  document.getElementById('wrap')?.classList.add('paused');
};

// ─── Begin-run callback — hide start/over screens ────────
game.onBeginRun = () => {
  document.getElementById('startScreen')?.classList.add('hidden');
  document.getElementById('overScreen')?.classList.add('hidden');
};

// ─── Version display + SW update notification ───────────
const versionEl = document.getElementById('appVersion');
if (versionEl) versionEl.textContent = 'v' + APP_VERSION;

if ('serviceWorker' in navigator) {
  let bannerShown = false;
  navigator.serviceWorker.addEventListener('message', (e: MessageEvent) => {
    if (e.data?.type === 'SW_UPDATED' && !bannerShown) {
      bannerShown = true;
      const banner = document.getElementById('updateBanner');
      if (banner) {
        banner.classList.add('visible');
        banner.querySelector('.ub-reload')?.addEventListener('click', () => {
          location.reload();
        });
      }
    }
  });
}
