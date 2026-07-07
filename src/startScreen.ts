import { initAudio, soundNav } from './audio';
import { MODE_ITEMS, MODE_ICONS, MODE_NAMES, MODE_GLOW, MODE_DESC } from './modes';
import type { PowerUpType } from './types';
import { POWERUPS_BY_MODE, POWERUP_ICONS, POWERUP_NAMES, POWERUP_DESC } from './powerups';
import { saveName } from './storage';
import type { Game } from './game';

// ─── Shared state (exported for main.ts) ─────────────────
export let selectedIdx = 1;
export let savedName = '';
export let touchSwiped = false;

export function setSelectedIdx(v: number): void { selectedIdx = v; }
export function setSavedName(v: string): void { savedName = v; }
export function setTouchSwiped(v: boolean): void { touchSwiped = v; }

// ─── Touch swipe helper ────────────────────────────────────
function onSwipe(
  el: HTMLElement,
  onLeft: () => void,
  onRight: () => void,
  threshold = 30,
  onStart?: () => void,
): void {
  let startX = 0;
  let startY = 0;

  el.addEventListener('touchstart', (e: Event) => {
    const te = e as TouchEvent;
    startX = te.touches[0].clientX;
    startY = te.touches[0].clientY;
    onStart?.();
  }, { passive: true });

  el.addEventListener('touchend', (e: Event) => {
    const te = e as TouchEvent;
    const dx = te.changedTouches[0].clientX - startX;
    const dy = te.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.5) {
      e.preventDefault();
      if (dx < 0) onLeft();
      else onRight();
    }
  }, { passive: false });
}

// ─── Mode selector constants ────────────────────────────
const ITEM_W = 200;
const PEEK = 80;

// ─── Power-up types (shared with modal) ─────────────────
const puTypes: Array<keyof typeof POWERUP_ICONS> = ['shield', 'slowmo', 'doublepulse', 'magnet', 'freeze', 'plating', 'autofocus'];

// ─── Friendly date formatting ───────────────────────────────
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function formatDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const day = parseInt(parts[2], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(day) || isNaN(month)) return isoDate;
  return day + ' ' + MONTHS[month - 1];
}

// ─── Player stats row ──────────────────────────────────────
export function updatePlayerStats(game: Game): void {
  const el = document.getElementById('playerStats');
  if (!el) return;
  const best = game.getBestScores();
  const modes: Array<{ key: keyof typeof best; icon: string }> = [
    { key: 'daily', icon: '⚡' },
    { key: 'free', icon: '🎯' },
    { key: 'timed', icon: '⏱️' },
    { key: 'survival', icon: '☠️' },
  ];
  el.innerHTML = modes
    .map((m, i) => {
      const rec = best[m.key];
      const zeroClass = rec.score === 0 ? ' ps-zero' : '';
      const html =
        `<span class="ps-item${zeroClass}">` +
        `<span class="ps-icon">${m.icon}</span>` +
        `<span class="ps-score">${rec.score.toLocaleString('pt-BR')}</span></span>`;
      return i > 0 ? `<span class="ps-divider">·</span>${html}` : html;
    })
    .join('');
  const tipEl = document.getElementById('psTooltip');
  if (tipEl) {
    tipEl.innerHTML = modes
      .map((m) => {
        const rec = best[m.key];
        const label = MODE_NAMES[m.key];
        if (rec.score === 0) {
          return `<div class="tt-line"><span class="tt-label">${m.icon} ${label}</span><span class="tt-empty">—</span></div>`;
        }
        const dateStr = rec.date ? formatDate(rec.date) : '—';
        return `<div class="tt-line"><span class="tt-label">${m.icon} ${label}</span><span class="tt-score">${rec.score.toLocaleString('pt-BR')}</span><span class="tt-date">📅 ${dateStr}</span></div>`;
      })
      .join('');
  }
}

// ─── Mode carousel ────────────────────────────────────────
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

function startSelectedMode(game: Game, startLoop: () => void, startScreen: HTMLElement): void {
  initAudio();
  if (!savedName) {
    const namePrompt = document.getElementById('namePrompt')!;
    const nameInput = document.getElementById('nameInput') as HTMLInputElement;
    startScreen.classList.add('hidden');
    namePrompt.classList.remove('hidden');
    nameInput.value = '';
    nameInput.focus();
    return;
  }
  game.beginRun(MODE_ITEMS[selectedIdx]);
  startLoop();
}

