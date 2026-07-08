import { onSwipe } from './helpers';
import { ALL_POWERUP_TYPES, POWERUPS_BY_MODE, POWERUP_ICONS, POWERUP_NAMES, POWERUP_DESC } from './powerups';
import type { PowerUpType } from './types';

// ─── Power-up types ────────────────────────────────────
const PU_TYPES = ALL_POWERUP_TYPES;

let puModalIdx = 0;

function closePuModal(startScreen: HTMLElement): void {
  const puModal = document.getElementById('puModal')!;
  puModal.classList.add('hidden');
  startScreen.focus();
}

function renderPuModalItem(idx: number, getMode: () => string): void {
  const mode = getMode();
  const type = PU_TYPES[idx];
  const available = POWERUPS_BY_MODE[mode as keyof typeof POWERUPS_BY_MODE]?.includes(type as PowerUpType) ?? false;
  const total = PU_TYPES.length;
  const puCard = document.getElementById('puCard')!;

  const dots = PU_TYPES
    .map((_, i) => `<span class="pu-dot${i === idx ? ' active' : ''}"></span>`)
    .join('');

  puCard.innerHTML =
    `<div class="pu-single-wrap">` +
      `<button class="pu-nav-btn" data-dir="-1" aria-label="Anterior" aria-hidden="true">` +
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>` +
      `</button>` +
      `<div class="pu-single-content">` +
        `<div class="pu-big-icon" style="${available ? '' : 'opacity:0.35'}">${POWERUP_ICONS[type]}</div>` +
        `<div class="pu-name">${POWERUP_NAMES[type]}</div>` +
        `<div class="pu-desc">${POWERUP_DESC[type]}</div>` +
        `<div class="pu-dots">${dots}</div>` +
      `</div>` +
      `<button class="pu-nav-btn" data-dir="1" aria-label="Próximo" aria-hidden="true">` +
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>` +
      `</button>` +
    `</div>`;

  puCard.querySelectorAll('.pu-nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = parseInt((btn as HTMLElement).dataset.dir ?? '0', 10);
      puModalIdx = (puModalIdx + dir + total) % total;
      renderPuModalItem(puModalIdx, getMode);
    });
  });
}

function openPuModal(type: string, startScreen: HTMLElement, getMode: () => string): void {
  puModalIdx = PU_TYPES.indexOf(type as any);
  renderPuModalItem(puModalIdx, getMode);
  const puModal = document.getElementById('puModal')!;
  puModal.classList.remove('hidden');
  puModal.focus();
}

/**
 * Initialize the power-up modal — keyboard nav, touch swipe, close handlers.
 * Call once from startScreen init.
 */
export function initPuModal(
  startScreen: HTMLElement,
  getMode: () => string,
  onMpIconClick?: (type: string) => void,
): void {
  const puModal = document.getElementById('puModal')!;
  const puCard = document.getElementById('puCard')!;

  puModal.setAttribute('tabindex', '-1');

  // ── Keyboard navigation ──
  puModal.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePuModal(startScreen);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      puModalIdx = (puModalIdx - 1 + PU_TYPES.length) % PU_TYPES.length;
      renderPuModalItem(puModalIdx, getMode);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      puModalIdx = (puModalIdx + 1) % PU_TYPES.length;
      renderPuModalItem(puModalIdx, getMode);
    }
  });

  // ── Close button ──
  document.getElementById('puModalClose')!.addEventListener('click', () => closePuModal(startScreen));

  // ── Click outside to close ──
  puModal.addEventListener('click', (e) => {
    if (e.target === puModal) {
      closePuModal(startScreen);
    }
  });

  // ── Touch swipe on modal card ──
  onSwipe(
    puCard,
    () => { puModalIdx = (puModalIdx + 1) % PU_TYPES.length; renderPuModalItem(puModalIdx, getMode); },
    () => { puModalIdx = (puModalIdx - 1 + PU_TYPES.length) % PU_TYPES.length; renderPuModalItem(puModalIdx, getMode); },
    40,
  );

  // ── mp-icon click/keyboard ──
  document.querySelectorAll('.mp-icon').forEach((el) => {
    el.addEventListener('click', () => {
      const type = (el as HTMLElement).dataset.puType;
      if (!type) return;
      onMpIconClick?.(type);
      openPuModal(type, startScreen, getMode);
    });
    el.addEventListener('keydown', (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Enter' || ke.key === ' ') {
        ke.preventDefault();
        const type = (el as HTMLElement).dataset.puType;
        if (!type) return;
        onMpIconClick?.(type);
        openPuModal(type, startScreen, getMode);
      }
    });
  });
}
