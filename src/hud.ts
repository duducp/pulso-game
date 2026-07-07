import type { PowerUpType } from './types';

/**
 * Manages all in-game HUD DOM updates — score, combo, break mode,
 * power bar, flash overlay, record pace, timer, power-up tag, etc.
 * Game never touches the DOM directly; it delegates to HudManager.
 */
export class HudManager {
  // ─── DOM Refs ─────────────────────────────────────────────
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
  private livesHeartsEl: HTMLElement | null = null;
  private livesTextEl: HTMLElement | null = null;

  constructor() {
    this.cacheDomRefs();
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
    this.livesHeartsEl = document.getElementById('livesHearts');
    this.livesTextEl = document.getElementById('livesText');
  }

  // ─── Reset ────────────────────────────────────────────────
  reset(modeType: string): void {
    this.powerWrapEl?.classList.remove('full', 'urgent');
    this.breakTagEl?.classList.remove('show');
    this.recordBannerEl?.classList.remove('show');
    this.scoreValEl?.classList.remove('gold');
    this.comboTagEl?.classList.remove('show');
    if (this.comboTagEl) this.comboTagEl.textContent = '';
    this.flashOverlayEl?.classList.remove('flash');
    this.hidePowerUpTag();
    this.setAllPowerUpIndicatorsInactive();
    this.hideTimerBlock();
    if (this.hintEl) this.hintEl.style.opacity = modeType === 'zen' ? '0' : '1';
  }

  // ─── Score ────────────────────────────────────────────────
  updateScore(val: number): void {
    if (this.scoreValEl) this.scoreValEl.textContent = String(val);
  }

  setScoreGold(gold: boolean): void {
    this.scoreValEl?.classList.toggle('gold', gold);
  }

  // ─── Speed HUD ───────────────────────────────────────────
  updateSpeedText(text: string): void {
    if (this.speedValEl) this.speedValEl.textContent = text;
  }

  // ─── Timer HUD ───────────────────────────────────────────
  updateTimerText(val: string): void {
    if (this.timerEl) this.timerEl.textContent = val;
  }

  setTimerColor(color: string): void {
    if (this.timerEl) this.timerEl.style.color = color;
  }

  showTimerBlock(): void {
    const el = document.getElementById('timerHud');
    if (el) el.style.display = 'block';
  }

  hideTimerBlock(): void {
    const el = document.getElementById('timerHud');
    if (el) el.style.display = 'none';
  }

  // ─── Power Bar ───────────────────────────────────────────
  updatePowerBar(pct: number): void {
    if (this.powerBarEl) this.powerBarEl.style.width = pct + '%';
  }

  setPowerBarFull(full: boolean): void {
    this.powerWrapEl?.classList.toggle('full', full);
  }

  setPowerBarUrgent(urgent: boolean): void {
    this.powerWrapEl?.classList.toggle('urgent', urgent);
  }

  // ─── Combo Tag ───────────────────────────────────────────
  showComboTag(val: number): void {
    if (this.comboTagEl) {
      this.comboTagEl.textContent = 'x' + val;
      this.comboTagEl.classList.add('show');
    }
  }

  hideComboTag(): void {
    this.comboTagEl?.classList.remove('show');
  }

  // ─── Break Mode Tag ──────────────────────────────────────
  showBreakTag(): void {
    this.breakTagEl?.classList.add('show');
  }

  hideBreakTag(): void {
    this.breakTagEl?.classList.remove('show');
  }

  // ─── Flash Overlay ───────────────────────────────────────
  flashOverlay(rgb: string, alpha: number, durationMs = 200, finalAlpha = '0.15'): void {
    const fel = this.flashOverlayEl;
    if (!fel) return;
    fel.style.background = `rgba(${rgb},${alpha})`;
    fel.classList.add('flash');
    setTimeout(() => {
      fel.classList.remove('flash');
      fel.style.background = `rgba(255,194,77,${finalAlpha})`;
    }, durationMs);
  }

