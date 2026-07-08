/** Centralised vibrate — safe to call even on devices without support. */
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

/** Today's date as YYYY-MM-DD string. */
export function todayStr(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

/** Today's date as MM/DD (from YYYY-MM-DD). */
export function todayShortStr(): string {
  return todayStr().slice(5, 10).replace('-', '/');
}

/**
 * Gesture swipe detection helper.
 * Calls onLeft or onRight when a horizontal swipe exceeds threshold.
 */
export function onSwipe(
  el: HTMLElement,
  onLeft: () => void,
  onRight: () => void,
  threshold = 30,
  onStart?: () => void,
): void {
  let startX = 0;
  let startY = 0;

  el.addEventListener('touchstart', (e: Event) => {
    const te = e as TouchEvent;
    startX = te.touches[0].clientX;
    startY = te.touches[0].clientY;
    onStart?.();
  }, { passive: true });

  el.addEventListener('touchend', (e: Event) => {
    const te = e as TouchEvent;
    const dx = te.changedTouches[0].clientX - startX;
    const dy = te.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.5) {
      e.preventDefault();
      if (dx < 0) onLeft();
      else onRight();
    }
  }, { passive: false });
}
