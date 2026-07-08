import type { GameState } from './types';
import { COLORS } from './constants';
import { POWERUP_ICONS, POWERUP_RENDER_COLORS } from './powerups';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  getViewportDims(): { w: number; h: number } {
    const vv = window.visualViewport;
    if (vv && vv.width > 0 && vv.height > 0) {
      return { w: vv.width, h: vv.height };
    }
    return { w: window.innerWidth, h: window.innerHeight };
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { w, h } = this.getViewportDims();
    this.W = w;
    this.H = h;
    this.canvas.width = this.W * dpr;
    this.canvas.height = this.H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Main game render */
  render(s: GameState): void {
    const { ctx } = this;
    const beat = (Math.sin(s.tick * (s.bpm / 60) * Math.PI * 2) + 1) / 2;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, s.W, s.H);
    ctx.save();

    this.applyShake(s);
    this.renderBackground(s, beat);
    this.renderObstacles(s);
    this.renderPowerUps(s);
    this.renderParticles(s);
    this.renderTrail(s);
    this.renderAuras(s);
    this.renderPlayer(s);

    ctx.restore();
  }

  private applyShake(s: GameState): void {
    if (s.shakeTime > 0) {
      const mag = 6 * (s.shakeTime / 0.25);
      this.ctx.translate(
        (Math.random() - 0.5) * mag,
        (Math.random() - 0.5) * mag,
      );
    }
  }

  private renderBackground(s: GameState, beat: number): void {
    const { ctx } = this;
    const glowColor = s.breakMode ? '255,194,77' : '77,240,224';
    const glowR = Math.max(s.W, s.H) * (0.55 + beat * 0.12 + (s.breakMode ? 0.08 : 0));
    const grad = ctx.createRadialGradient(
      s.W * 0.5, s.H * 0.35, 0,
      s.W * 0.5, s.H * 0.35, glowR,
    );
    grad.addColorStop(
      0,
      `rgba(${glowColor},${s.breakMode ? 0.14 : (0.06 + beat * 0.04)})`,
    );
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s.W, s.H);

    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, s.H - 1);
    ctx.lineTo(s.W, s.H - 1);
    ctx.stroke();
  }

  private renderObstacles(s: GameState): void {
    const { ctx } = this;
    for (const o of s.obstacles) {
      ctx.fillStyle = s.breakMode ? COLORS.gold : COLORS.red;
      if (s.breakMode) {
        ctx.shadowColor = COLORS.gold;
        if (s.breakUrgent) {
          const blink = Math.sin(s.tick * 40) * 0.5 + 0.5;
          ctx.globalAlpha = 0.5 + blink * 0.5;
          ctx.shadowBlur = 10 + blink * 28;
        } else {
          ctx.shadowBlur = 14;
        }
      } else {
        ctx.shadowBlur = 0;
      }
      this.roundRect(o.x, 0, o.w, o.gapY, 8, true);
      this.roundRect(o.x, o.gapY + o.gapH, o.w, s.H - (o.gapY + o.gapH), 8, true);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  private renderPowerUps(s: GameState): void {
    const { ctx } = this;
    for (const pu of s.powerUps) {
      if (pu.collected) continue;
      const bob = Math.sin(pu.phase * 3) * 4;
      const color = POWERUP_RENDER_COLORS[pu.type];

      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.12 + Math.sin(pu.phase * 4) * 0.06;
      ctx.beginPath();
      ctx.arc(pu.x, pu.y + bob, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(pu.x, pu.y + bob, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.font = '21px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(POWERUP_ICONS[pu.type], pu.x, pu.y + bob - 10.5);
    }
  }

  private renderParticles(s: GameState): void {
    const { ctx } = this;
    for (const p of s.particles) {
      ctx.globalAlpha = Math.max(p.life, 0);
      switch (p.type) {
        case 'ring':
          ctx.strokeStyle = COLORS.cyan;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 'dot':
          ctx.fillStyle = COLORS.cyan;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'shard':
          ctx.fillStyle = COLORS.gold;
          ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
          break;
        case 'text':
          ctx.fillStyle = COLORS.gold;
          ctx.font = '700 18px Space Grotesk, sans-serif';
          ctx.shadowColor = COLORS.gold;
          ctx.shadowBlur = 16;
          ctx.fillText(p.text ?? '', p.x, p.y);
          ctx.shadowBlur = 0;
          break;
        case 'powerup':
          ctx.fillStyle = p.color ?? COLORS.cyan;
          ctx.shadowColor = p.color ?? COLORS.cyan;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          break;
        case 'powerup-ring':
          ctx.strokeStyle = p.color ?? COLORS.cyan;
          ctx.shadowColor = p.color ?? COLORS.cyan;
          ctx.shadowBlur = 20;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
          break;
        case 'orb':
          ctx.fillStyle = COLORS.magnet;
          ctx.shadowColor = COLORS.magnet;
          ctx.shadowBlur = 18;
          ctx.globalAlpha = Math.min(p.life, 1) * 0.9;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFF8DC';
          ctx.shadowBlur = 0;
          ctx.globalAlpha = Math.min(p.life, 1) * 0.5;
          ctx.beginPath();
          ctx.arc(p.x - 1, p.y - 1, p.r * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
          break;
      }
      ctx.globalAlpha = 1;
    }
  }

  private renderTrail(s: GameState): void {
    const { ctx } = this;
    for (let i = 0; i < s.trail.length; i++) {
      const alpha = (i / s.trail.length) * 0.5;
      const r = s.player.r * (0.3 + 0.7 * (i / s.trail.length));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.breakMode ? COLORS.gold : COLORS.cyan;
      ctx.beginPath();
      ctx.arc(s.trail[i].x, s.trail[i].y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private renderAuras(s: GameState): void {
    const { ctx } = this;
    if (s.invincibleTimer > 0) {
      const pulse = Math.sin(s.tick * 16) * 0.3 + 0.5;
      ctx.save();
      ctx.translate(s.player.x, s.player.y);
      ctx.globalAlpha = pulse * 0.25;
      ctx.strokeStyle = COLORS.red;
      ctx.shadowColor = COLORS.red;
      ctx.shadowBlur = 28;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, s.player.r * 1.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    if (s.lifeCollectPauseTimer > 0) {
      const heartbeat = Math.sin(s.tick * 60) > 0.3 ? 0 : 1;
      const pulse = Math.sin(s.tick * 20) * 0.2 + 0.3;
      ctx.save();
      ctx.translate(s.player.x, s.player.y);
      ctx.globalAlpha = pulse * 0.35;
      ctx.strokeStyle = COLORS.red;
      ctx.shadowColor = COLORS.red;
      ctx.shadowBlur = 32;
      ctx.lineWidth = heartbeat ? 3 : 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, s.player.r * (1.8 + heartbeat * 0.2), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  private renderPlayer(s: GameState): void {
    const { ctx } = this;
    ctx.save();
    ctx.translate(s.player.x, s.player.y);
    ctx.rotate(s.player.rot * 0.6);
    const ballColor = s.breakMode ? COLORS.gold : COLORS.cyan;
    const ballR = s.breakMode ? s.player.r * 1.35 : s.player.r;
    ctx.fillStyle = ballColor;
    ctx.shadowColor = ballColor;
    ctx.shadowBlur = s.breakMode ? 30 : 18;
    ctx.beginPath();
    ctx.arc(0, 0, ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number, fill: boolean): void {
    if (h <= 0) return;
    r = Math.min(r, w / 2, h / 2);
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
  }
}
