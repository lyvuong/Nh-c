import { useRef } from 'react';
import type { TouchEvent } from 'react';

const MIN_DISTANCE = 70;
const MAX_DURATION_MS = 600;

// Touch handlers that call onSwipeLeft / onSwipeRight for a quick, mostly-horizontal swipe.
// Swipes that start on form controls (selects, inputs, sliders) are ignored.
export function useSwipe(onSwipeLeft?: () => void, onSwipeRight?: () => void) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);

  const onTouchStart = (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    if (e.touches.length !== 1 || target.closest('select, input, textarea, [role="slider"]')) {
      start.current = null;
      return;
    }
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };

  const onTouchEnd = (e: TouchEvent) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Date.now() - s.t > MAX_DURATION_MS) return;
    if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) onSwipeLeft?.();
    else onSwipeRight?.();
  };

  return { onTouchStart, onTouchEnd };
}
