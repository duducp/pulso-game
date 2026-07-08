import type { Game } from './game';

/**
 * Gesture swipe detection helper.
 * Calls onLeft or onRight when a horizontal swipe exceeds threshold.
 */
export function onSwipe(
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

export class InputManager {
  private game: Game;

  constructor(game: Game) {
    this.game = game;
    this.bind();
  }

  private bind(): void {
    window.addEventListener('pointerdown', (e) => this.handlePointer(e));
    window.addEventListener('keydown', (e) => this.handleKey(e));
  }

  private handlePointer(e: PointerEvent): void {
    const target = e.target as HTMLElement;
    const tag = target?.tagName;
    if (tag === 'BUTTON' || tag === 'INPUT') return;
    this.game.pulse();
  }

  private handleKey(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      e.preventDefault();
      this.game.pulse();
    }
  }
}
