import type { GameState } from './types';
import { COLORS } from './types';
import { POWERUP_ICONS, POWERUP_RENDER_COLORS } from './powerups';

// ─── Icosahedron wireframe (12 verts, 30 edges) ──────────────
const ICO_VERTICES: [number, number, number][] = [
  [-1, 1.618, 0], [1, 1.618, 0], [-1, -1.618, 0], [1, -1.618, 0],
  [0, -1, 1.618], [0, 1, 1.618], [0, -1, -1.618], [0, 1, -1.618],
  [1.618, 0, -1], [1.618, 0, 1], [-1.618, 0, -1], [-1.618, 0, 1],
];

const ICO_FACES: [number, number, number][] = [
  [0,1,5],[0,5,11],[0,11,10],[0,10,7],[0,7,1],
  [1,9,5],[5,4,11],[11,2,10],[10,6,7],[7,8,1],
  [1,8,9],[5,9,4],[11,4,2],[10,2,6],[7,6,8],
  [3,4,9],[3,9,8],[3,8,6],[3,6,2],[3,2,4],
];

const ICO_EDGES: [number, number][] = (() => {
  const set = new Set<string>();
  const edges: [number, number][] = [];
  for (const [a, b, c] of ICO_FACES) {
    for (const [i, j] of [[a, b], [b, c], [c, a]] as [number, number][]) {
      const key = (i < j ? i + ',' + j : j + ',' + i);
      if (!set.has(key)) { set.add(key); edges.push([i, j]); }
    }
  }
  return edges;
})();

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

  /** Idle / menu background pulse */
  idleRender(tick: number): void {
    const { W, H, ctx } = this;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    const beat = (Math.sin(tick * (72 / 60) * Math.PI * 2) + 1) / 2;
    const glowR = Math.max(W, H) * (0.5 + beat * 0.1);
    const grad = ctx.createRadialGradient(
      W * 0.5, H * 0.4, 0,
      W * 0.5, H * 0.4, glowR,
    );
    grad.addColorStop(0, `rgba(77,240,224,${0.08 + beat * 0.05})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    this.drawIcosahedron(ctx, tick, W, H);
  }

  /** Draw a slowly rotating wireframe icosahedron in the background */
  private drawIcosahedron(ctx: CanvasRenderingContext2D, tick: number, W: number, H: number): void {
    const rotY = tick * 0.05;
    const rotX = tick * 0.025;
    const size = Math.min(W, H) * 0.42;
    const focal = 2.5;
    const cx = W * 0.5;
    const cy = H * 0.45;

    const proj = ICO_VERTICES.map(v => {
      let [x, y, z] = v;
      const cY = Math.cos(rotY), sY = Math.sin(rotY);
      const x1 = x * cY + z * sY;
      const z1 = -x * sY + z * cY;
      x = x1; z = z1;
      const cX = Math.cos(rotX), sX = Math.sin(rotX);
      const y1 = y * cX - z * sX;
      const z2 = y * sX + z * cX;
      y = y1; z = z2;
      const persp = focal / (focal + z * 0.12);
      return { x: x * size * persp + cx, y: y * size * persp + cy, z };
    });

    ctx.strokeStyle = 'rgba(77,240,224,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const [i, j] of ICO_EDGES) {
      ctx.moveTo(proj[i].x, proj[i].y);
      ctx.lineTo(proj[j].x, proj[j].y);
    }
    ctx.stroke();
  }

  /** Main game render */
  render(s: GameState): void {
    const { ctx } = this;
    const beat =
      (Math.sin(s.tick * (s.bpm / 60) * Math.PI * 2) + 1) / 2;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, s.W, s.H);

    ctx.save();

    // Shake
    if (s.shakeTime > 0) {
      const mag = 6 * (s.shakeTime / 0.25);
      ctx.translate(
        (Math.random() - 0.5) * mag,
        (Math.random() - 0.5) * mag,
      );
    }

    // Glow
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

    // Floor line
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, s.H - 1);
    ctx.lineTo(s.W, s.H - 1);
    ctx.stroke();

    // Obstacles
    for (const o of s.obstacles) {
      ctx.fillStyle = s.breakMode ? COLORS.gold : COLORS.red;
      if (s.breakMode) {
        ctx.shadowColor = COLORS.gold;
        if (s.breakUrgent) {
          // Rapid pulsing blink to signal break mode ending
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

    // Power-ups
    for (const pu of s.powerUps) {
      if (pu.collected) continue;
      const bob = Math.sin(pu.phase * 3) * 4;
      const color = POWERUP_RENDER_COLORS[pu.type];

      // Outer glow ring
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.12 + Math.sin(pu.phase * 4) * 0.06;
      ctx.beginPath();
      ctx.arc(pu.x, pu.y + bob, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Inner opaque background disc (ensures emoji never bleeds)
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(pu.x, pu.y + bob, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Icon — use top baseline + manual offset for consistent Safari emoji centering
      ctx.font = '21px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(POWERUP_ICONS[pu.type], pu.x, pu.y + bob - 10.5);
    }

    // Particles
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
          // Inner glow
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

    // Trail
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

    // Invincibility aura (revive)
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

    // Life collection pause — heartbeat blink aura
    if (s.lifeCollectPauseTimer > 0) {
      const heartbeat = Math.sin(s.tick * 60) > 0.3 ? 0 : 1; // fast on/off blink
      const pulse = Math.sin(s.tick * 20) * 0.2 + 0.3;
      ctx.save();
      ctx.translate(s.player.x, s.player.y);
      // Heartbeat ring
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

    // Player
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
