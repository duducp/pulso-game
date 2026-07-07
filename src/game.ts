import type { Player, Obstacle, Particle, TrailPoint, GameMode, GameModeType, GameState, PowerUp, PowerUpType } from './types';
import {
  POWER_PASS, POWER_NEAR, BREAK_DURATION, STEP,
  TIMED_DURATION, SURVIVAL_SPEED_MULT,
} from './constants';
import {
  POWERUP_SHIELD_DURATION,
  POWERUP_SLOWMO_DURATION, POWERUP_DOUBLE_DURATION,
  POWERUP_SLOWMO_FACTOR, POWERUP_DOUBLE_FACTOR,
  POWERUP_MAGNET_DURATION, MAGNET_ORBS_PER_PASS,
  POWERUP_FREEZE_DURATION, POWERUP_PLATING_DURATION, POWERUP_AUTOFOCUS_DURATION,
  POWERUP_WEIGHTS, POWERUPS_BY_MODE, POWERUP_ICONS, POWERUP_FLASH_COLORS,
} from './powerups';
import { MODE_LABELS, MODE_GAMEOVER_LABELS, MODE_LB_TITLES, MODE_BEST_KEYS } from './modes';
import { xmur3, mulberry32, todayStr } from './rng';
import {
  spawnRing,
  spawnDots,
  spawnShatter,
  spawnRecordBurst,
  spawnBreakBurst,
  spawnNearText,
  spawnNearBurst,
  spawnPowerUpCollect,
  spawnMagnetOrbs,
  updateParticles,
} from './particles';
import {
  soundPulse,
  soundBreak,
  soundRecord,
  soundGameOver,
  soundNear,
  soundPause,
  soundUnpause,
  soundPowerUp,
  soundOrbCollect,
  soundBounce,
  isSoundEnabled,
} from './audio';
import { submitScore, loadBestRecord, saveBestRecord } from './storage';
import { renderLBInto } from './ui';
import { HudManager } from './hud';

export class Game {
  // ─── Public state ────────────────────────────────────────
  mode: GameMode = 'menu';
  modeType: GameModeType = 'free';
  player!: Player;
  obstacles: Obstacle[] = [];
  powerUps: PowerUp[] = [];
  particles: Particle[] = [];
  trail: TrailPoint[] = [];
  score = 0;
  speed = 0;
  gapSize = 0;
  bpm = 72;
  nearCount = 0;
  breakCount = 0;
  power = 0;
  combo = 0;
  maxCombo = 0;
  breakMode = false;
  breakTimer = 0;
  shakeTime = 0;
  dailyMode = false;
  targetBest = 0;
  recordCrossed = false;
  tick = 0;
  isGameOver = false;
  paused = false;
  timeRemaining = 0;
  zenFalls = 0;
  activePowerUp: PowerUpType | null = null;
  powerUpTimer = 0;
  magnetOrbs = 0;
  slowmoMultiplier = 1;
  scoreMultiplier = 1;

  W: number;
  H: number;

  // ─── HUD Manager (DOM abstraction) ──────────────────────
  hud: HudManager;

  // ─── Internal ────────────────────────────────────────────
  private lastSpawn = 0;
  private rng: () => number = Math.random;
  // Best scores — store { score, date } so we can show when the record was set
  private bestFree: { score: number; date: string | null } = { score: 0, date: null };
  private bestDailyToday: { score: number; date: string | null } = { score: 0, date: null };
  private bestTimed: { score: number; date: string | null } = { score: 0, date: null };
  private bestSurvival: { score: number; date: string | null } = { score: 0, date: null };
  private _lastRank: number | null = null;
  private _currentBest = 0;

  onGameOver?: () => void;

  constructor(W: number, H: number) {
    this.W = W;
    this.H = H;
    this.hud = new HudManager();
    this.reset();
  }

  setDimensions(W: number, H: number): void {
    this.W = W;
    this.H = H;
  }

