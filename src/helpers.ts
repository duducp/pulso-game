/** Navigate.vibrate check removed so callers can just call vibrate(). */
export function vibrate(pattern: number | number[]): void {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Format YYYY-MM-DD → "1 jan" / "12 dez" etc. */
export function formatDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const day = parseInt(parts[2], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(day) || isNaN(month)) return isoDate;
  return day + ' ' + MONTHS[month - 1];
}
