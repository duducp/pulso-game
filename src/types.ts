// ─── Game Modes ────────────────────────────────────────────
export type GameMode = 'menu' | 'playing' | 'paused' | 'over';

/** The type of gameplay variant. */
export type GameModeType = 'free' | 'daily' | 'timed' | 'survival' | 'zen';

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
  type: 'ring' | 'dot' | 'shard' | 'text';
  text?: string;
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
} as const;

export const POWER_PASS = 16;
export const POWER_NEAR = 30;
export const BREAK_DURATION = 3.2;
export const STEP = 1 / 120;
export const TIMED_DURATION = 30; // seconds
export const SURVIVAL_SPEED_MULT = 1.8;