  getState(): GameState {
    return {
      mode: this.mode,
      modeType: this.modeType,
      player: this.player,
      obstacles: this.obstacles,
      powerUps: this.powerUps,
      particles: this.particles,
      trail: this.trail,
      score: this.score,
      speed: this.speed,
      gapSize: this.gapSize,
      bpm: this.bpm,
      nearCount: this.nearCount,
      breakCount: this.breakCount,
      power: this.power,
      combo: this.combo,
      maxCombo: this.maxCombo,
      breakMode: this.breakMode,
      breakTimer: this.breakTimer,
      shakeTime: this.shakeTime,
      dailyMode: this.dailyMode,
      targetBest: this.targetBest,
      recordCrossed: this.recordCrossed,
      tick: this.tick,
      isGameOver: this.isGameOver,
      paused: this.paused,
      soundEnabled: isSoundEnabled(),
      timeRemaining: this.timeRemaining,
      zenFalls: this.zenFalls,
      activePowerUp: this.activePowerUp,
      powerUpTimer: this.powerUpTimer,
      slowmoMultiplier: this.slowmoMultiplier,
      scoreMultiplier: this.scoreMultiplier,
      W: this.W,
      H: this.H,
    };
  }

  reset(): void {
    this.player = { x: this.W * 0.28, y: this.H / 2, vy: 0, r: 13, rot: 0 };
    this.obstacles = [];
    this.powerUps = [];
    this.particles = [];
    this.score = 0;
    this.nearCount = 0;
    this.breakCount = 0;
    this.speed = this.W * 0.34;
    this.gapSize = this.H * 0.30;
    this.tick = 0;
    this.bpm = 72;
    this.lastSpawn = 0;
    this.power = 0;
    this.breakMode = false;
    this.breakTimer = 0;
    this.shakeTime = 0;
    this.recordCrossed = false;
    this.combo = 0;
    this.maxCombo = 0;
    this.trail = [];
    this.isGameOver = false;
    this.zenFalls = 0;
    this.activePowerUp = null;
    this.powerUpTimer = 0;
    this.magnetOrbs = 0;
    this.slowmoMultiplier = 1;
    this.scoreMultiplier = 1;

    // HUD reset
    this.hud.reset(this.modeType);

    if (this.dailyMode) {
      const seedGen = xmur3(todayStr());
      this.rng = mulberry32(seedGen());
    } else {
      this.rng = Math.random;
    }
  }

  async loadPersistedData(): Promise<void> {
    const [bestFree, bestDaily, bestTimed, bestSurvival] = await Promise.all([
      loadBestRecord('profile:best:free'),
      loadBestRecord('profile:best:daily:' + todayStr()),
      loadBestRecord('profile:best:timed'),
      loadBestRecord('profile:best:survival'),
    ]);
    this.bestFree = bestFree;
    this.bestDailyToday = bestDaily;
    this.bestTimed = bestTimed;
    this.bestSurvival = bestSurvival;
  }

  getModeLabel(): string {
    const base = MODE_LABELS[this.modeType];
    if (this.modeType === 'daily') {
      return base + ' · ' + todayStr().slice(5, 10).replace('-', '/');
    }
    return base;
  }

  getBestKey(): string {
    const base = MODE_BEST_KEYS[this.modeType];
    if (this.modeType === 'daily') {
      return base + todayStr();
    }
    return base;
  }

  getLBKey(): string {
    return this.getBestKey().replace('profile:best:', 'lb:');
  }

  beginRun(mode: GameModeType): void {
    this.modeType = mode;
    this.dailyMode = mode === 'daily';

    if (mode === 'free') this.targetBest = this.bestFree.score;
    else if (mode === 'daily') this.targetBest = this.bestDailyToday.score;
    else if (mode === 'timed') this.targetBest = this.bestTimed.score;
    else if (mode === 'survival') this.targetBest = this.bestSurvival.score;
    else this.targetBest = 0;

    this.timeRemaining = mode === 'timed' ? TIMED_DURATION : 0;
    this.reset();
    this.mode = 'playing';

    const startScreen = document.getElementById('startScreen');
    const overScreen = document.getElementById('overScreen');
    startScreen?.classList.add('hidden');
    overScreen?.classList.add('hidden');

    this.hud.updateModeTag(this.getModeLabel());
    this.hud.updateBestVal(this.targetBest);

    if (mode === 'timed') {
      this.hud.showTimerBlock();
    } else {
      this.hud.hideTimerBlock();
    }

    if (mode === 'zen') {
      this.hud.updateRecordPace('sem game over — relaxe');
    } else if (this.targetBest > 0) {
      this.hud.updateRecordPace('faltam ' + this.targetBest + ' pro recorde');
      this.hud.setRecordPaceAhead(false);
    } else {
      this.hud.updateRecordPace('definindo seu recorde');
    }
  }

