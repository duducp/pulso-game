import type { Player, Obstacle, Particle, TrailPoint, GameMode, GameModeType, GameState } from './types';
import {
  POWER_PASS, POWER_NEAR, BREAK_DURATION, STEP,
  TIMED_DURATION, SURVIVAL_SPEED_MULT,
} from './types';
import { xmur3, mulberry32, todayStr } from './rng';
import {
  spawnRing,
  spawnDots,
  spawnShatter,
  spawnRecordBurst,
  spawnBreakBurst,
  spawnNearText,
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
  isSoundEnabled,
} from './audio';
import { submitScore, loadBest, saveBest } from './storage';
import { renderLBInto } from './ui';

export class Game {
  // ─── Public state (read by renderer & UI) ────────────────
  mode: GameMode = 'menu';
  modeType: GameModeType = 'free';
  player!: Player;
  obstacles: Obstacle[] = [];
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
  }

  setDimensions(W: number, H: number): void {
    this.W = W;
    this.H = H;
  }

  /** Snapshot for the renderer */
  getState(): GameState {
    return {
      mode: this.mode,
      modeType: this.modeType,
      player: this.player,
      obstacles: this.obstacles,
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
      W: this.W,
      H: this.H,
    };
  }

  reset(): void {
    this.player = { x: this.W * 0.28, y: this.H / 2, vy: 0, r: 13, rot: 0 };
    this.obstacles = [];
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

    this.powerWrapEl?.classList.remove('full');
    this.breakTagEl?.classList.remove('show');
    this.recordBannerEl?.classList.remove('show');
    this.scoreValEl?.classList.remove('gold');
    this.comboTagEl?.classList.remove('show');
    if (this.comboTagEl) this.comboTagEl.textContent = '';
    this.flashOverlayEl?.classList.remove('flash');

    // Show/hide timer HUD
    const timerHud = document.getElementById('timerHud');
    if (timerHud) timerHud.style.display = 'none';
    // Show hint for non-zen modes
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
    const keys: Record<GameModeType, string> = {
      free: 'lb:free',
      daily: 'lb:daily:' + todayStr(),
      timed: 'lb:timed',
      survival: 'lb:survival',
      zen: '',
    };
    return keys[this.modeType];
  }

  beginRun(mode: GameModeType): void {
    this.modeType = mode;
    this.dailyMode = mode === 'daily';

    // Load best for this mode
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

    // Show timer for timed mode
    const timerHud = document.getElementById('timerHud');
    if (timerHud) {
      timerHud.style.display = mode === 'timed' ? 'block' : 'none';
    }

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

  update(dt: number): void {
    if (this.paused) return;
    this.tick += dt;

    // ── Difficulty scaling ──
    const speedMult = this.modeType === 'survival' ? SURVIVAL_SPEED_MULT : 1;
    const scoreFactor = this.modeType === 'survival' ? this.score * this.W * 0.018 : this.score * this.W * 0.010;
    this.speed = (this.W * 0.34 + scoreFactor) * speedMult;
    this.gapSize = Math.max(this.H * 0.30 - this.score * 3.2 * speedMult, this.H * 0.20);
    this.bpm = 72 + this.score * 2.4;
    if (this.speedValEl) {
      this.speedValEl.textContent = String(Math.round((this.speed / this.W) * 100));
    }

    // ── Timed mode countdown ──
    if (this.modeType === 'timed') {
      this.timeRemaining -= dt;
      if (this.timerEl) {
        this.timerEl.textContent = String(Math.ceil(this.timeRemaining));
      }
      if (this.timeRemaining <= 0) {
        this.endGame();
        return;
      }
    }

    // ── Spawn ──
    const interval = Math.max(1.5 - this.score * 0.02, 0.9);
    if (this.tick - this.lastSpawn > interval) {
      this.lastSpawn = this.tick;
      this.spawnObstacle();
    }

    // ── Player physics ──
    this.player.vy += this.H * 1.55 * dt;
    this.player.y += this.player.vy * dt;
    this.player.rot = Math.max(-0.5, Math.min(1.1, this.player.vy / 900));
    if (this.player.y - this.player.r < 0) {
      this.player.y = this.player.r;
      this.player.vy = 0;
    }
    if (this.player.y + this.player.r > this.H) {
      if (this.modeType === 'zen') {
        // Zen: bounce back instead of dying
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

    // ── Trail ──
    this.trail.push({ x: this.player.x, y: this.player.y });
    if (this.trail.length > 12) this.trail.shift();

    // ── Obstacle collision ──
    this.updateObstacles();

    // ── Power bar ──
    if (this.powerBarEl) this.powerBarEl.style.width = this.power + '%';

    // ── Particles ──
    updateParticles(this.particles, dt);
    this.particles = this.particles.filter((p) => p.life > 0);

    // ── HUD: record pace ──
    this.updateRecordPace();
  }

  private spawnObstacle(): void {
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
  }

  private gainPower(amount: number): void {
    if (this.breakMode) return;
    this.power = Math.min(100, this.power + amount);
    if (this.power >= 100) {
      this.activateBreakMode();
    }
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
        this.score++;
        if (this.scoreValEl) this.scoreValEl.textContent = String(this.score);
        this.gainPower(POWER_PASS);
        this.checkRecordCrossing();
      }

      const withinX =
        this.player.x + this.player.r > o.x &&
        this.player.x - this.player.r < o.x + o.w;

      if (withinX && !o.broken) {
        const topY = o.gapY;
        const botY = o.gapY + o.gapH;
        const colliding =
          this.player.y - this.player.r < topY ||
          this.player.y + this.player.r > botY;

        if (colliding) {
          if (this.breakMode) {
            if (!o.passed) {
              o.passed = true;
              this.score += 3;
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
          } else if (this.modeType === 'zen') {
            // Zen: obstacles don't kill — just push player back
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
            this.score += 1 + bonus;
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

    this.obstacles = this.obstacles.filter(
      (o) => o.x + o.w > -20 && !o.broken,
    );
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
        this.recordPaceEl.textContent =
          '+' + (this.score - this.targetBest) + ' recorde!';
        this.recordPaceEl.classList.add('ahead');
      } else {
        this.recordPaceEl.textContent =
          'faltam ' + (this.targetBest - this.score) + ' pro recorde';
        this.recordPaceEl.classList.remove('ahead');
      }
    }
  }

  async endGame(): Promise<void> {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.mode = 'over';

    // Zen mode doesn't end naturally — only via quit
    if (this.modeType !== 'zen') {
      soundGameOver();
      if (navigator.vibrate) navigator.vibrate(60);
    }

    // Save best scores
    const bestKey = this.getBestKey();
    if (bestKey) {
      if (this.modeType === 'free' && this.score > this.bestFree) {
        this.bestFree = this.score;
        saveBest(bestKey, this.score);
      } else if (this.modeType === 'daily' && this.score > this.bestDailyToday) {
        this.bestDailyToday = this.score;
        saveBest(bestKey, this.score);
      } else if (this.modeType === 'timed' && this.score > this.bestTimed) {
        this.bestTimed = this.score;
        saveBest(bestKey, this.score);
      } else if (this.modeType === 'survival' && this.score > this.bestSurvival) {
        this.bestSurvival = this.score;
        saveBest(bestKey, this.score);
      }
    }

    this._currentBest = this.getCurrentBest();

    // Update DOM for game-over screen
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

    // Show/hide mode-specific stats
    if (statTime) statTime.style.display = this.modeType === 'zen' ? 'flex' : 'none';
    if (statFalls) statFalls.style.display = this.modeType === 'zen' ? 'flex' : 'none';

    if (overLabel) {
      const labels: Record<GameModeType, string> = {
        free: 'fim de linha',
        daily: 'desafio de ' + todayStr().slice(5, 10).replace('-', '/'),
        timed: 'tempo esgotado!',
        survival: 'você caiu',
        zen: 'modo zen',
      };
      overLabel.textContent = labels[this.modeType];
    }

    overScreen?.classList.remove('hidden');
    if (this.hintEl) this.hintEl.style.opacity = '0';
    const timerHud = document.getElementById('timerHud');
    if (timerHud) timerHud.style.display = 'none';

    // Leaderboard title
    if (lbTitle2) {
      const titles: Record<GameModeType, string> = {
        free: 'Recordes (modo livre)',
        daily: 'Ranking de hoje',
        timed: 'Recordes (cronometrado)',
        survival: 'Recordes (sobrevivência)',
        zen: '',
      };
      lbTitle2.textContent = titles[this.modeType];
      lbTitle2.style.display = this.modeType === 'zen' ? 'none' : 'block';
    }

    if (rankLine) rankLine.textContent = 'Salvando no ranking...';
    if (lbList2) lbList2.innerHTML = '<div class="lbempty">carregando...</div>';

    // Submit to leaderboard (skip zen)
    if (this.modeType !== 'zen') {
      const key = this.getLBKey();
      const ts = Date.now();
      const playerName =
        (document.getElementById('nameInput') as HTMLInputElement)?.value?.trim().toUpperCase().slice(0, 10) ||
        'JOGADOR';
      const list = await submitScore(key, { n: playerName, s: this.score, t: ts });

      if (list) {
        renderLBInto(lbList2!, list, ts);
        const lbList = document.getElementById('lbList');
        if (lbList) renderLBInto(lbList, list, ts);
        const idx = list.findIndex((e) => e.t === ts);
        if (rankLine) {
          rankLine.textContent =
            idx >= 0
              ? 'Você ficou em #' + (idx + 1) + ' no ranking!'
              : 'Fora do top 20 — tenta de novo!';
        }
        this._lastRank = idx >= 0 ? idx + 1 : null;
      } else {
        if (rankLine) rankLine.textContent = '';
        if (lbList2) lbList2.innerHTML = '<div class="lbempty">não foi possível carregar o ranking.</div>';
        this._lastRank = null;
      }
    } else {
      if (rankLine) {
        rankLine.textContent = 'Você jogou por ' + Math.round(this.tick) + ' segundos.';
      }
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

  get lastRank(): number | null {
    return this._lastRank;
  }

  get currentBest(): number {
    return this._currentBest;
  }
}
