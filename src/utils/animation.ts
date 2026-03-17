// animation.ts — shared animation helpers and spring physics constants.

/** Framer Motion spring config for the elastic bounce-back after key-hold release. */
export const SPRING_BACK = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 20,
  mass: 0.8,
}

/** Critically damped spring for drag release drift-back (~800ms). */
export const DRAG_SPRING = {
  type: 'spring' as const,
  stiffness: 120,
  damping: 18,
  mass: 1,
}

/** Framer Motion transition for the glow fade-in on item trigger. */
export const GLOW_TRANSITION = {
  duration: 0.15,
  ease: 'easeOut' as const,
}

/** Beat-pulse scale variants (1.0 → 1.08 → 1.0). */
export const BEAT_PULSE_VARIANTS = {
  idle: { scale: 1 },
  pulse: { scale: 1.08, transition: { duration: 0.15, ease: 'easeInOut' } },
}

/**
 * Sine-wave float offset for idle items.
 * Each item should use a different phase offset to avoid synchronised movement.
 * @param phase  radians offset (0–2π)
 * @param time   elapsed seconds
 * @param period seconds per cycle (4–6)
 * @param amp    pixels (3–5)
 */
export function floatOffset(phase: number, time: number, period = 5, amp = 4): number {
  return Math.sin((2 * Math.PI * time) / period + phase) * amp
}

/** Linear interpolate between a and b by t (0–1). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