  togglePause(): void {
    const ps = document.getElementById('pauseScreen');
    const wrap = document.getElementById('wrap');
    if (this.mode === 'playing') {
      this.paused = true;
      this.mode = 'paused';
      soundPause();
      wrap?.classList.add('paused');
      ps?.classList.remove('hidden');
    } else if (this.mode === 'paused') {
      soundUnpause();
      ps?.classList.add('hidden');
      wrap?.classList.remove('paused');
      this.paused = false;
      this.mode = 'playing';
    }
  }

  pulse(): void {
    if (this.mode !== 'playing') return;
    this.player.vy = -this.H * 0.62;
    soundPulse();
    if (navigator.vibrate) navigator.vibrate(10);
    spawnRing(this.particles, this.player.x, this.player.y, this.player.r);
    spawnDots(this.particles, this.player.x, this.player.y, 6, 90);
  }

  private spawnPowerUp(gapCenterY: number): void {
    const types = POWERUPS_BY_MODE[this.modeType];
    const totalWeight = types.reduce((s, t) => s + POWERUP_WEIGHTS[t], 0);
    let roll = this.rng() * totalWeight;
    let type: PowerUpType = types[0];
    for (const t of types) {
      roll -= POWERUP_WEIGHTS[t];
      if (roll <= 0) { type = t; break; }
    }
    const variance = this.gapSize * 0.35;
    const y = gapCenterY + (this.rng() - 0.5) * variance;
    this.powerUps.push({
      x: this.W + 40,
      y,
      type,
      collected: false,
      phase: this.tick,
    });
  }

  private collectPowerUp(pu: PowerUp): void {
    if (pu.collected) return;
    pu.collected = true;
    soundPowerUp();
    spawnPowerUpCollect(this.particles, pu.x, pu.y, pu.type);

    const color = POWERUP_FLASH_COLORS[pu.type];
    this.hud.flashOverlay(color, 0.2, 200);

    switch (pu.type) {
      case 'shield':
        this.activePowerUp = 'shield';
        this.powerUpTimer = POWERUP_SHIELD_DURATION;
        break;
      case 'slowmo':
        this.activePowerUp = 'slowmo';
        this.powerUpTimer = POWERUP_SLOWMO_DURATION;
        this.slowmoMultiplier = POWERUP_SLOWMO_FACTOR;
        break;
      case 'doublepulse':
        this.activePowerUp = 'doublepulse';
        this.powerUpTimer = POWERUP_DOUBLE_DURATION;
        this.scoreMultiplier = POWERUP_DOUBLE_FACTOR;
        break;
      case 'magnet':
        this.activePowerUp = 'magnet';
        this.powerUpTimer = POWERUP_MAGNET_DURATION;
        this.magnetOrbs = 0;
        break;
      case 'freeze':
        this.activePowerUp = 'freeze';
        this.powerUpTimer = POWERUP_FREEZE_DURATION;
        this.timeRemaining += 0.5;
        break;
      case 'plating':
        this.activePowerUp = 'plating';
        this.powerUpTimer = POWERUP_PLATING_DURATION;
        break;
      case 'autofocus':
        this.activePowerUp = 'autofocus';
        this.powerUpTimer = POWERUP_AUTOFOCUS_DURATION;
        break;
    }

    // Update power-up HUD
    const orbCnt = pu.type === 'magnet' ? ` <span class="pu-orbs">🪙0</span>` : '';
    this.hud.showPowerUpTag(`${POWERUP_ICONS[pu.type]} <span>${Math.ceil(this.powerUpTimer)}</span>${orbCnt}`);
    this.hud.updatePowerUpIndicators(this.activePowerUp);
  }

