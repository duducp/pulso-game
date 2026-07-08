// ─── Game Modes ────────────────────────────────────────────
export type GameMode = 'menu' | 'playing' | 'paused' | 'over';

/** The type of gameplay variant. */
export type GameModeType = 'free' | 'daily' | 'timed' | 'survival' | 'zen';

// ─── Power Ups ─────────────────────────────────────────────
export type PowerUpType = 'shield' | 'slowmo' | 'doublepulse' | 'magnet' | 'freeze' | 'plating' | 'autofocus' | 'life';

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
  breakUrgent: boolean;
  breakTimer: number;
  shakeTime: number;
  dailyMode: boolean;
  targetBest: number;
  recordCrossed: boolean;
  tick: number;
  paused: boolean;
  soundEnabled: boolean;
  timeRemaining: number;
  zenFalls: number;
  activePowerUp: PowerUpType | null;
  powerUpTimer: number;
  slowmoMultiplier: number;
  scoreMultiplier: number;
  lives: number;
  invincibleTimer: number;
  lifeCollectPauseTimer: number;
  revivePauseTimer: number;
  reviveCount: number;
  W: number;
  H: number;
}
