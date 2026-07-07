import type { Game } from './game';

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