  flashOverlayCustom(rgb: string, alpha: number, finalRgb = '255,194,77', finalAlpha = '0.15', durationMs = 200): void {
    const fel = this.flashOverlayEl;
    if (!fel) return;
    fel.style.background = `rgba(${rgb},${alpha})`;
    fel.classList.add('flash');
    setTimeout(() => {
      fel.classList.remove('flash');
      fel.style.background = `rgba(${finalRgb},${finalAlpha})`;
    }, durationMs);
  }

  resetFlashOverlay(rgb = '255,194,77', alpha = '0.15'): void {
    const fel = this.flashOverlayEl;
    if (fel) {
      fel.classList.remove('flash');
      fel.style.background = `rgba(${rgb},${alpha})`;
    }
  }

  quickFlash(durationMs = 80): void {
    this.flashOverlayEl?.classList.add('flash');
    setTimeout(() => this.flashOverlayEl?.classList.remove('flash'), durationMs);
  }

  // ─── Record Pace ─────────────────────────────────────────
  updateRecordPace(text: string): void {
    if (this.recordPaceEl) {
      this.recordPaceEl.textContent = text;
      this.recordPaceEl.style.opacity = '1';
    }
  }

  setRecordPaceAhead(ahead: boolean): void {
    this.recordPaceEl?.classList.toggle('ahead', ahead);
  }

  setRecordPaceOpacity(opacity: string): void {
    if (this.recordPaceEl) this.recordPaceEl.style.opacity = opacity;
  }

  // ─── Record Banner ───────────────────────────────────────
  showRecordBanner(): void {
    this.recordBannerEl?.classList.add('show');
  }

  hideRecordBanner(): void {
    this.recordBannerEl?.classList.remove('show');
  }

  // ─── Best / Mode Tags ────────────────────────────────────
  updateBestVal(val: number): void {
    if (this.bestValEl) this.bestValEl.textContent = String(val);
  }

  updateModeTag(text: string): void {
    if (this.modeTagEl) this.modeTagEl.textContent = text;
  }

  // ─── Power-Up Tag ────────────────────────────────────────
  showPowerUpTag(html: string): void {
    if (!this.powerUpTagEl) return;
    this.powerUpTagEl.style.display = 'flex';
    this.powerUpTagEl.innerHTML = html;
  }

  hidePowerUpTag(): void {
    if (this.powerUpTagEl) this.powerUpTagEl.style.display = 'none';
  }

  updatePowerUpTimerText(val: string): void {
    if (!this.powerUpTagEl) return;
    const span = this.powerUpTagEl.querySelector('span');
    if (span) span.textContent = val;
  }

  updatePowerUpOrbsText(val: string): void {
    if (!this.powerUpTagEl) return;
    const orbSpan = this.powerUpTagEl.querySelector('.pu-orbs');
    if (orbSpan) orbSpan.textContent = '🪙' + val;
  }

  // ─── Power-Up Indicators ─────────────────────────────────
  private setAllPowerUpIndicatorsInactive(): void {
    if (!this.powerUpIndicatorEls) return;
    for (const el of this.powerUpIndicatorEls) {
      el.classList.remove('active');
    }
  }

  updatePowerUpIndicators(activeType: PowerUpType | null): void {
    if (!this.powerUpIndicatorEls) return;
    for (const el of this.powerUpIndicatorEls) {
      const type = el.getAttribute('data-type');
      el.classList.toggle('active', type === activeType);
    }
  }

  // ─── Hint ─────────────────────────────────────────────────
  // ─── Lives HUD ────────────────────────────────────────────
  updateLives(lives: number, max: number): void {
    if (this.livesHeartsEl) {
      this.livesHeartsEl.textContent = '❤️'.repeat(lives);
    }
    if (this.livesTextEl) {
      this.livesTextEl.textContent = 'x' + lives;
    }
    // Show/hide the whole HUD based on whether player has lives
    const el = this.livesHeartsEl?.parentElement;
    if (el) {
      el.style.display = lives > 0 ? 'flex' : 'none';
    }
  }

  setHintOpacity(val: string): void {
    if (this.hintEl) this.hintEl.style.opacity = val;
  }
}
