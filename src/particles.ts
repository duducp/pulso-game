import type { Particle, PowerUpType } from './types';
import { COLORS } from './types';

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
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 100 + Math.random() * 150;
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: 3 + Math.random() * 3,
      life: 1,
      type: 'dot',
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
  const color = type === 'shield' ? COLORS.shield : type === 'slowmo' ? COLORS.slowmo : COLORS.doublepulse;
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 140;
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: 3 + Math.random() * 4,
      life: 1,
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

// ─── Update ────────────────────────────────────────────────
export function updateParticles(particles: Particle[], dt: number): void {
  for (const p of particles) {
    p.life -= p.type === 'shard' ? dt * 1.1 : dt * 1.8;

    switch (p.type) {
      case 'ring':
        p.r += dt * 140;
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
