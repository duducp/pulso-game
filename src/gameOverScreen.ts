import { initAudio } from './audio';
import { getShareText, showToast } from './ui';
import { MODE_GAMEOVER_LABELS, MODE_LB_TITLES } from './modes';
import { todayStr } from './rng';
import type { GameModeType } from './types';
import type { Game } from './game';

/** Stats to display on the game-over screen. */
export interface GameOverStats {
  score: number;
  currentBest: number;
  bpm: number;
  nearCount: number;
  breakCount: number;
  maxCombo: number;
  tick: number;
  zenFalls: number;
  reviveCount: number;
  modeType: GameModeType;
}

/**
 * Update all DOM elements on the game-over screen with the given stats.
 * Pure DOM — no game logic, no side effects.
 */
export function renderGameOverStats(stats: GameOverStats): void {
  const byId = (id: string) => document.getElementById(id);

  byId('finalScore')!.textContent = String(stats.score);
  byId('finalBest')!.textContent = String(stats.currentBest);
  byId('finalBpm')!.textContent = String(Math.round(stats.bpm));
  byId('finalNear')!.textContent = String(stats.nearCount);
  byId('finalBreaks')!.textContent = String(stats.breakCount);
  byId('finalCombo')!.textContent = String(stats.maxCombo);
  byId('finalTime')!.textContent = String(Math.round(stats.tick));
  byId('finalFalls')!.textContent = String(stats.zenFalls);
  byId('finalRevives')!.textContent = String(stats.reviveCount);

  // Show/hide mode-specific stats
  const isZen = stats.modeType === 'zen';
  byId('statTime')!.style.display = isZen ? 'flex' : 'none';
  byId('statFalls')!.style.display = isZen ? 'flex' : 'none';

  // Over label
  const overLabel = byId('overLabel');
  if (overLabel) {
    const base = MODE_GAMEOVER_LABELS[stats.modeType];
    if (stats.modeType === 'daily') {
      overLabel.textContent = 'desafio de ' + todayStr().slice(5, 10).replace('-', '/');
    } else {
      overLabel.textContent = base;
    }
  }

  // Leaderboard title
  const lbTitle2 = byId('lbTitle2');
  if (lbTitle2) {
    lbTitle2.textContent = MODE_LB_TITLES[stats.modeType];
    lbTitle2.style.display = isZen ? 'none' : 'block';
  }
}

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
