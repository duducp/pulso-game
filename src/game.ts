import type { Player, Obstacle, Particle, TrailPoint, GameMode, GameModeType, GameState, PowerUp, PowerUpType } from './types';
import {
  POWER_PASS, POWER_NEAR, BREAK_DURATION, STEP,
  TIMED_DURATION, SURVIVAL_SPEED_MULT,
  POWERUP_SHIELD_DURATION,
  POWERUP_SLOWMO_DURATION, POWERUP_DOUBLE_DURATION,
  POWERUP_SLOWMO_FACTOR, POWERUP_DOUBLE_FACTOR,
  POWERUP_MAGNET_DURATION, MAGNET_ORBS_PER_PASS,
  POWERUP_FREEZE_DURATION, POWERUP_PLATING_DURATION, POWERUP_AUTOFOCUS_DURATION,
  POWERUP_WEIGHTS, POWERUPS_BY_MODE,
} from './types';
import { xmur3, mulberry32, todayStr } from './rng';
import {
  spawnRing,
  spawnDots,
  spawnShatter,
  spawnRecordBurst,
  spawnBreakBurst,
  spawnNearText,
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
  isSoundEnabled,
} from './audio';
import { submitScore, loadBest, saveBest } from './storage';
import { renderLBInto } from './ui';

