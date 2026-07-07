import './style.css';
import { Game } from './game';
import { Renderer } from './renderer';
import { InputManager } from './input';
import { initAudio, setSoundEnabled, isSoundEnabled, soundNav } from './audio';
import { renderLBInto, showToast, getShareText } from './ui';
import { loadName, saveName, loadList } from './storage';
import { todayStr } from './rng';

// ─── DOM refs ─────────────────────────────────────────────
const canvas = document.getElementById('game') as HTMLCanvasElement;
const nameInput = document.getElementById('nameInput') as HTMLInputElement;
const namePrompt = document.getElementById('namePrompt')!;
const nameConfirmBtn = document.getElementById('nameConfirmBtn')!;
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
  savedName = n;
  if (n) {
    nameInput.value = n;
  }
});
// Load start screen leaderboard
loadList('lb:daily:' + todayStr()).then((list) => {
  renderLBInto(lbList, list, undefined, 3);
});
game.loadPersistedData();

// ─── Mode selector ────────────────────────────────────────

const MODE_ITEMS: import('./types').GameModeType[] = ['daily', 'free', 'timed', 'survival', 'zen'];
const MODE_GLOW: Record<string, string> = {
  daily: '255,194,77', free: '77,240,224', timed: '255,92,108',
  survival: '251,146,60', zen: '167,139,250',
};
const MODE_DESC: Record<string, string> = {
  daily: 'Desafie o mesmo mapa que todos. Um por dia.',
  free: 'Jogue sem pressão. O ritmo é seu.',
  timed: 'Corra contra o relógio. 30 segundos de puro reflexo.',
  survival: 'Cada erro é fatal. Quantos pulsos você aguenta?',
  zen: 'Sem pontuação, sem fim. Apenas o fluxo.',
};

let savedName = ''; // persisted player name, empty = new player
let selectedIdx = 1; // free is default
let touchSwiped = false; // prevents click-after-swipe on mode-opt buttons // prevents click-after-swipe on mode-opt buttons

const ITEM_W = 200; // px width of each mode-opt
const PEEK = 80; // px of adjacent items visible (was 44, increased for openness)

function focusMode(idx: number): void {
  // Play nav sound only on actual user navigation (not initial render)
  if (idx !== selectedIdx) soundNav();
  const opts = document.querySelectorAll('.mode-opt');
  const container = document.querySelector('.mode-selector') as HTMLElement;
  const cw = container.offsetWidth;

  opts.forEach((el, i) => {
    const elH = el as HTMLElement;
    const offset = i - idx;
    // Calculate carousel position relative to container center
    let tx: number;
    if (offset === 0) {
      tx = 0; // focused: center
    } else if (offset === -1) {
      // previous: right edge at PEEK from container left
      tx = PEEK - ITEM_W / 2 - cw / 2;
    } else if (offset === 1) {
      // next: left edge at cw - PEEK from container left
      tx = cw / 2 - PEEK + ITEM_W / 2;
    } else if (offset < -1) {
      tx = -ITEM_W * 2; // far left, hidden by overflow
    } else {
      tx = ITEM_W * 2; // far right, hidden by overflow
    }
    // Apply transform + appearance
    elH.style.transform = `translate(-50%, -50%) translateX(${tx}px) scale(${offset === 0 ? 1 : 0.82})`;
    elH.style.opacity = String(Math.abs(offset) <= 1 ? (offset === 0 ? 1 : 0.30) : 0);
    elH.style.pointerEvents = Math.abs(offset) <= 1 ? 'auto' : 'none';
    el.classList.toggle('focused', i === idx);
    elH.style.boxShadow = '';
  });
  selectedIdx = idx;
  // Apply glow to focused
  const mode = MODE_ITEMS[idx];
  const focused = opts[idx] as HTMLElement;
  const rgb = MODE_GLOW[mode];
  focused.style.boxShadow = `0 0 28px rgba(${rgb},0.25)`;
  // Update description text with fade
  const descEl = document.getElementById('modeDesc');
  if (descEl) {
    descEl.style.opacity = '0';
    descEl.style.transform = 'translateY(6px)';
    requestAnimationFrame(() => {
      descEl.textContent = MODE_DESC[mode] ?? '';
      descEl.style.opacity = '1';
      descEl.style.transform = 'translateY(0)';
    });
  }
  // Update page indicator dots
  const dots = document.querySelectorAll('.mdot');
  dots.forEach((d, i) => {
    d.classList.toggle('active', i === idx);
    (d as HTMLElement).style.background = i === idx ? `rgb(${rgb})` : '';
  });
}

function startSelectedMode(): void {
  initAudio();
  if (!savedName) {
    // New player: show name prompt before starting
    startScreen.classList.add('hidden');
    namePrompt.classList.remove('hidden');
    nameInput.value = '';
    nameInput.focus();
    return;
  }
  game.beginRun(MODE_ITEMS[selectedIdx]);
  startLoop();
}

