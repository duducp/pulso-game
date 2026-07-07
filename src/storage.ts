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

export async function loadBest(key: string): Promise<number> {
  const raw = loadVal(key);
  return raw ? (parseInt(raw, 10) || 0) : 0;
}

export function saveBest(key: string, val: number): void {
  saveVal(key, String(val));
}

export function escapeHtml(s: string): string {
  return String(s).replace(
    /[&<>"']/g,
    (c: string) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c] ?? c,
  );
}
