// useKeyHold — RAF-driven keyboard hold detection.
//
// Correctly handles:
//   • e.repeat suppression (browsers fire repeated keydown while held)
//   • Continuous scale growth 1.0 → 2.5 over 2 s via requestAnimationFrame
//   • Multi-key: releasing one key while another is down transfers hold to the new key
//
// Callbacks
//   onTrigger(key)          — fires on first keydown for a key (not repeats)
//   onScaleChange(key, s)   — fires each rAF frame (~60 fps) while key is held;
//                             s grows from 1.0 → 2.5 over 2000 ms
//   onRelease(key)          — fires on keyup for the currently tracked key

import { useEffect, useRef, useCallback } from 'react'

interface KeyHoldState {
  key:        string | null
  startTime:  number | null
  scale:      number
  isHolding:  boolean
}

export function useKeyHold(
  onTrigger:    (key: string) => void,
  onScaleChange: (key: string, scale: number) => void,
  onRelease:    (key: string) => void,
) {
  const stateRef = useRef<KeyHoldState>({
    key: null, startTime: null, scale: 1, isHolding: false,
  })
  const rafRef = useRef<number | null>(null)

  // Stable callback refs so the RAF loop never closes over stale functions
  const onTriggerRef     = useRef(onTrigger)
  const onScaleChangeRef = useRef(onScaleChange)
  const onReleaseRef     = useRef(onRelease)
  useEffect(() => { onTriggerRef.current     = onTrigger    }, [onTrigger])
  useEffect(() => { onScaleChangeRef.current = onScaleChange }, [onScaleChange])
  useEffect(() => { onReleaseRef.current     = onRelease    }, [onRelease])

  const tick = useCallback(() => {
    const s = stateRef.current
    if (!s.isHolding || s.startTime === null || s.key === null) return

    const elapsed  = Date.now() - s.startTime
    // 1.0 at t=0, 2.5 at t=2000 ms, clamped
    const newScale = Math.min(1.0 + (elapsed / 2000) * 1.5, 2.5)
    s.scale = newScale
    onScaleChangeRef.current(s.key, newScale)

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CRITICAL: ignore browser's auto-repeat keydown events
      if (e.repeat) return

      const key = e.key.toLowerCase()
      // Only handle printable alphanum characters
      if (key.length !== 1 || !/[a-z0-9]/.test(key)) return

      const s = stateRef.current

      // If a different key was already held, release it first
      if (s.isHolding && s.key !== null && s.key !== key) {
        const prev = s.key
        s.isHolding = false
        if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
        onReleaseRef.current(prev)
      }

      // Start new hold
      stateRef.current = { key, startTime: Date.now(), scale: 1, isHolding: true }
      onTriggerRef.current(key)
      rafRef.current = requestAnimationFrame(tick)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const s   = stateRef.current
      if (s.key !== key || !s.isHolding) return

      s.isHolding = false
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      onReleaseRef.current(key)
    }

    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keyup',   handleKeyUp,   true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('keyup',   handleKeyUp,   true)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      // Fire release for any in-progress hold so consumers can clean up
      const s = stateRef.current
      if (s.isHolding && s.key !== null) {
        s.isHolding = false
        onReleaseRef.current(s.key)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])
}
