import type { LeaderboardEntry, GameModeType } from './types';

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
  const maxScore = list[0]?.s ?? 1;
  el.innerHTML = list
    .slice(0, limit)
    .map((e, i) => {
      const rank = i + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
      const hl = e.t === highlightTs ? ' highlight' : '';
      const initial = (e.n || '?')[0].toUpperCase();
      const pct = Math.min(100, Math.round((e.s / maxScore) * 100));
      const rankClass = medal ? '' : ' num';
      return (
        `<div class="lbrow${hl}" style="--i:${i}">` +
          `<span class="lb-rank${rankClass}">${medal ?? rank}</span>` +
          `<span class="lb-avatar">${escapeHtml(initial)}</span>` +
          `<span class="lb-info">` +
            `<span class="lb-name">${escapeHtml(e.n || '???')}</span>` +
            `<span class="lb-bar"><span class="lb-bar-fill" style="width:${pct}%"></span></span>` +
          `</span>` +
          `<span class="lb-score">${e.s.toLocaleString('pt-BR')}</span>` +
        `</div>`
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
