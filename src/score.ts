import type { GameModeType } from './types';
import { MODE_LABELS, MODE_BEST_KEYS } from './modes';
import { todayStr } from './rng';
import { loadBestRecord, saveBestRecord } from './storage';

/** Best score with date it was achieved. */
export interface BestScore {
  score: number;
  date: string | null;
}

/**
 * Manages best score data, persistence, and pure computation.
 * No DOM, no HUD, no audio — pure data + async storage.
 */
export class ScoreManager {
  // ─── Best scores per mode ──────────────────────────────
  bestFree: BestScore = { score: 0, date: null };
  bestDailyToday: BestScore = { score: 0, date: null };
  bestTimed: BestScore = { score: 0, date: null };
  bestSurvival: BestScore = { score: 0, date: null };

  // ─── Session state ─────────────────────────────────────
  lastRank: number | null = null;
  currentBest = 0;
  private _modeType: GameModeType = 'free';

  setModeType(mode: GameModeType): void {
    this._modeType = mode;
  }

  /** Reset session state (keeps persisted best scores). */
  reset(): void {
    this.lastRank = null;
    this.currentBest = 0;
  }

  // ─── Persistence ────────────────────────────────────────
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

  /**
   * If the given score beats the current best for the mode,
   * save it and update the in-memory record.
   * Returns true if a new record was set.
   */
  saveBestIfNeeded(score: number, modeType: GameModeType): boolean {
    const today = todayStr();
    let isNewRecord = false;

    if (modeType === 'free' && score > this.bestFree.score) {
      this.bestFree = { score, date: today };
      saveBestRecord('profile:best:free', score, today);
      isNewRecord = true;
    } else if (modeType === 'daily' && score > this.bestDailyToday.score) {
      this.bestDailyToday = { score, date: today };
      saveBestRecord('profile:best:daily:' + today, score, today);
      isNewRecord = true;
    } else if (modeType === 'timed' && score > this.bestTimed.score) {
      this.bestTimed = { score, date: today };
      saveBestRecord('profile:best:timed', score, today);
      isNewRecord = true;
    } else if (modeType === 'survival' && score > this.bestSurvival.score) {
      this.bestSurvival = { score, date: today };
      saveBestRecord('profile:best:survival', score, today);
      isNewRecord = true;
    }

    return isNewRecord;
  }

  // ─── Pure computation ───────────────────────────────────
  getModeLabel(modeType: GameModeType): string {
    const base = MODE_LABELS[modeType];
    if (modeType === 'daily') {
      return base + ' · ' + todayStr().slice(5, 10).replace('-', '/');
    }
    return base;
  }

  getBestKey(modeType: GameModeType): string {
    const base = MODE_BEST_KEYS[modeType];
    if (modeType === 'daily') {
      return base + todayStr();
    }
    return base;
  }

  getLBKey(modeType: GameModeType): string {
    return this.getBestKey(modeType).replace('profile:best:', 'lb:');
  }

  getTargetBestForMode(modeType: GameModeType): number {
    if (modeType === 'free') return this.bestFree.score;
    if (modeType === 'daily') return this.bestDailyToday.score;
    if (modeType === 'timed') return this.bestTimed.score;
    if (modeType === 'survival') return this.bestSurvival.score;
    return 0;
  }

  getCurrentBest(modeType: GameModeType): number {
    switch (modeType) {
      case 'free': return this.bestFree.score;
      case 'daily': return this.bestDailyToday.score;
      case 'timed': return this.bestTimed.score;
      case 'survival': return this.bestSurvival.score;
      default: return 0;
    }
  }

  /** Expose best scores + dates for the start-screen stats row. */
  getBestScores(): {
    free: BestScore;
    daily: BestScore;
    timed: BestScore;
    survival: BestScore;
  } {
    return {
      free: this.bestFree,
      daily: this.bestDailyToday,
      timed: this.bestTimed,
      survival: this.bestSurvival,
    };
  }
}
