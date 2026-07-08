import type { Player, Obstacle, PowerUp } from './types';
import { STEP } from './constants';

/**
 * Apply gravity and velocity to the player for one fixed timestep.
 * Does NOT handle bounds clamping or game-specific side effects — those
 * remain in the caller so it can react with sounds, zen-mode logic, etc.
 */
export function updatePlayerPhysics(
  player: Pick<Player, 'vy' | 'y' | 'r'>,
  H: number,
  dt: number,
): { vy: number; y: number; rot: number } {
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
 * Move a power-up leftward by the current game speed.
 * NOTE: phase (bob animation) is advanced by the caller.
 */
export function movePowerUp(pu: PowerUp, speed: number): void {
  if (!pu.collected) {
    pu.x -= speed * STEP;
  }
}
