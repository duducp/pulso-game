import type { Particle, PowerUpType } from './types';
import { COLORS } from './types';
import { POWERUP_RENDER_COLORS } from './powerups';

// ─── Particle spawning ─────────────────────────────────────

export function spawnRing(particles: Particle[], px: number, py: number, r: number): void {
  particles.push({ x: px, y: py, r, life: 1, type: 'ring' });
}

export function spawnDots(
  particles: Particle[],
  px: number,
  py: number,
  count: number,
  spread = 90,
): void {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(a) * spread,
      vy: Math.sin(a) * spread,
      r: 3 + Math.random() * 3,
      life: 1,
      type: 'dot',
    });
  }
}

export function spawnShatter(
  particles: Particle[],
  ox: number,
  oyTop: number,
  oyBot: number,
  oW: number,
): void {
  const cx = ox + oW / 2;
  const cy = (oyTop + oyBot) / 2;
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 80 + Math.random() * 180;
    particles.push({
      x: cx,
      y: cy + (Math.random() - 0.5) * (oyBot - oyTop),
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: 3 + Math.random() * 4,
      life: 1,
      type: 'shard',
    });
  }
}

export function spawnRecordBurst(particles: Particle[], px: number, py: number): void {
  const gold = COLORS.gold;

  // Expanding gold rings
  for (let i = 0; i < 3; i++) {
    particles.push({ x: px, y: py, r: 8, life: 0.7, type: 'powerup-ring', color: gold });
  }

  // Large golden burst particles
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 90 + Math.random() * 200;
    const size = 4 + Math.random() * 6;
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: size,
      life: 0.9 + Math.random() * 0.4,
      type: 'powerup',
      color: gold,
    });
  }

  // Starburst rays
  for (let i = 0; i < 12; i++) {
    const a = (Math.PI * 2 / 12) * i + Math.random() * 0.2;
    const sp = 220 + Math.random() * 140;
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: 2,
      life: 0.4 + Math.random() * 0.2,
      type: 'powerup',
      color: gold,
    });
  }
}

export function spawnBreakBurst(particles: Particle[], px: number, py: number): void {
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 120 + Math.random() * 140;
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: 3 + Math.random() * 4,
      life: 1,
      type: 'dot',
    });
  }
}

export function spawnPowerUpCollect(particles: Particle[], px: number, py: number, type: PowerUpType): void {
  const color = POWERUP_RENDER_COLORS[type];

  // Ring burst
  particles.push({ x: px, y: py, r: 6, life: 0.6, type: 'powerup-ring', color });
  particles.push({ x: px, y: py, r: 6, life: 0.6, type: 'powerup-ring', color });

  // Outward burst
  for (let i = 0; i < 24; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 80 + Math.random() * 180;
    const size = 2 + Math.random() * 5;
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: size,
      life: 0.8 + Math.random() * 0.4,
      type: 'powerup',
      color,
    });
  }

  // Starburst: a few fast thin rays
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 / 8) * i + Math.random() * 0.3;
    const sp = 200 + Math.random() * 100;
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: 1.5,
      life: 0.3 + Math.random() * 0.2,
      type: 'powerup',
      color,
    });
  }
}

/** Spawn orbs that fly toward the player (magnet power-up) */
export function spawnMagnetOrbs(
  particles: Particle[],
  obstacleX: number,
  gapCenterY: number,
  count: number,
): void {
  for (let i = 0; i < count; i++) {
    const offsetX = 10 + Math.random() * 20;
    const offsetY = (Math.random() - 0.5) * 40;
    particles.push({
      x: obstacleX + offsetX,
      y: gapCenterY + offsetY,
      vx: 0,
      vy: 0,
      r: 5 + Math.random() * 3,
      life: 2,
      type: 'orb',
      color: COLORS.magnet,
    });
  }
}

export function spawnNearText(particles: Particle[], px: number, py: number): void {
  particles.push({
    x: px + 20,
    y: py - 20,
    r: 0,
    life: 1,
    type: 'text',
    text: 'quase!',
  });
}

