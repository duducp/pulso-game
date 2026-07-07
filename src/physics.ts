import type { Player, Obstacle, PowerUp } from './types';
import { STEP } from './constants';

/**
 * Result of applying gravity and velocity to the player for one timestep.
 */
export interface PlayerPhysicsResult {
  vy: number;
  y: number;
  rot: number;
}

/**
 * Apply gravity and velocity to the player for one fixed timestep.
 * Does NOT handle bounds clamping or game-specific side effects — those
 * remain in the caller so it can react with sounds, zen-mode logic, etc.
 */
export function updatePlayerPhysics(
  player: Pick<Player, 'vy' | 'y' | 'r'>,
  H: number,
  dt: number,
): PlayerPhysicsResult {
  const vy = player.vy + H * 1.55 * dt;
  const y = player.y + vy * dt;
  const rot = Math.max(-0.5, Math.min(1.1, vy / 900));
  return { vy, y, rot };
}

/**
 * Move an obstacle leftward by the current game speed.
 */
export function moveObstacle(o: Obstacle, speed: number): void {
  o.x -= speed * STEP;
}

/**
 * Move a power-up leftward and advance its bob phase.
 */
export function movePowerUp(pu: PowerUp, speed: number, dt: number): void {
  if (!pu.collected) {
    pu.x -= speed * STEP;
    pu.phase += dt;
  }
}
