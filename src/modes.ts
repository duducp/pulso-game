import type { GameModeType } from './types';

// ─── Mode Data ─────────────────────────────────────────────

export const MODE_ITEMS: GameModeType[] = ['daily', 'free', 'timed', 'survival', 'zen'];

export const MODE_ICONS: Record<GameModeType, string> = {
  daily: '⚡',
  free: '🎯',
  timed: '⏱️',
  survival: '☠️',
  zen: '🧘',
};

export const MODE_NAMES: Record<GameModeType, string> = {
  daily: 'Desafio Diário',
  free: 'Modo Livre',
  timed: 'Cronometrado',
  survival: 'Sobrevivência',
  zen: 'Zen',
};

export const MODE_LABELS: Record<GameModeType, string> = {
  free: 'MODO LIVRE',
  daily: 'DESAFIO DIÁRIO',
  timed: 'CRONOMETRADO',
  survival: 'SOBREVIVÊNCIA',
  zen: 'ZEN',
};

export const MODE_DESC: Record<GameModeType, string> = {
  daily: 'O mesmo mapa para todos os jogadores. Apenas um desafio por dia — faça valer cada pulso.',
  free: 'Sem pressão, sem fim. Apenas você e o ritmo do jogo.',
  timed: '30 segundos. Seu reflexo contra o tempo. Cada pulso conta.',
  survival: 'Um erro e acabou. Até onde seus reflexos conseguem te levar?',
  zen: 'Sem pontuação, sem game over, sem pressa. Apenas o fluxo.',
};

export const MODE_GLOW: Record<GameModeType, string> = {
  daily: '255,194,77',
  free: '77,240,224',
  timed: '255,92,108',
  survival: '251,146,60',
  zen: '167,139,250',
};

export const MODE_GAMEOVER_LABELS: Record<GameModeType, string> = {
  free: 'até a próxima',
  daily: 'desafio encerrado',
  timed: 'tempo esgotado!',
  survival: 'você tombou',
  zen: 'volte sempre',
};

export const MODE_BEST_KEYS: Record<GameModeType, string> = {
  free: 'profile:best:free',
  daily: 'profile:best:daily:',
  timed: 'profile:best:timed',
  survival: 'profile:best:survival',
  zen: '',
};

export const MODE_LB_TITLES: Record<GameModeType, string> = {
  free: 'Recordes — Livre',
  daily: 'Ranking de hoje',
  timed: 'Recordes — Cronometrado',
  survival: 'Recordes — Sobrevivência',
  zen: '',
};