function confirmNameAndStart(): void {
  const v = nameInput.value.trim().toUpperCase().slice(0, 10);
  if (!v) {
    nameInput.style.borderColor = 'var(--red)';
    setTimeout(() => nameInput.style.borderColor = '', 600);
    return;
  }
  savedName = v;
  saveName(v);
  namePrompt.classList.add('hidden');
  game.beginRun(MODE_ITEMS[selectedIdx]);
  startLoop();
}

// Click on any mode option selects and starts
const modeOpts = document.querySelectorAll('.mode-opt');
modeOpts.forEach((el, i) => {
  el.addEventListener('click', () => {
    if (touchSwiped) { touchSwiped = false; return; }
    focusMode(i);
    startSelectedMode();
  });
});

// Keyboard navigation
const startScreen = document.getElementById('startScreen')!;
startScreen.setAttribute('tabindex', '-1');
startScreen.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    focusMode(Math.max(0, selectedIdx - 1));
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    focusMode(Math.min(MODE_ITEMS.length - 1, selectedIdx + 1));
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    startSelectedMode();
  }
});

// Name prompt: confirm button + Enter key
nameConfirmBtn.addEventListener('click', confirmNameAndStart);
document.getElementById('nameCancelBtn')!.addEventListener('click', () => {
  namePrompt.classList.add('hidden');
  startScreen.classList.remove('hidden');
  startScreen.focus();
});
nameInput.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    confirmNameAndStart();
  }
});

// Wheel / scroll on the selector (WheelEvent is not in default TS lib, use a listener)
const modeSelector = document.querySelector('.mode-selector')!;
modeSelector.addEventListener('wheel', (e: Event) => {
  const we = e as WheelEvent;
  e.preventDefault();
  if (we.deltaY > 0 || we.deltaX > 0) {
    focusMode(Math.min(MODE_ITEMS.length - 1, selectedIdx + 1));
  } else if (we.deltaY < 0 || we.deltaX < 0) {
    focusMode(Math.max(0, selectedIdx - 1));
  }
}, { passive: false });

// Touch swipe on the selector
let touchStartX = 0;
let touchStartY = 0;
modeSelector.addEventListener('touchstart', (e: Event) => {
  const te = e as TouchEvent;
  touchStartX = te.touches[0].clientX;
  touchStartY = te.touches[0].clientY;
  touchSwiped = false; // safety: reset in case touchend was missed
}, { passive: true });

modeSelector.addEventListener('touchend', (e: Event) => {
  const te = e as TouchEvent;
  const dx = te.changedTouches[0].clientX - touchStartX;
  const dy = te.changedTouches[0].clientY - touchStartY;
  // Only trigger on horizontal swipes (ignore vertical scrolling)
  if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    e.preventDefault();
    touchSwiped = true;
    if (dx < 0) {
      focusMode(Math.min(MODE_ITEMS.length - 1, selectedIdx + 1));
    } else {
      focusMode(Math.max(0, selectedIdx - 1));
    }
  }
}, { passive: false });

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

document.getElementById('menuBtn')!.addEventListener('click', () => {
  document.getElementById('overScreen')?.classList.add('hidden');
  game.mode = 'menu';
  touchSwiped = false;
  const ss = document.getElementById('startScreen');
  ss?.classList.remove('hidden');
  ss?.focus();
  game.reset();
  rafId = requestAnimationFrame(idleLoop);
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
  touchSwiped = false;
  const ss = document.getElementById('startScreen');
  ss?.classList.remove('hidden');
  ss?.focus();
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

// ─── Init carousel + dots position + start idle render ──
// Build mode dots
const dotsEl = document.getElementById('modeDots');
if (dotsEl) {
  MODE_ITEMS.forEach(() => {
    const dot = document.createElement('span');
    dot.className = 'mdot';
    dotsEl.appendChild(dot);
  });
}
// Suppress transition on initial paint to avoid items zooming from center
const modeOptsAll = document.querySelectorAll<HTMLElement>('.mode-opt');
modeOptsAll.forEach(el => el.style.transition = 'none');
const modeDescInit = document.getElementById('modeDesc');
if (modeDescInit) modeDescInit.style.transition = 'none';
focusMode(selectedIdx);
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    modeOptsAll.forEach(el => el.style.transition = '');
    if (modeDescInit) modeDescInit.style.transition = '';
  });
});
rafId = requestAnimationFrame(idleLoop);
startScreen.focus();

// ─── Handle game-over state change ────────────────────────
game.onGameOver = () => {
  // Reload fresh leaderboard data for the start screen too
  loadList('lb:daily:' + todayStr()).then((list) => {
    renderLBInto(lbList, list, undefined, 3);
  });
};
