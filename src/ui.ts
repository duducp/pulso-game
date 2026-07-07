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
): void {
  if (!list || list.length === 0) {
    el.innerHTML =
      '<div class="lbempty">Seja o primeiro a marcar um pulso hoje.</div>';
    return;
  }
  el.innerHTML = list
    .slice(0, 5)
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

export function getShareText(
  score: number,
  currentBest: number,
  dailyMode: boolean,
  breakCount: number,
  maxCombo: number,
  lastRank: number | null,
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
  const url = window.location.href;

  if (dailyMode) {
    const today = new Date();
    const label =
      String(today.getDate()).padStart(2, '0') +
      '/' +
      String(today.getMonth() + 1).padStart(2, '0');
    return (
      '💓 Desafio de hoje (' +
      label +
      ') no PULSO: ' +
      score +
      ' pulsos' +
      comboText +
      breaksTxt +
      (lastRank ? ' — #' + lastRank + ' no ranking' : '') +
      '. Bate meu recorde: ' +
      url
    );
  }

  return (
    '💓 Fiz ' +
    score +
    ' pulsos no PULSO (recorde: ' +
    currentBest +
    ')' +
    comboText +
    breaksTxt +
    '. Bate meu recorde: ' +
    url
  );
}
