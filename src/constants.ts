// ─── Game Constants ────────────────────────────────────────

/** Points gained for passing through an obstacle. */
export const POWER_PASS = 12;

/** Points gained for a near-miss pass. */
export const POWER_NEAR = 24;

/** Duration of break mode in seconds. */
export const BREAK_DURATION = 5;

/** Fixed timestep for the game loop (1/120 s). */
export const STEP = 1 / 120;

/** Duration of timed mode in seconds. */
export const TIMED_DURATION = 30;

/** Speed multiplier for survival mode. */
export const SURVIVAL_SPEED_MULT = 1.8;

/** Maximum lives a player can hold at once. */
export const LIVES_MAX = 3;

/** Duration of invincibility after revive in seconds. */
export const INVINCIBILITY_DURATION = 2.0;

/** Points rewarded when collecting a life. */
export const LIFE_POINTS = 5;

/** Duration of the game-freeze + ball blink after collecting a life. */
export const LIFE_COLLECT_PAUSE = 1.2;

// ─── Colors ─────────────────────────────────────────────────
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