  update(dt: number): void {
    if (this.paused) return;
    this.tick += dt;

    // ── Power-up timer ──
    if (this.activePowerUp && this.powerUpTimer > 0) {
      this.powerUpTimer -= dt;
      this.hud.updatePowerUpTimerText(String(Math.ceil(this.powerUpTimer)));
      if (this.powerUpTimer <= 0) {
        this.activePowerUp = null;
        this.powerUpTimer = 0;
        this.slowmoMultiplier = 1;
        this.scoreMultiplier = 1;
        this.hud.hidePowerUpTag();
        this.hud.updatePowerUpIndicators(null);
        this.particles = this.particles.filter(p => p.type !== 'orb');
      }
    }

    // ── SlowMo recovery ──
    if (this.slowmoMultiplier < 1) {
      this.slowmoMultiplier = Math.min(1, this.slowmoMultiplier + dt * 0.5);
    }

    // ── Difficulty scaling ──
    const speedMult = (this.modeType === 'survival' ? SURVIVAL_SPEED_MULT : 1) * this.slowmoMultiplier;
    const scoreFactor = this.modeType === 'survival' ? this.score * this.W * 0.018 : this.score * this.W * 0.010;
    this.speed = (this.W * 0.34 + scoreFactor) * speedMult;
    this.gapSize = Math.max(this.H * 0.30 - this.score * 3.2 * speedMult, this.H * 0.20);
    this.bpm = 72 + this.score * 2.4;
    this.hud.updateSpeedText(String(Math.round((this.speed / this.W) * 100)));

    // ── Timed mode countdown ──
    if (this.modeType === 'timed') {
      if (this.activePowerUp !== 'freeze') {
        this.timeRemaining -= dt;
      }
      this.hud.updateTimerText(String(Math.ceil(this.timeRemaining)));
      this.hud.setTimerColor(this.activePowerUp === 'freeze' ? 'var(--cyan)' : 'var(--red)');
      if (this.timeRemaining <= 0) { this.endGame(); return; }
    }

    // ── Spawn obstacles + power-ups ──
    const interval = Math.max(1.5 - this.score * 0.02, 0.9);
    if (this.tick - this.lastSpawn > interval) {
      this.lastSpawn = this.tick;
      const gapInfo = this.spawnObstacle();
      const spawnChance = Math.min(0.50, 0.15 + this.score * 0.005);
      if (this.rng() < spawnChance) {
        this.spawnPowerUp(gapInfo.gapY + gapInfo.gapH / 2);
      }
    }

    // ── Power-ups movement ──
    for (const pu of this.powerUps) {
      if (!pu.collected) {
        pu.x -= this.speed * STEP;
        pu.phase += dt;
      }
    }
    this.powerUps = this.powerUps.filter(p => p.x > -40 && !p.collected);

    // ── Power-up collection ──
    for (const pu of this.powerUps) {
      if (pu.collected) continue;
      const dx = this.player.x - pu.x;
      const dy = this.player.y - pu.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.player.r + 16) {
        this.collectPowerUp(pu);
      }
    }

    // ── Player physics ──
    this.player.vy += this.H * 1.55 * dt;
    this.player.y += this.player.vy * dt;
    this.player.rot = Math.max(-0.5, Math.min(1.1, this.player.vy / 900));
    if (this.player.y - this.player.r < 0) {
      this.player.y = this.player.r;
      this.player.vy = 0;
      if (this.modeType === 'zen') soundBounce();
    }
    if (this.player.y + this.player.r > this.H) {
      if (this.modeType === 'zen') {
        this.player.y = this.H - this.player.r;
        this.player.vy = -this.H * 0.4;
        this.zenFalls++;
        soundBounce();
      } else {
        this.endGame();
        return;
      }
    }

    // ── Break mode ──
    if (this.breakMode) {
      this.breakTimer -= dt;
      if (this.breakTimer <= 0) {
        this.breakMode = false;
        this.power = 0;
        this.hud.setPowerBarFull(false);
        this.hud.hideBreakTag();
      }
    }
    if (this.shakeTime > 0) this.shakeTime -= dt;

    this.trail.push({ x: this.player.x, y: this.player.y });
    if (this.trail.length > 12) this.trail.shift();

    this.updateObstacles();

    this.hud.updatePowerBar(this.power);