/** Burst of red heart-like particles when reviving */
export function spawnReviveBurst(particles: Particle[], px: number, py: number): void {
  const red = COLORS.red;
  // Expanding red ring
  particles.push({ x: px, y: py, r: 6, life: 0.7, type: 'powerup-ring', color: red });
  particles.push({ x: px, y: py, r: 6, life: 0.7, type: 'powerup-ring', color: red });
  particles.push({ x: px, y: py, r: 6, life: 0.7, type: 'powerup-ring', color: red });

  // Heart-like burst outward
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 160;
    const size = 2 + Math.random() * 5;
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: size,
      life: 0.7 + Math.random() * 0.4,
      type: 'powerup',
      color: red,
    });
  }

  // Fast thin rays
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 / 10) * i + Math.random() * 0.3;
    const sp = 180 + Math.random() * 100;
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: 1.5,
      life: 0.3 + Math.random() * 0.15,
      type: 'powerup',
      color: red,
    });
  }
}

/**
 * Calculate particle counts for a given combo tier.
 * Tier 0 (combo 1-4): 10 sparks + 5 fast
 * Tier 1 (combo 5-9): 16 sparks + 8 fast + 1 ring
 * Tier 2 (combo 10-14): 22 sparks + 10 fast + 2 rings
 * Tier 3 (combo 15+): 30 sparks + 12 fast + 3 rings
 */
function getComboTier(combo: number): { sparks: number; fast: number; rings: number } {
  if (combo >= 15) return { sparks: 30, fast: 12, rings: 3 };
  if (combo >= 10) return { sparks: 22, fast: 10, rings: 2 };
  if (combo >= 5) return { sparks: 16, fast: 8, rings: 1 };
  return { sparks: 10, fast: 5, rings: 0 };
}

/** Burst of sparks at the gap edge the player almost hit */
export function spawnNearBurst(
  particles: Particle[],
  edgeX: number,
  edgeY: number,
  /** 1 = spray downward (top edge), -1 = spray upward (bottom edge) */
  dir: number,
  /** Current combo count (for progressive scaling) */
  combo: number,
): void {
  const gold = COLORS.gold;
  const angleCenter = dir * Math.PI / 2;
  const tier = getComboTier(combo);

  // Expanding rings (only at higher combos)
  for (let i = 0; i < tier.rings; i++) {
    const ringLife = 0.4 + Math.random() * 0.15;
    particles.push({
      x: edgeX,
      y: edgeY,
      r: 4,
      life: ringLife,
      type: 'powerup-ring',
      color: gold,
    });
  }

  // Spark burst — particles fly away from the edge
  for (let i = 0; i < tier.sparks; i++) {
    const a = angleCenter + (Math.random() - 0.5) * Math.PI * 0.9;
    const sp = 60 + Math.random() * 120;
    particles.push({
      x: edgeX,
      y: edgeY,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: 2 + Math.random() * 3,
      life: 0.4 + Math.random() * 0.3,
      type: 'powerup',
      color: gold,
    });
  }

  // A few tiny fast sparks
  for (let i = 0; i < tier.fast; i++) {
    const a = angleCenter + (Math.random() - 0.5) * Math.PI;
    const sp = 140 + Math.random() * 100;
    particles.push({
      x: edgeX,
      y: edgeY,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: 1.5,
      life: 0.25 + Math.random() * 0.15,
      type: 'powerup',
      color: gold,
    });
  }
}

// ─── Update ────────────────────────────────────────────────
export function updateParticles(particles: Particle[], dt: number): void {
  for (const p of particles) {
    p.life -= p.type === 'shard' ? dt * 1.1 : p.type === 'powerup' ? dt * 1.6 : dt * 1.8;

    switch (p.type) {
      case 'ring':
      case 'powerup-ring':
        p.r += dt * 140;
        // Ring expands and fades — also drift slightly
        if (p.vx) p.x += p.vx * dt;
        if (p.vy) p.y += p.vy * dt;
        break;
      case 'dot':
        p.x += (p.vx ?? 0) * dt;
        p.y += (p.vy ?? 0) * dt;
        break;
      case 'shard':
        p.x += (p.vx ?? 0) * dt;
        p.y += (p.vy ?? 0) * dt;
        p.vy = (p.vy ?? 0) + 260 * dt;
        break;
      case 'powerup':
        p.x += (p.vx ?? 0) * dt;
        p.y += (p.vy ?? 0) * dt;
        // Gravity pulls particles down, slight drag
        p.vy = (p.vy ?? 0) + 120 * dt;
        p.vx = (p.vx ?? 0) * (1 - dt * 0.8);
        p.vy = (p.vy ?? 0) * (1 - dt * 0.8);
        break;
      case 'text':
        p.y -= dt * 40;
        break;
      case 'orb':
        // orbs are moved externally by game logic (magnet attraction)
        // decay life so they expire if not collected
        p.life -= dt * 0.15;
        break;
    }
  }
}
