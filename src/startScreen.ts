import { initAudio } from './audio';
import { MODE_ITEMS, MODE_NAMES } from './modes';
import { POWERUP_ICONS, POWERUP_NAMES, POWERUP_DESC } from './powerups';
import { saveName } from './storage';
import { initPuModal } from './puModal';
import { initCarousel, focusMode, selectedIdx } from './carousel';
import type { Game } from './game';

// ─── Shared state (exported for main.ts) ─────────────────
export let savedName = '';
export let touchSwiped = false;

export function setSavedName(v: string): void { savedName = v; }
export function setTouchSwiped(v: boolean): void { touchSwiped = v; }

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
  const dotsEl = document.getElementById('modeDots');
  const puEl = document.getElementById('modePowerUps');

  // ── Build power-up HUD indicators ──
  const indicatorsEl = document.getElementById('powerUpIndicators');
  if (indicatorsEl) {
    ['life', 'shield', 'slowmo', 'doublepulse', 'magnet', 'freeze', 'plating', 'autofocus'].forEach((type) => {
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

  // ── Build power-up icons ──
  if (puEl) {
    const allPwuTypes: Array<keyof typeof POWERUP_ICONS> = ['life', 'shield', 'slowmo', 'doublepulse', 'magnet', 'freeze', 'plating', 'autofocus'];
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

  // ── Play button ──
  document.getElementById('playBtn')!.addEventListener('click', () => {
    startSelectedMode(game, startLoop, startScreen);
  });

  // ── Init carousel (build buttons + dots + wheel/swipe + initial paint) ──
  initCarousel(modeSelector, dotsEl, game, (v) => { touchSwiped = v; });

  // ── Power-up modal (extracted to puModal.ts) ──
  initPuModal(startScreen, () => MODE_ITEMS[selectedIdx]);

  return { startScreen };
}