function confirmNameAndStart(game: Game, startLoop: () => void): void {
  const nameInput = document.getElementById('nameInput') as HTMLInputElement;
  const namePrompt = document.getElementById('namePrompt')!;
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

// ─── Power-up modal ──────────────────────────────────────
let puModalIdx = 0;

function closePuModal(startScreen: HTMLElement): void {
  const puModal = document.getElementById('puModal')!;
  puModal.classList.add('hidden');
  startScreen.focus();
}

function renderPuModalItem(idx: number, game: Game): void {
  const mode = MODE_ITEMS[selectedIdx];
  const type = puTypes[idx] as string;
  const available = POWERUPS_BY_MODE[mode].includes(type as PowerUpType);
  const total = puTypes.length;
  const puCard = document.getElementById('puCard')!;

  const dots = puTypes
    .map((_, i) => `<span class="pu-dot${i === idx ? ' active' : ''}"></span>`)
    .join('');

  puCard.innerHTML =
    `<div class="pu-single-wrap">` +
      `<button class="pu-nav-btn" data-dir="-1" aria-label="Anterior">◀</button>` +
      `<div class="pu-single-content">` +
        `<div class="pu-big-icon" style="${available ? '' : 'opacity:0.35'}">${POWERUP_ICONS[type]}</div>` +
        `<div class="pu-name">${POWERUP_NAMES[type]}</div>` +
        `<div class="pu-desc">${POWERUP_DESC[type]}</div>` +
        `<div class="pu-dots">${dots}</div>` +
      `</div>` +
      `<button class="pu-nav-btn" data-dir="1" aria-label="Próximo">▶</button>` +
    `</div>`;

  puCard.querySelectorAll('.pu-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = parseInt((btn as HTMLElement).dataset.dir ?? '0', 10);
      puModalIdx = (puModalIdx + dir + total) % total;
      renderPuModalItem(puModalIdx, game);
    });
  });
}

function openPuModal(type: string, game: Game, startScreen: HTMLElement): void {
  puModalIdx = puTypes.indexOf(type);
  renderPuModalItem(puModalIdx, game);
  const puModal = document.getElementById('puModal')!;
  puModal.classList.remove('hidden');
  puModal.focus();
}

