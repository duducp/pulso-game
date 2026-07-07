import type { GameModeType, PowerUpType } from './types';

// ─── Duration Constants ────────────────────────────────────
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

// ─── Which power-ups are available per game mode ───────────
export const POWERUPS_BY_MODE: Record<GameModeType, PowerUpType[]> = {
  free: ['shield', 'slowmo', 'doublepulse', 'magnet', 'life'],
  daily: ['shield', 'slowmo', 'doublepulse', 'magnet', 'life'],
  timed: ['shield', 'slowmo', 'doublepulse', 'magnet', 'freeze', 'life'],
  survival: ['shield', 'slowmo', 'doublepulse', 'magnet', 'plating', 'life'],
  zen: ['shield', 'slowmo', 'doublepulse', 'magnet', 'autofocus', 'life'],
};

// ─── Spawn weights (higher = more likely) ──────────────────
export const POWERUP_WEIGHTS: Record<PowerUpType, number> = {
  shield: 35,
  slowmo: 15,
  doublepulse: 30,
  magnet: 20,
  freeze: 15,
  plating: 15,
  autofocus: 15,
  life: 12,
};

// ─── Display Data ──────────────────────────────────────────
export const POWERUP_ICONS: Record<string, string> = {
  shield: '🛡️',
  slowmo: '⏱️',
  doublepulse: '💥',
  magnet: '🧲',
  freeze: '❄️',
  plating: '🔰',
  autofocus: '🎯',
  life: '💓',
};

export const POWERUP_NAMES: Record<string, string> = {
  shield: 'Barreira',
  slowmo: 'Câmera Lenta',
  doublepulse: 'Pulso Duplo',
  magnet: 'Magnet',
  freeze: 'Congelamento',
  plating: 'Armadura',
  autofocus: 'Autofoco',
  life: 'Vida Extra',
};

// ─── Flash overlay colors (RGB) ───────────────────────────
export const POWERUP_FLASH_COLORS: Record<PowerUpType, string> = {
  shield: '93,186,255', slowmo: '187,134,252', doublepulse: '255,107,157',
  magnet: '255,215,0', freeze: '0,229,255', plating: '255,138,101', autofocus: '206,147,216',
  life: '255,92,108',
};

// ─── Canvas render colors (hex, for Renderer) ─────────────
export const POWERUP_RENDER_COLORS: Record<PowerUpType, string> = {
  shield: '#5BBAFF', slowmo: '#BB86FC', doublepulse: '#FF6B9D',
  magnet: '#FFD700', freeze: '#00E5FF', plating: '#FF8A65', autofocus: '#CE93D8',
  life: '#FF5C6C',
};

export const POWERUP_DESC: Record<string, string> = {
  shield: 'Barreira energética. Absorve uma colisão — proteção total por 5s.',
  slowmo: 'O tempo desacelera. Obstáculos em câmera lenta por 3s.',
  doublepulse: 'Cada pulso vale o dobro. Pontuação acelerada por 5s.',
  magnet: 'Atrai orbs extras dos obstáculos. Colete pontos extras por 5s.',
  freeze: 'O cronômetro congela. Ganhe segundos preciosos por 4s.',
  plating: 'Revestimento resistente. Suporta múltiplos impactos por 3s.',
  autofocus: 'Guia seus pulsos ao centro da passagem. Foco total por 3s.',
  life: 'Vida extra! Acumule até 3 — cada uma revive você no lugar.',
};