    // ── Magnet orbs: attract toward player ──
    for (const p of this.particles) {
      if (p.type === 'orb' && this.activePowerUp === 'magnet') {
        const dx = (this.player.x + 10) - p.x;
        const dy = this.player.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
          const speed = 280 + Math.random() * 40;
          p.x += (dx / dist) * speed * dt;
          p.y += (dy / dist) * speed * dt;
        }
        if (dist < 60) p.life -= dt * 0.8;
      }
    }

    // ── Collect orbs ──
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.type === 'orb' && this.activePowerUp === 'magnet') {
        const dx = (this.player.x + 10) - p.x;
        const dy = this.player.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.player.r + 8) {
          this.score += 1;
          this.magnetOrbs++;
          this.hud.updateScore(this.score);
          soundOrbCollect();
          this.particles.splice(i, 1);
        }
      }
    }

    // ── Update magnet orb count ──
    if (this.activePowerUp === 'magnet') {
      this.hud.updatePowerUpOrbsText(String(this.magnetOrbs));
    }

    updateParticles(this.particles, dt);
    this.particles = this.particles.filter(p => p.life > 0);

    // ── Autofocus ──
    if (this.activePowerUp === 'autofocus') {
      let nearestDist = Infinity;
      let targetY = this.player.y;
      for (const o of this.obstacles) {
        const gapCenter = o.gapY + o.gapH / 2;
        const d = Math.abs(this.player.x - o.x);
        if (d < nearestDist) {
          nearestDist = d;
          targetY = gapCenter;
        }
      }
      const pull = (targetY - this.player.y) * 1.8;
      this.player.vy += pull * dt;
      this.player.vy = Math.max(-this.H * 0.5, Math.min(this.H * 0.5, this.player.vy));
    }

    this.updateRecordPace();
  }

  private spawnObstacle(): { gapY: number; gapH: number } {
    const margin = this.H * 0.12;
    const gapY = margin + this.rng() * (this.H - margin * 2 - this.gapSize);
    this.obstacles.push({
      x: this.W + 40,
      gapY,
      gapH: this.gapSize,
      passed: false,
      nearCounted: false,
      w: 46,
    });
    return { gapY, gapH: this.gapSize };
  }

  private gainPower(amount: number): void {
    if (this.breakMode) return;
    this.power = Math.min(100, this.power + amount);
    if (this.power >= 100) this.activateBreakMode();
  }

  private activateBreakMode(): void {
    this.breakMode = true;
    this.breakTimer = BREAK_DURATION;
    this.power = 100;
    this.shakeTime = 0.25;
    this.hud.setPowerBarFull(true);
    this.hud.showBreakTag();
    soundBreak();
    if (navigator.vibrate) navigator.vibrate(40);
    spawnBreakBurst(this.particles, this.player.x, this.player.y);
    this.hud.quickFlash(80);
  }

  private updateObstacles(): void {
    for (const o of this.obstacles) {
      o.x -= this.speed * STEP;

      if (!o.passed && o.x + o.w < this.player.x - this.player.r) {
        o.passed = true;
        if (!o.nearCounted) {
          this.combo = 0;
          this.hud.hideComboTag();
        }
        const points = Math.floor(1 * this.scoreMultiplier);
        this.score += points;
        this.hud.updateScore(this.score);
        this.gainPower(POWER_PASS);
        this.checkRecordCrossing();
        if (this.activePowerUp === 'magnet') {
          spawnMagnetOrbs(this.particles, o.x + o.w, o.gapY + o.gapH / 2, MAGNET_ORBS_PER_PASS);
        }
      }

      const withinX = this.player.x + this.player.r > o.x && this.player.x - this.player.r < o.x + o.w;
      if (withinX && !o.broken) {
        const topY = o.gapY;
        const botY = o.gapY + o.gapH;
        const colliding = this.player.y - this.player.r < topY || this.player.y + this.player.r > botY;

        if (colliding) {
          if (this.breakMode) {
            if (!o.passed) {
              o.passed = true;
              this.score += Math.floor(3 * this.scoreMultiplier);
              this.breakCount++;
              this.hud.updateScore(this.score);
              this.checkRecordCrossing();
            }
            o.broken = true;
            this.shakeTime = 0.18;
            soundBreak();
            if (navigator.vibrate) navigator.vibrate(30);
            this.hud.quickFlash(80);
            spawnShatter(this.particles, o.x, 0, topY, o.w);
            spawnShatter(this.particles, o.x, botY, this.H, o.w);
          } else if (this.activePowerUp === 'shield' || this.activePowerUp === 'plating') {
            const isPlating = this.activePowerUp === 'plating';
            if (!isPlating) {
              this.activePowerUp = null;
              this.powerUpTimer = 0;
              this.hud.hidePowerUpTag();
              this.hud.updatePowerUpIndicators(null);
            }
            this.shakeTime = 0.15;
            soundBreak();
            if (navigator.vibrate) navigator.vibrate(20);
            const flashRgb = isPlating ? '255,138,101' : '93,186,255';
            this.hud.flashOverlayCustom(flashRgb, 0.25, '255,194,77', '0.15', 150);
            spawnShatter(this.particles, o.x, 0, topY, o.w);
            spawnShatter(this.particles, o.x, botY, this.H, o.w);
            this.player.vy = -this.H * 0.3;
          } else if (this.modeType === 'zen') {
            this.player.vy = -this.H * 0.35;
            this.zenFalls++;
          } else {
            this.endGame();
            return;
          }
        } else if (!o.nearCounted) {
          const clearance = Math.min(
            this.player.y - this.player.r - topY,
            botY - (this.player.y + this.player.r),
          );
          if (clearance >= 0 && clearance < 16) {
            o.nearCounted = true;
            this.nearCount++;
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
            const bonus = Math.floor(this.combo * 0.5);
            const addScore = Math.floor((1 + bonus) * this.scoreMultiplier);
            this.score += addScore;
            this.hud.updateScore(this.score);
            soundNear();

            if (this.combo > 1) {
              this.hud.showComboTag(this.combo);
            } else {
              this.hud.hideComboTag();
            }
            spawnNearText(this.particles, this.player.x, this.player.y);

            // Visual burst: sparks at the gap edge + shake + flash
            const combo = this.combo;
            const shakeAmount = Math.min(0.10 + combo * 0.006, 0.22);
            this.shakeTime = Math.max(this.shakeTime, shakeAmount);
            const edgeX = o.x + o.w / 2;
            const nearTop = this.player.y - this.player.r - topY < botY - (this.player.y + this.player.r);
            const edgeY = nearTop ? topY : botY;
            spawnNearBurst(this.particles, edgeX, edgeY, nearTop ? 1 : -1, combo);
            const flashAlpha = Math.min(0.12 + combo * 0.008, 0.30);
            this.hud.flashOverlay('255,194,77', flashAlpha, Math.min(100 + combo * 5, 200));
            this.gainPower(POWER_NEAR);
            this.checkRecordCrossing();
          }
        }
      }
    }
    this.obstacles = this.obstacles.filter(o => o.x + o.w > -20 && !o.broken);
  }

  private checkRecordCrossing(): void {
    if (this.recordCrossed || this.targetBest <= 0) return;
    if (this.score >= this.targetBest) {
      this.recordCrossed = true;
      this.hud.setScoreGold(true);
      this.hud.showRecordBanner();
      this.shakeTime = Math.max(this.shakeTime, 0.15);
      soundRecord();
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
      setTimeout(() => this.hud.hideRecordBanner(), 1500);
      spawnRecordBurst(this.particles, this.player.x, this.player.y);
    }
  }

  private updateRecordPace(): void {
    if (this.modeType === 'zen') return;
    if (this.targetBest > 0) {
      if (this.recordCrossed) {
        this.hud.updateRecordPace('+' + (this.score - this.targetBest) + ' recorde!');
        this.hud.setRecordPaceAhead(true);
      } else {
        this.hud.updateRecordPace('faltam ' + (this.targetBest - this.score) + ' pro recorde');
        this.hud.setRecordPaceAhead(false);
      }
    }
  }

  async endGame(): Promise<void> {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.mode = 'over';

    if (this.modeType !== 'zen') {
      soundGameOver();
      if (navigator.vibrate) navigator.vibrate(60);
    }

    const bestKey = this.getBestKey();
    if (bestKey) {
      const today = todayStr();
      if (this.modeType === 'free' && this.score > this.bestFree.score) { this.bestFree = { score: this.score, date: today }; saveBestRecord(bestKey, this.score, today); }
      else if (this.modeType === 'daily' && this.score > this.bestDailyToday.score) { this.bestDailyToday = { score: this.score, date: today }; saveBestRecord(bestKey, this.score, today); }
      else if (this.modeType === 'timed' && this.score > this.bestTimed.score) { this.bestTimed = { score: this.score, date: today }; saveBestRecord(bestKey, this.score, today); }
      else if (this.modeType === 'survival' && this.score > this.bestSurvival.score) { this.bestSurvival = { score: this.score, date: today }; saveBestRecord(bestKey, this.score, today); }
    }

    this._currentBest = this.getCurrentBest();

    const finalScore = document.getElementById('finalScore');
    const finalBest = document.getElementById('finalBest');
    const finalBpm = document.getElementById('finalBpm');
    const finalNear = document.getElementById('finalNear');
    const finalBreaks = document.getElementById('finalBreaks');
    const finalCombo = document.getElementById('finalCombo');
    const finalTime = document.getElementById('finalTime');
    const overLabel = document.getElementById('overLabel');
    const rankLine = document.getElementById('rankLine');
    const lbList2 = document.getElementById('lbList2');
    const lbTitle2 = document.getElementById('lbTitle2');
    const overScreen = document.getElementById('overScreen');
    const statTime = document.getElementById('statTime');
    const statFalls = document.getElementById('statFalls');

    if (finalScore) finalScore.textContent = String(this.score);
    if (finalBest) finalBest.textContent = String(this._currentBest);
    if (finalBpm) finalBpm.textContent = String(Math.round(this.bpm));
    if (finalNear) finalNear.textContent = String(this.nearCount);
    if (finalBreaks) finalBreaks.textContent = String(this.breakCount);
    if (finalCombo) finalCombo.textContent = String(this.maxCombo);
    this.hud.updateBestVal(this._currentBest);
    if (finalTime) finalTime.textContent = String(Math.round(this.tick));
    if (statFalls) statFalls.textContent = String(this.zenFalls);

    if (statTime) statTime.style.display = this.modeType === 'zen' ? 'flex' : 'none';
    if (statFalls) statFalls.style.display = this.modeType === 'zen' ? 'flex' : 'none';

    if (overLabel) {
      const base = MODE_GAMEOVER_LABELS[this.modeType];
      if (this.modeType === 'daily') {
        overLabel.textContent = 'desafio de ' + todayStr().slice(5, 10).replace('-', '/');
      } else {
        overLabel.textContent = base;
      }
    }

    overScreen?.classList.remove('hidden');
    this.hud.setHintOpacity('0');
    this.hud.hideTimerBlock();

    if (lbTitle2) {
      lbTitle2.textContent = MODE_LB_TITLES[this.modeType];
      lbTitle2.style.display = this.modeType === 'zen' ? 'none' : 'block';
    }

    if (rankLine) rankLine.textContent = 'Salvando no ranking...';
    if (lbList2) lbList2.innerHTML = '<div class="lbempty">carregando...</div>';

    if (this.modeType !== 'zen') {
      const key = this.getLBKey();
      const ts = Date.now();
      const playerName = (document.getElementById('nameInput') as HTMLInputElement)?.value?.trim().toUpperCase().slice(0, 10) || 'JOGADOR';
      const list = await submitScore(key, { n: playerName, s: this.score, t: ts });
      if (list) {
        renderLBInto(lbList2!, list, ts);
        const lbList = document.getElementById('lbList');
        if (lbList) renderLBInto(lbList, list, ts);
        const idx = list.findIndex(e => e.t === ts);
        if (rankLine) rankLine.textContent = idx >= 0 ? 'Você ficou em #' + (idx + 1) + ' no ranking!' : 'Fora do top 20 — tenta de novo!';
        this._lastRank = idx >= 0 ? idx + 1 : null;
      } else {
        if (rankLine) rankLine.textContent = '';
        if (lbList2) lbList2.innerHTML = '<div class="lbempty">não foi possível carregar o ranking.</div>';
        this._lastRank = null;
      }
    } else {
      if (rankLine) rankLine.textContent = 'Você jogou por ' + Math.round(this.tick) + ' segundos.';
      if (lbList2) lbList2.innerHTML = '<div class="lbempty">Modo zen não tem ranking — só diversão.</div>';
      this._lastRank = null;
    }
    this.onGameOver?.();
  }

  private getCurrentBest(): number {
    switch (this.modeType) {
      case 'free': return this.bestFree.score;
      case 'daily': return this.bestDailyToday.score;
      case 'timed': return this.bestTimed.score;
      case 'survival': return this.bestSurvival.score;
      default: return this.score;
    }
  }

  get lastRank(): number | null { return this._lastRank; }
  get currentBest(): number { return this._currentBest; }

  /** Expose best scores + dates for the start-screen stats row */
  getBestScores(): { free: { score: number; date: string | null }; daily: { score: number; date: string | null }; timed: { score: number; date: string | null }; survival: { score: number; date: string | null } } {
    return {
      free: this.bestFree,
      daily: this.bestDailyToday,
      timed: this.bestTimed,
      survival: this.bestSurvival,
    };
  }
}