// ─── Init function (called from main.ts) ────────────────
export function initStartScreen(
  game: Game,
  startLoop: () => void,
): { startScreen: HTMLElement } {
  const startScreen = document.getElementById('startScreen')!;
  const modeSelector = document.querySelector('.mode-selector')!;
  const nameInput = document.getElementById('nameInput') as HTMLInputElement;
  const namePrompt = document.getElementById('namePrompt')!;
  const nameConfirmBtn = document.getElementById('nameConfirmBtn')!;
  const puModal = document.getElementById('puModal')!;
  const puCard = document.getElementById('puCard')!;
  const dotsEl = document.getElementById('modeDots');
  const puEl = document.getElementById('modePowerUps');

  // ── Build power-up HUD indicators ──
  const indicatorsEl = document.getElementById('powerUpIndicators');
  if (indicatorsEl) {
    puTypes.forEach((type) => {
      const div = document.createElement('div');
      div.className = 'pu-indicator';
      div.dataset.type = type;
      div.textContent = POWERUP_ICONS[type];
      indicatorsEl.appendChild(div);
    });
  }

  // ── Details toggle ──
  const toggleBtn = document.getElementById('toggleDetails')!;
  const modeDetails = document.getElementById('modeDetails')!;
  toggleBtn.addEventListener('click', () => {
    const opening = !modeDetails.classList.contains('open');
    modeDetails.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', String(opening));
    toggleBtn.textContent = opening ? '📋 Ocultar' : '📋 Detalhes';
  });

  // ── Tooltip handlers ──
  document.getElementById('psCard')?.addEventListener('click', (e) => {
    const tip = document.getElementById('psTooltip');
    if (!tip) return;
    if (tip.contains(e.target as Node)) return;
    tip.classList.toggle('hidden');
  });
  startScreen.addEventListener('click', (e) => {
    const card = document.getElementById('psCard');
    const tip = document.getElementById('psTooltip');
    if (!card || !tip || tip.classList.contains('hidden')) return;
    if (!card.contains(e.target as Node)) {
      tip.classList.add('hidden');
    }
  });

  // ── Keyboard navigation ──
  startScreen.setAttribute('tabindex', '-1');
  startScreen.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusMode(Math.max(0, selectedIdx - 1), game);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusMode(Math.min(MODE_ITEMS.length - 1, selectedIdx + 1), game);
    } else if (e.key === 'Escape') {
      const tip = document.getElementById('psTooltip');
      if (tip && !tip.classList.contains('hidden')) {
        e.preventDefault();
        tip.classList.add('hidden');
      }
    } else if (e.key >= '1' && e.key <= '5') {
      const idx = parseInt(e.key, 10) - 1;
      e.preventDefault();
      if (idx !== selectedIdx) {
        focusMode(idx, game);
      }
      startSelectedMode(game, startLoop, startScreen);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startSelectedMode(game, startLoop, startScreen);
    }
  });

  // ── Name prompt ──
  nameConfirmBtn.addEventListener('click', () => confirmNameAndStart(game, startLoop));
  document.getElementById('nameCancelBtn')!.addEventListener('click', () => {
    namePrompt.classList.add('hidden');
    startScreen.classList.remove('hidden');
    startScreen.focus();
  });
  nameInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmNameAndStart(game, startLoop);
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
    () => { touchSwiped = true; focusMode(Math.min(MODE_ITEMS.length - 1, selectedIdx + 1), game); },
    () => { touchSwiped = true; focusMode(Math.max(0, selectedIdx - 1), game); },
    30,
    () => { touchSwiped = false; },
  );

  // ── Build carousel buttons ──
  MODE_ITEMS.forEach((mode, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mode-opt' + (i === selectedIdx ? ' focused' : '');
    btn.dataset.mode = mode;
    btn.tabIndex = 0;
    btn.style.setProperty('--mode-rgb', MODE_GLOW[mode]);
    btn.innerHTML = `<span class="mo-icon">${MODE_ICONS[mode]}</span><span class="mo-label">${MODE_NAMES[mode]}</span>`;
    btn.addEventListener('click', () => {
      if (touchSwiped) { touchSwiped = false; return; }
      focusMode(i, game);
      startSelectedMode(game, startLoop, startScreen);
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

  // ── Build power-up icons ──
  if (puEl) {
    const allPwuTypes: Array<keyof typeof POWERUP_ICONS> = ['shield', 'slowmo', 'doublepulse', 'magnet', 'freeze', 'plating', 'autofocus'];
    allPwuTypes.forEach((type) => {
      const span = document.createElement('span');
      span.className = 'mp-icon';
      span.textContent = POWERUP_ICONS[type];
      span.dataset.puType = type;
      span.setAttribute('role', 'button');
      span.tabIndex = 0;
      span.setAttribute('aria-label', POWERUP_NAMES[type] + ' — ' + POWERUP_DESC[type]);
      span.setAttribute('title', POWERUP_NAMES[type]);
      puEl.appendChild(span);
    });
  }

  // ── Power-up modal handlers ──
  puModal.setAttribute('tabindex', '-1');
  puModal.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePuModal(startScreen);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      puModalIdx = (puModalIdx - 1 + puTypes.length) % puTypes.length;
      renderPuModalItem(puModalIdx, game);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      puModalIdx = (puModalIdx + 1) % puTypes.length;
      renderPuModalItem(puModalIdx, game);
    }
  });
  document.getElementById('puModalClose')!.addEventListener('click', () => closePuModal(startScreen));
  puModal.addEventListener('click', (e) => {
    if (e.target === puModal) {
      closePuModal(startScreen);
    }
  });

  // ── Touch swipe on modal card ──
  onSwipe(
    puCard,
    () => { puModalIdx = (puModalIdx + 1) % puTypes.length; renderPuModalItem(puModalIdx, game); },
    () => { puModalIdx = (puModalIdx - 1 + puTypes.length) % puTypes.length; renderPuModalItem(puModalIdx, game); },
    40,
  );

  // ── mp-icon click/keyboard ──
  document.querySelectorAll('.mp-icon').forEach((el) => {
    el.addEventListener('click', () => {
      const type = (el as HTMLElement).dataset.puType;
      if (!type) return;
      openPuModal(type, game, startScreen);
    });
    el.addEventListener('keydown', (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Enter' || ke.key === ' ') {
        ke.preventDefault();
        const type = (el as HTMLElement).dataset.puType;
        if (!type) return;
        openPuModal(type, game, startScreen);
      }
    });
  });

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

  return { startScreen };
}
