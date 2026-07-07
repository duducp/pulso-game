// ─── Game Modes ────────────────────────────────────────────
export type GameMode = 'menu' | 'playing' | 'paused' | 'over';

/** The type of gameplay variant. */
export type GameModeType = 'free' | 'daily' | 'timed' | 'survival' | 'zen';

// ─── Power Ups ─────────────────────────────────────────────
export type PowerUpType = 'shield' | 'slowmo' | 'doublepulse' | 'magnet' | 'freeze' | 'plating' | 'autofocus';

export interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  collected: boolean;
  /** Visual bob phase */
  phase: number;
}

// ─── Core Game Objects ─────────────────────────────────────
export interface Player {
  x: number;
  y: number;
  vy: number;
  r: number;
  rot: number;
}

export interface Obstacle {
  x: number;
  gapY: number;
  gapH: number;
  passed: boolean;
  nearCounted: boolean;
  broken?: boolean;
  w: number;
}

export interface TrailPoint {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  r: number;
  life: number;
  type: 'ring' | 'dot' | 'shard' | 'text' | 'powerup' | 'powerup-ring' | 'orb';
  text?: string;
  /** Color override for power-up particles */
  color?: string;
}

// ─── Leaderboard ───────────────────────────────────────────
export interface LeaderboardEntry {
  n: string;
  s: number;
  t: number;
}

// ─── Game State Snapshot (for rendering / UI) ─────────────
export interface GameState {
  mode: GameMode;
  modeType: GameModeType;
  player: Player;
  obstacles: Obstacle[];
  powerUps: PowerUp[];
  particles: Particle[];
  trail: TrailPoint[];
  score: number;
  speed: number;
  gapSize: number;
  bpm: number;
  nearCount: number;
  breakCount: number;
  power: number;
  combo: number;
  maxCombo: number;
  breakMode: boolean;
  breakTimer: number;
  shakeTime: number;
  dailyMode: boolean;
  targetBest: number;
  recordCrossed: boolean;
  tick: number;
  isGameOver: boolean;
  paused: boolean;
  soundEnabled: boolean;
  timeRemaining: number;
  zenFalls: number;
  activePowerUp: PowerUpType | null;
  powerUpTimer: number;
  slowmoMultiplier: number;
  scoreMultiplier: number;
  W: number;
  H: number;
}

// ─── Constants ─────────────────────────────────────────────
export const COLORS = {
  cyan: '#4DF0E0',
  red: '#FF5C6C',
  gold: '#FFC24D',
  ink: '#E9EDF2',
  line: '#1B2130',
  dim: '#5A6478',
  bg: '#090B10',
  purple: '#A78BFA',
  orange: '#FB923C',
  shield: '#5BBAFF',
  slowmo: '#BB86FC',
  doublepulse: '#FF6B9D',
  magnet: '#FFD700',
  freeze: '#00E5FF',
  plating: '#FF8A65',
  autofocus: '#CE93D8',
} as const;

export const POWER_PASS = 16;
export const POWER_NEAR = 30;
export const BREAK_DURATION = 3.2;
export const STEP = 1 / 120;
export const TIMED_DURATION = 30;
export const SURVIVAL_SPEED_MULT = 1.8;

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