const POWERUP_ICONS: Record<PowerUpType, string> = {
  shield: '🛡️',
  slowmo: '⏱️',
  doublepulse: '💥',
  magnet: '🧲',
  freeze: '❄️',
  plating: '🔰',
  autofocus: '🎯',
};

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
  slowmoMultiplier = 1;
  scoreMultiplier = 1;

  W: number;
  H: number;

  // ─── Internal ────────────────────────────────────────────
  private lastSpawn = 0;
  private rng: () => number = Math.random;
  private bestFree = 0;
  private bestDailyToday = 0;
  private bestTimed = 0;
  private bestSurvival = 0;
  private _lastRank: number | null = null;
  private _currentBest = 0;
  private recordPaceEl: HTMLElement | null = null;
  private recordBannerEl: HTMLElement | null = null;
  private scoreValEl: HTMLElement | null = null;
  private comboTagEl: HTMLElement | null = null;
  private breakTagEl: HTMLElement | null = null;
  private powerWrapEl: HTMLElement | null = null;
  private powerBarEl: HTMLElement | null = null;
  private flashOverlayEl: HTMLElement | null = null;
  private speedValEl: HTMLElement | null = null;
  private bestValEl: HTMLElement | null = null;
  private modeTagEl: HTMLElement | null = null;
  private hintEl: HTMLElement | null = null;
  private timerEl: HTMLElement | null = null;
  private powerUpTagEl: HTMLElement | null = null;
  private powerUpIndicatorEls: NodeListOf<Element> | null = null;

  onGameOver?: () => void;

  constructor(W: number, H: number) {
    this.W = W;
    this.H = H;
    this.cacheDomRefs();
    this.reset();
  }

  private cacheDomRefs(): void {
    this.recordPaceEl = document.getElementById('recordPace');
    this.recordBannerEl = document.getElementById('recordBanner');
    this.scoreValEl = document.getElementById('scoreVal');
    this.comboTagEl = document.getElementById('comboTag');
    this.breakTagEl = document.getElementById('breakTag');
    this.powerWrapEl = document.getElementById('powerWrap');
    this.powerBarEl = document.getElementById('powerBar');
    this.flashOverlayEl = document.getElementById('flashOverlay');
    this.speedValEl = document.getElementById('speedVal');
    this.bestValEl = document.getElementById('bestVal');
    this.modeTagEl = document.getElementById('modeTag');
    this.hintEl = document.getElementById('hint');
    this.timerEl = document.getElementById('timerVal');
    this.powerUpTagEl = document.getElementById('powerUpTag');
    this.powerUpIndicatorEls = document.querySelectorAll('.pu-indicator');
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
    this.slowmoMultiplier = 1;
    this.scoreMultiplier = 1;

    this.powerWrapEl?.classList.remove('full');
    this.breakTagEl?.classList.remove('show');
    this.recordBannerEl?.classList.remove('show');
    this.scoreValEl?.classList.remove('gold');
    this.comboTagEl?.classList.remove('show');
    if (this.comboTagEl) this.comboTagEl.textContent = '';
    this.flashOverlayEl?.classList.remove('flash');
    if (this.powerUpTagEl) {
      this.powerUpTagEl.style.display = 'none';
    }
    this.updatePowerUpIndicators();

    const timerHud = document.getElementById('timerHud');
    if (timerHud) timerHud.style.display = 'none';
    if (this.hintEl) this.hintEl.style.opacity = this.modeType === 'zen' ? '0' : '1';

    if (this.dailyMode) {
      const seedGen = xmur3(todayStr());
      this.rng = mulberry32(seedGen());
    } else {
      this.rng = Math.random;
    }
  }

  async loadPersistedData(): Promise<void> {
    const [bestFree, bestDaily, bestTimed, bestSurvival] = await Promise.all([
      loadBest('profile:best:free'),
      loadBest('profile:best:daily:' + todayStr()),
      loadBest('profile:best:timed'),
      loadBest('profile:best:survival'),
    ]);
    this.bestFree = bestFree;
    this.bestDailyToday = bestDaily;
    this.bestTimed = bestTimed;
    this.bestSurvival = bestSurvival;
  }

  getModeLabel(): string {
    const labels: Record<GameModeType, string> = {
      free: 'MODO LIVRE',
      daily: 'DESAFIO DE HOJE · ' + todayStr().slice(5, 10).replace('-', '/'),
      timed: 'CRONOMETRADO',
      survival: 'SOBREVIVÊNCIA',
      zen: 'ZEN',
    };
    return labels[this.modeType];
  }

  getBestKey(): string {
    const keys: Record<GameModeType, string> = {
      free: 'profile:best:free',
      daily: 'profile:best:daily:' + todayStr(),
      timed: 'profile:best:timed',
      survival: 'profile:best:survival',
      zen: '',
    };
    return keys[this.modeType];
  }

  getLBKey(): string {
    return this.getBestKey().replace('profile:best:', 'lb:');
  }

  beginRun(mode: GameModeType): void {
    this.modeType = mode;
    this.dailyMode = mode === 'daily';

    if (mode === 'free') this.targetBest = this.bestFree;
    else if (mode === 'daily') this.targetBest = this.bestDailyToday;
    else if (mode === 'timed') this.targetBest = this.bestTimed;
    else if (mode === 'survival') this.targetBest = this.bestSurvival;
    else this.targetBest = 0;

    this.timeRemaining = mode === 'timed' ? TIMED_DURATION : 0;
    this.reset();
    this.mode = 'playing';

    const startScreen = document.getElementById('startScreen');
    const overScreen = document.getElementById('overScreen');
    startScreen?.classList.add('hidden');
    overScreen?.classList.add('hidden');

    if (this.modeTagEl) this.modeTagEl.textContent = this.getModeLabel();
    if (this.bestValEl) this.bestValEl.textContent = String(this.targetBest);

    const timerHud = document.getElementById('timerHud');
    if (timerHud) timerHud.style.display = mode === 'timed' ? 'block' : 'none';

    if (this.recordPaceEl) {
      if (mode === 'zen') {
        this.recordPaceEl.textContent = 'sem game over — relaxe';
        this.recordPaceEl.style.opacity = '1';
      } else if (this.targetBest > 0) {
        this.recordPaceEl.textContent = 'faltam ' + this.targetBest + ' pro recorde';
        this.recordPaceEl.classList.remove('ahead');
        this.recordPaceEl.style.opacity = '1';
      } else {
        this.recordPaceEl.textContent = 'definindo seu recorde';
        this.recordPaceEl.style.opacity = '1';
      }
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
      ps?.classList.add('visible');
    } else if (this.mode === 'paused') {
      soundUnpause();
      ps?.classList.remove('visible');
      setTimeout(() => {
        if (this.mode === 'paused') {
          wrap?.classList.remove('paused');
          this.paused = false;
          this.mode = 'playing';
        }
      }, 250);
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
    // Weighted random selection from types available in this mode
    const types = POWERUPS_BY_MODE[this.modeType];
    const totalWeight = types.reduce((s, t) => s + POWERUP_WEIGHTS[t], 0);
    let roll = this.rng() * totalWeight;
    let type: PowerUpType = types[0];
    for (const t of types) {
      roll -= POWERUP_WEIGHTS[t];
      if (roll <= 0) { type = t; break; }
    }
    // Position within the obstacle gap, with variance for difficulty
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

    // Visual flash based on type
    const flashColors: Record<PowerUpType, string> = {
      shield: '93,186,255', slowmo: '187,134,252', doublepulse: '255,107,157',
      magnet: '255,215,0', freeze: '0,229,255', plating: '255,138,101', autofocus: '206,147,216',
    };
    const color = flashColors[pu.type];
    const fel = this.flashOverlayEl;
    if (fel) {
      fel.style.background = `rgba(${color},0.2)`;
      fel.classList.add('flash');
      setTimeout(() => {
        fel.classList.remove('flash');
        fel.style.background = 'rgba(255,194,77,0.15)';
      }, 200);
    }

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
        break;
      case 'freeze':
        this.activePowerUp = 'freeze';
        this.powerUpTimer = POWERUP_FREEZE_DURATION;
        // Add a small time bonus on collect
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
    if (this.powerUpTagEl) {
      this.powerUpTagEl.style.display = 'flex';
      this.powerUpTagEl.innerHTML = `${POWERUP_ICONS[pu.type]} <span>${Math.ceil(this.powerUpTimer)}</span>`;
    }
    this.updatePowerUpIndicators();
  }

  private updatePowerUpIndicators(): void {
    if (!this.powerUpIndicatorEls) return;
    for (const el of this.powerUpIndicatorEls) {
      const type = el.getAttribute('data-type');
      el.classList.toggle('active', type === this.activePowerUp);
    }
  }

  update(dt: number): void {
    if (this.paused) return;
    this.tick += dt;

    // ── Power-up timer ──
    if (this.activePowerUp && this.powerUpTimer > 0) {
      this.powerUpTimer -= dt;
      if (this.powerUpTagEl) {
        const span = this.powerUpTagEl.querySelector('span');
        if (span) span.textContent = String(Math.ceil(this.powerUpTimer));
      }
      if (this.powerUpTimer <= 0) {
        this.activePowerUp = null;
        this.powerUpTimer = 0;
        this.slowmoMultiplier = 1;
        this.scoreMultiplier = 1;
        if (this.powerUpTagEl) this.powerUpTagEl.style.display = 'none';
        this.updatePowerUpIndicators();
        // Clean up any remaining magnet orbs
        this.particles = this.particles.filter(p => p.type !== 'orb');
      }
    }

    // ── SlowMo recovery (return speed gradually) ──
    if (this.slowmoMultiplier < 1) {
      this.slowmoMultiplier = Math.min(1, this.slowmoMultiplier + dt * 0.5);
    }

    // ── Difficulty scaling ──
    const speedMult = (this.modeType === 'survival' ? SURVIVAL_SPEED_MULT : 1) * this.slowmoMultiplier;
    const scoreFactor = this.modeType === 'survival' ? this.score * this.W * 0.018 : this.score * this.W * 0.010;
    this.speed = (this.W * 0.34 + scoreFactor) * speedMult;
    this.gapSize = Math.max(this.H * 0.30 - this.score * 3.2 * speedMult, this.H * 0.20);
    this.bpm = 72 + this.score * 2.4;
    if (this.speedValEl) {
      this.speedValEl.textContent = String(Math.round((this.speed / this.W) * 100));
    }

    // ── Timed mode countdown (paused during freeze) ──
    if (this.modeType === 'timed') {
      if (this.activePowerUp !== 'freeze') {
        this.timeRemaining -= dt;
      }
      if (this.timerEl) this.timerEl.textContent = String(Math.ceil(this.timeRemaining));
      if (this.timerEl) this.timerEl.style.color = this.activePowerUp === 'freeze' ? 'var(--cyan)' : 'var(--red)';
      if (this.timeRemaining <= 0) { this.endGame(); return; }
    }

    // ── Spawn obstacles + power-ups ──
    const interval = Math.max(1.5 - this.score * 0.02, 0.9);
    if (this.tick - this.lastSpawn > interval) {
      this.lastSpawn = this.tick;
      const gapInfo = this.spawnObstacle();
      // Spawn power-up inside the obstacle's gap — chance scales with score/difficulty
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
    if (this.player.y - this.player.r < 0) { this.player.y = this.player.r; this.player.vy = 0; }
    if (this.player.y + this.player.r > this.H) {
      if (this.modeType === 'zen') {
        this.player.y = this.H - this.player.r;
        this.player.vy = -this.H * 0.4;
        this.zenFalls++;
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
        this.powerWrapEl?.classList.remove('full');
        this.breakTagEl?.classList.remove('show');
      }
    }
    if (this.shakeTime > 0) this.shakeTime -= dt;

    this.trail.push({ x: this.player.x, y: this.player.y });
    if (this.trail.length > 12) this.trail.shift();

    this.updateObstacles();

    if (this.powerBarEl) this.powerBarEl.style.width = this.power + '%';

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
        // Orb lifetime decreases faster when close to player
        if (dist < 60) p.life -= dt * 0.8;
      }
    }

    // ── Collect orbs that reach the player ──
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.type === 'orb' && this.activePowerUp === 'magnet') {
        const dx = (this.player.x + 10) - p.x;
        const dy = this.player.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.player.r + 8) {
          this.score += 1;
          if (this.scoreValEl) this.scoreValEl.textContent = String(this.score);
          soundOrbCollect();
          this.particles.splice(i, 1);
        }
      }
    }

    updateParticles(this.particles, dt);
    this.particles = this.particles.filter(p => p.life > 0);

    // ── Autofocus: guide player toward nearest gap center ──
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
      // Cap velocity so it's smooth
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
    this.powerWrapEl?.classList.add('full');
    this.breakTagEl?.classList.add('show');
    soundBreak();
    if (navigator.vibrate) navigator.vibrate(40);
    spawnBreakBurst(this.particles, this.player.x, this.player.y);
    this.flashOverlayEl?.classList.add('flash');
    setTimeout(() => this.flashOverlayEl?.classList.remove('flash'), 80);
  }

  private updateObstacles(): void {
    for (const o of this.obstacles) {
      o.x -= this.speed * STEP;

      if (!o.passed && o.x + o.w < this.player.x - this.player.r) {
        o.passed = true;
        if (!o.nearCounted) {
          this.combo = 0;
          this.comboTagEl?.classList.remove('show');
        }
        const points = Math.floor(1 * this.scoreMultiplier);
        this.score += points;
        if (this.scoreValEl) this.scoreValEl.textContent = String(this.score);
        this.gainPower(POWER_PASS);
        this.checkRecordCrossing();
        // Magnet: spawn extra orbs when passing obstacles
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
              if (this.scoreValEl) this.scoreValEl.textContent = String(this.score);
              this.checkRecordCrossing();
            }
            o.broken = true;
            this.shakeTime = 0.18;
            soundBreak();
            if (navigator.vibrate) navigator.vibrate(30);
            this.flashOverlayEl?.classList.add('flash');
            setTimeout(() => this.flashOverlayEl?.classList.remove('flash'), 80);
            spawnShatter(this.particles, o.x, 0, topY, o.w);
            spawnShatter(this.particles, o.x, botY, this.H, o.w);
          } else if (this.activePowerUp === 'shield' || this.activePowerUp === 'plating') {
            // Shield / Plating absorbs collision
            const isPlating = this.activePowerUp === 'plating';
            if (!isPlating) {
              // Shield: consumed after 1 hit
              this.activePowerUp = null;
              this.powerUpTimer = 0;
              if (this.powerUpTagEl) this.powerUpTagEl.style.display = 'none';
              this.updatePowerUpIndicators();
            }
            this.shakeTime = 0.15;
            soundBreak();
            if (navigator.vibrate) navigator.vibrate(20);
            // Visual flash
            const flashRgb = isPlating ? '255,138,101' : '93,186,255';
            const fel = this.flashOverlayEl;
            if (fel) {
              fel.style.background = `rgba(${flashRgb},0.25)`;
              fel.classList.add('flash');
              setTimeout(() => {
                fel.classList.remove('flash');
                fel.style.background = 'rgba(255,194,77,0.15)';
              }, 150);
            }
            spawnShatter(this.particles, o.x, 0, topY, o.w);
            spawnShatter(this.particles, o.x, botY, this.H, o.w);
            // Push player back instead of dying
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
            if (this.scoreValEl) this.scoreValEl.textContent = String(this.score);
            soundNear();

            if (this.combo > 1 && this.comboTagEl) {
              this.comboTagEl.textContent = 'x' + this.combo;
              this.comboTagEl.classList.add('show');
            } else {
              this.comboTagEl?.classList.remove('show');
            }
            spawnNearText(this.particles, this.player.x, this.player.y);
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
      this.scoreValEl?.classList.add('gold');
      this.recordBannerEl?.classList.add('show');
      this.shakeTime = Math.max(this.shakeTime, 0.15);
      soundRecord();
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
      setTimeout(() => this.recordBannerEl?.classList.remove('show'), 1500);
      spawnRecordBurst(this.particles, this.player.x, this.player.y);
    }
  }

  private updateRecordPace(): void {
    if (!this.recordPaceEl) return;
    if (this.modeType === 'zen') return;
    if (this.targetBest > 0) {
      if (this.recordCrossed) {
        this.recordPaceEl.textContent = '+' + (this.score - this.targetBest) + ' recorde!';
        this.recordPaceEl.classList.add('ahead');
      } else {
        this.recordPaceEl.textContent = 'faltam ' + (this.targetBest - this.score) + ' pro recorde';
        this.recordPaceEl.classList.remove('ahead');
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
      if (this.modeType === 'free' && this.score > this.bestFree) { this.bestFree = this.score; saveBest(bestKey, this.score); }
      else if (this.modeType === 'daily' && this.score > this.bestDailyToday) { this.bestDailyToday = this.score; saveBest(bestKey, this.score); }
      else if (this.modeType === 'timed' && this.score > this.bestTimed) { this.bestTimed = this.score; saveBest(bestKey, this.score); }
      else if (this.modeType === 'survival' && this.score > this.bestSurvival) { this.bestSurvival = this.score; saveBest(bestKey, this.score); }
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
    if (this.bestValEl) this.bestValEl.textContent = String(this._currentBest);
    if (finalTime) finalTime.textContent = String(Math.round(this.tick));
    if (statFalls) statFalls.textContent = String(this.zenFalls);

    if (statTime) statTime.style.display = this.modeType === 'zen' ? 'flex' : 'none';
    if (statFalls) statFalls.style.display = this.modeType === 'zen' ? 'flex' : 'none';

    if (overLabel) {
      const labels: Record<GameModeType, string> = {
        free: 'fim de linha', daily: 'desafio de ' + todayStr().slice(5, 10).replace('-', '/'),
        timed: 'tempo esgotado!', survival: 'você caiu', zen: 'modo zen',
      };
      overLabel.textContent = labels[this.modeType];
    }

    overScreen?.classList.remove('hidden');
    if (this.hintEl) this.hintEl.style.opacity = '0';
    const timerHud = document.getElementById('timerHud');
    if (timerHud) timerHud.style.display = 'none';

    if (lbTitle2) {
      const titles: Record<GameModeType, string> = {
        free: 'Recordes (modo livre)', daily: 'Ranking de hoje',
        timed: 'Recordes (cronometrado)', survival: 'Recordes (sobrevivência)', zen: '',
      };
      lbTitle2.textContent = titles[this.modeType];
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
      case 'free': return this.bestFree;
      case 'daily': return this.bestDailyToday;
      case 'timed': return this.bestTimed;
      case 'survival': return this.bestSurvival;
      default: return this.score;
    }
  }

  get lastRank(): number | null { return this._lastRank; }
  get currentBest(): number { return this._currentBest; }
}
