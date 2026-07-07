import type { LeaderboardEntry } from './types';

const STORAGE_PREFIX = 'pulso:';

/** Load a list of leaderboard entries. */
export async function loadList(key: string): Promise<LeaderboardEntry[]> {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

/** Submit a score and return the updated (sorted, truncated) list. */
export async function submitScore(
  key: string,
  entry: LeaderboardEntry,
): Promise<LeaderboardEntry[] | null> {
  try {
    const list = await loadList(key);
    list.push(entry);
    list.sort((a, b) => b.s - a.s);
    list.splice(20); // keep top 20
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(list));
    return list;
  } catch {
    return null;
  }
}

/** Load a single string value. */
function loadVal(key: string): string | null {
  try {
    return localStorage.getItem(STORAGE_PREFIX + key);
  } catch {
    return null;
  }
}

/** Save a single string value. */
function saveVal(key: string, val: string): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, val);
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export async function loadName(): Promise<string> {
  return loadVal('profile:name') ?? '';
}

export function saveName(name: string): void {
  saveVal('profile:name', name);
}

/** Load best score with the date it was achieved. Returns { score, date } or { score: 0, date: null }. */
export async function loadBestRecord(key: string): Promise<{ score: number; date: string | null }> {
  const raw = loadVal(key);
  if (!raw) return { score: 0, date: null };
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && 's' in parsed) {
      return { score: parsed.s as number, date: (parsed.d as string) ?? null };
    }
  } catch { /* old format */ }
  return { score: parseInt(raw, 10) || 0, date: null };
}

/** Save best score with the current date. */
export function saveBestRecord(key: string, score: number, date: string): void {
  saveVal(key, JSON.stringify({ s: score, d: date }));
}
