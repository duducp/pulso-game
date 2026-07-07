import { initAudio } from './audio';
import { getShareText, showToast } from './ui';
import type { Game } from './game';

export function initGameOverScreen(
  game: Game,
  startLoop: () => void,
  goToMenu: () => void,
  canvas: HTMLCanvasElement,
): void {
  document.getElementById('retryBtn')!.addEventListener('click', () => {
    initAudio();
    game.beginRun(game.modeType);
    startLoop();
    canvas.focus();
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
    goToMenu();
  });
}
