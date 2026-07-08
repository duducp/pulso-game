import { MODE_ITEMS, MODE_ICONS, MODE_NAMES, MODE_GLOW, MODE_DESC } from './modes';
import { POWERUPS_BY_MODE } from './powerups';
import { initAudio, soundNav } from './audio';
import { onSwipe } from './input';
import type { Game } from './game';

// ─── Carousel constants ─────────────────────────────────
const ITEM_W = 200;
const PEEK = 80;

/** Carousel state — shared with startScreen.ts so callers can read the selected index. */
export let selectedIdx = 1;

export function setSelectedIdx(v: number): void { selectedIdx = v; }

/**
 * Focus a carousel item by index — animates positions, updates description,
 * dots, and power-up active indicators.
 */
export function focusMode(idx: number, game: Game): void {
  if (idx !== selectedIdx) {
    initAudio();
    soundNav();
  }
  const opts = document.querySelectorAll('.mode-opt');
  const container = document.querySelector('.mode-selector') as HTMLElement;
  const cw = container.offsetWidth;

  opts.forEach((el, i) => {
    const elH = el as HTMLElement;
    const offset = i - idx;
    let tx: number;
    if (offset === 0) {
      tx = 0;
    } else if (offset === -1) {
      tx = PEEK - ITEM_W / 2 - cw / 2;
    } else if (offset === 1) {
      tx = cw / 2 - PEEK + ITEM_W / 2;
    } else if (offset < -1) {
      tx = -ITEM_W * 2;
    } else {
      tx = ITEM_W * 2;
    }
    elH.style.transform = `translate(-50%, -50%) translateX(${tx}px) scale(${offset === 0 ? 1 : 0.82})`;
    elH.style.opacity = String(Math.abs(offset) <= 1 ? (offset === 0 ? 1 : 0.30) : 0);
    elH.style.pointerEvents = Math.abs(offset) <= 1 ? 'auto' : 'none';
    el.classList.toggle('focused', i === idx);
    elH.style.boxShadow = '';
  });
  selectedIdx = idx;
  const mode = MODE_ITEMS[idx];
  const rgb = MODE_GLOW[mode];

  // Update description
  const descEl = document.getElementById('modeDesc');
  if (descEl) {
    descEl.style.setProperty('--mode-rgb', rgb);
    descEl.style.opacity = '0';
    descEl.style.transform = 'translateY(6px)';
    requestAnimationFrame(() => {
      descEl.innerHTML = `<span class="desc-icon">${MODE_ICONS[mode]}</span>${MODE_DESC[mode] ?? ''}`;
      descEl.style.opacity = '1';
      descEl.style.transform = 'translateY(0)';
    });
  }

  // Update dots
  const dots = document.querySelectorAll('.mdot');
  dots.forEach((d, i) => {
    d.classList.toggle('active', i === idx);
    (d as HTMLElement).style.background = i === idx ? `rgb(${rgb})` : '';
  });

  // Update power-ups color + active state
  const puContainer = document.getElementById('modePowerUps');
  if (puContainer) puContainer.style.setProperty('--mode-rgb', rgb);
  const pwrTypes = POWERUPS_BY_MODE[mode];
  const mpIcons = document.querySelectorAll('.mp-icon');
  mpIcons.forEach((el) => {
    const type = (el as HTMLElement).dataset.puType;
    el.classList.toggle('active', type ? pwrTypes.includes(type as any) : false);
  });
}

/**
 * Build carousel buttons and dots, attach keyboard/wheel/swipe navigation,
 * then paint the initial focused state (suppressing transitions for the first frame).
 */
export function initCarousel(
  modeSelector: Element,
  dotsEl: HTMLElement | null,
  game: Game,
  onTouchSwiped: (v: boolean) => void,
  onPlay?: () => void,
): void {
  // ── Build carousel buttons ──
  let swipeGuard = false;
  MODE_ITEMS.forEach((mode, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mode-opt' + (i === selectedIdx ? ' focused' : '');
    btn.dataset.mode = mode;
    btn.tabIndex = 0;
    btn.style.setProperty('--mode-rgb', MODE_GLOW[mode]);
    const lives = (mode === 'survival' || mode === 'timed') ? '<span class="mo-lives">❤️</span>' : '';
    btn.innerHTML = `<span class="mo-icon">${MODE_ICONS[mode]}</span><span class="mo-label">${MODE_NAMES[mode]}</span>${lives}`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (swipeGuard) { swipeGuard = false; return; }
      const wasFocused = i === selectedIdx;
      focusMode(i, game);
      if (wasFocused) onPlay?.();
    });
    modeSelector.appendChild(btn);
  });

  // ── Build dots ──
  if (dotsEl) {
    MODE_ITEMS.forEach(() => {
      const dot = document.createElement('span');
      dot.className = 'mdot';
      dotsEl.appendChild(dot);
    });
  }

  // ── Click zones on mode-selector ──
  modeSelector.addEventListener('click', (e: Event) => {
    const me = e as MouseEvent;
    const rect = modeSelector.getBoundingClientRect();
    const x = (me.clientX - rect.left) / rect.width;
    if (x < 0.35) {
      focusMode(Math.max(0, selectedIdx - 1), game);
    } else if (x > 0.65) {
      focusMode(Math.min(MODE_ITEMS.length - 1, selectedIdx + 1), game);
    }
  });

  // ── Wheel / scroll ──
  modeSelector.addEventListener('wheel', (e: Event) => {
    const we = e as WheelEvent;
    e.preventDefault();
    if (we.deltaY > 0 || we.deltaX > 0) {
      focusMode(Math.min(MODE_ITEMS.length - 1, selectedIdx + 1), game);
    } else if (we.deltaY < 0 || we.deltaX < 0) {
      focusMode(Math.max(0, selectedIdx - 1), game);
    }
  }, { passive: false });

  // ── Touch swipe on selector ──
  onSwipe(
    modeSelector as HTMLElement,
    () => { swipeGuard = true; onTouchSwiped(true); focusMode(Math.min(MODE_ITEMS.length - 1, selectedIdx + 1), game); },
    () => { swipeGuard = true; onTouchSwiped(true); focusMode(Math.max(0, selectedIdx - 1), game); },
    30,
    () => { swipeGuard = false; onTouchSwiped(false); },
  );

  // ── Initial paint: suppress transitions ──
  const modeOptsAll = document.querySelectorAll<HTMLElement>('.mode-opt');
  modeOptsAll.forEach(el => el.style.transition = 'none');
  const modeDescInit = document.getElementById('modeDesc');
  if (modeDescInit) modeDescInit.style.transition = 'none';
  focusMode(selectedIdx, game);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modeOptsAll.forEach(el => el.style.transition = '');
      if (modeDescInit) modeDescInit.style.transition = '';
    });
  });
}
