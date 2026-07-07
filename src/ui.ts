import type { LeaderboardEntry } from './types';

export function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return String(s).replace(/[&<>"']/g, (c) => map[c] ?? c);
}

export function renderLBInto(
  el: HTMLElement,
  list: LeaderboardEntry[],
  highlightTs?: number,
  limit = 5,
): void {
  if (!list || list.length === 0) {
    el.innerHTML =
      '<div class="lbempty">Seja o primeiro a marcar um pulso hoje.</div>';
    return;
  }
  el.innerHTML = list
    .slice(0, limit)
    .map((e, i) => {
      const hl = e.t === highlightTs ? 'style="color:#FFC24D"' : '';
      return (
        '<div class="lbrow" ' +
        hl +
        '>' +
        '<span><span class="n">' +
        (i + 1) +
        'º</span>' +
        escapeHtml(e.n || '???') +
        '</span>' +
        '<span class="s">' +
        e.s +
        '</span></div>'
      );
    })
    .join('');
}

export function showToast(duration = 1800): void {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

import type { GameModeType } from './types';

export function getShareText(
  score: number,
  currentBest: number,
  modeType: GameModeType,
  breakCount: number,
  maxCombo: number,
  lastRank: number | null,
  playTime?: number,
): string {
  const breaksTxt =
    breakCount > 0
      ? ' e quebrei ' +
        breakCount +
        ' parede' +
        (breakCount > 1 ? 's' : '') +
        ' no modo ruptura 💥'
      : '';
  const comboText = maxCombo > 1 ? ' (maior combo: x' + maxCombo + ')' : '';
  const rankTxt = lastRank ? ' — #' + lastRank + ' no ranking' : '';
  const url = window.location.href;

  const modePrefixes: Record<GameModeType, string> = {
    free: '💓 Fiz ' + score + ' pulsos no PULSO (recorde: ' + currentBest + ')',
    daily: '💓 Desafio de hoje no PULSO: ' + score + ' pulsos',
    timed: '💓 Modo cronometrado: ' + score + ' pulsos em 30s (recorde: ' + currentBest + ')',
    survival: '💓 Modo sobrevivência: ' + score + ' pulsos (recorde: ' + currentBest + ')',
    zen: '💓 Modo zen no PULSO: ' + score + ' pulsos em ' + (playTime ?? 0) + 's',
  };

  return (
    modePrefixes[modeType] +
    comboText +
    breaksTxt +
    rankTxt +
    '. Bate meu recorde: ' +
    url
  );
}
