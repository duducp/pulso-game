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
  type: 'ring' | 'dot' | 'shard' | 'text' | 'powerup' | 'orb';
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
export const POWERUP_SHIELD_DURATION = 5;
export const POWERUP_SLOWMO_DURATION = 3;
export const POWERUP_DOUBLE_DURATION = 5;
export const POWERUP_SLOWMO_FACTOR = 0.5;
export const POWERUP_DOUBLE_FACTOR = 2;
export const POWERUP_MAGNET_DURATION = 5;
export const MAGNET_ORBS_PER_PASS = 2;
export const POWERUP_FREEZE_DURATION = 4;
export const POWERUP_PLATING_DURATION = 3;
export const POWERUP_AUTOFOCUS_DURATION = 3;

// Which power-ups are available per game mode
export const POWERUPS_BY_MODE: Record<GameModeType, PowerUpType[]> = {
  free: ['shield', 'slowmo', 'doublepulse', 'magnet'],
  daily: ['shield', 'slowmo', 'doublepulse', 'magnet'],
  timed: ['shield', 'slowmo', 'doublepulse', 'magnet', 'freeze'],
  survival: ['shield', 'slowmo', 'doublepulse', 'magnet', 'plating'],
  zen: ['shield', 'slowmo', 'doublepulse', 'magnet', 'autofocus'],
};

// Spawn weights (higher = more likely)
export const POWERUP_WEIGHTS: Record<PowerUpType, number> = {
  shield: 35,
  slowmo: 15,
  doublepulse: 30,
  magnet: 20,
  freeze: 15,
  plating: 15,
  autofocus: 15,
};
