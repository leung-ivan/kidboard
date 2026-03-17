// PlaygroundItem — a single interactive playground circle.
//
// Animation layers (bottom→top):
//   1. Position wrapper  — absolute placement at homeX/homeY, centres the item
//   2. Drag layer        — free drag (toddler/preschool), springs back to 0 on release
//   3. Float layer       — slow sine-wave y-drift via RAF + MotionValue (no re-render)
//   4a. Beat-pulse layer — MotionValue beatScaleMV driven by short animate() bursts
//   4b. Hold-grow layer  — animate prop { scale: holdScale }, RAF-driven via useKeyHold
//   5. Glow layer        — background fill + box-shadow, animates on glow color change
//   6. Label             — item name below circle in preschool mode

import React, { memo, useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import { DRAG_SPRING } from '@/utils/animation'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlaygroundItemProps {
  id: string
  label: string
  homeX: number             // px from left edge of viewport
  homeY: number             // px from top edge of viewport
  size: number              // circle diameter in px
  glowColor: string | null  // null = no glow
  isHeld: boolean
  beatTick: number          // increments each beat; use as effect dep to pulse
  showLabel: boolean        // preschool mode
  // Float variation (deterministic per item so they don't all move in sync)
  phaseOffset: number       // radians (0–2π)
  floatPeriod: number       // seconds (baby: 6–10, toddler/preschool: 4–6)
  floatAmplitude: number    // pixels (baby: 4–6, toddler/preschool: 3–5)
  // Drag — disabled in baby mode
  dragEnabled: boolean
  vpW: number               // viewport width for drag constraints
  vpH: number               // viewport height for drag constraints
  // Beat pulse intensity: baby = 1.06 (gentler), toddler/preschool = 1.08
  beatPulseScale?: number
  // Hold-grow scale: 1.0 (idle) → 2.5 (max held), driven by RAF loop in Playground
  // Passed as a numeric prop so Framer Motion's animate={{ scale }} can apply it
  // immediately (duration:0) without relying on animate(MotionValue, ...) internals
  holdScale?: number
  // Optional SVG content rendered centered inside the circle
  graphic?: React.ReactNode
}

// ---------------------------------------------------------------------------
// Spring configs
// ---------------------------------------------------------------------------

// Ease-out-elastic feel: low damping creates overshoot → settle in ~400ms
const RELEASE_SPRING = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 11,
  mass: 0.45,
}

// Minimum px clearance between circle rim and viewport edge when dragging
const EDGE_PAD = 16

// ---------------------------------------------------------------------------
// Float hook — sine-wave y motion value driven by RAF, no React re-renders
// ---------------------------------------------------------------------------

function useFloatY(
  phase: number,
  period: number,
  amplitude: number,
): ReturnType<typeof useMotionValue<number>> {
  const floatY = useMotionValue(0)

  useEffect(() => {
    const start = performance.now()
    let rafId: number

    const tick = (now: number) => {
      const t = (now - start) / 1000
      floatY.set(Math.sin((2 * Math.PI * t) / period + phase) * amplitude)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafId)
  }, [floatY, phase, period, amplitude])

  return floatY
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PlaygroundItem = memo(({
  label,
  homeX,
  homeY,
  size,
  glowColor,
  isHeld,
  beatTick,
  showLabel,
  phaseOffset,
  floatPeriod,
  floatAmplitude,
  dragEnabled,
  vpW,
  vpH,
  beatPulseScale = 1.08,
  holdScale = 1,
  graphic,
}: PlaygroundItemProps) => {

  // ── Drag ───────────────────────────────────────────────────────────────
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const [isDragging, setIsDragging] = useState(false)
  // Ref so beat-pulse effect can read dragging state without re-running
  const isDraggingRef = useRef(false)

  // Drag constraints: keep circle rim within viewport
  const halfSize = size / 2
  const dragConstraints = {
    left:   Math.min(0, -(homeX - halfSize - EDGE_PAD)),
    right:  Math.max(0,  vpW - homeX - halfSize - EDGE_PAD),
    top:    Math.min(0, -(homeY - halfSize - EDGE_PAD)),
    bottom: Math.max(0,  vpH - homeY - halfSize - EDGE_PAD),
  }

  // ── Float ──────────────────────────────────────────────────────────────
  const floatY = useFloatY(phaseOffset, floatPeriod, floatAmplitude)

  // ── Scale ──────────────────────────────────────────────────────────────
  //
  // Two-layer approach — keeps mechanisms separate and avoids animate(MotionValue)
  // internals which are unreliable under React StrictMode's double-invoke:
  //
  //   Beat-pulse layer  (outer) : MotionValue `beatScaleMV` driven by animate()
  //   Hold-grow  layer  (inner) : animate={{ scale: holdScale }} prop, driven by a
  //                               RAF loop in Playground via useKeyHold. Using the
  //                               animate *prop* (not standalone animate()) lets FM
  //                               manage its own interpolation state reliably.
  //
  // Spring-back on release: when isHeld flips to false, holdScale returns to 1.
  // FM sees the animate target drop to 1 and applies RELEASE_SPRING to get there.

  // Beat-pulse MotionValue (still uses animate() but only for short 0.28s bursts)
  const beatScaleMV = useMotionValue(1)

  // Ref so beat-pulse guard can read isHeld without adding it as a dep
  const isHeldRef = useRef(isHeld)
  useEffect(() => { isHeldRef.current = isHeld }, [isHeld])

  // isAtMax derived directly from the holdScale prop — no state needed
  const isAtMax = holdScale >= 2.49

  // Beat-pulse — skip while held or dragging (guard via ref to avoid stale closure)
  useEffect(() => {
    if (beatTick === 0 || isHeldRef.current || isDraggingRef.current) return
    animate(beatScaleMV, [1, beatPulseScale, 1], {
      duration: 0.28,
      times: [0, 0.45, 1],
      ease: 'easeOut',
    })
  }, [beatTick, beatScaleMV, beatPulseScale])

  // ── Glow derived values ─────────────────────────────────────────────────
  const isGlowing = glowColor !== null

  const boxShadow = isGlowing
    ? [
        `0 0 0 3px ${glowColor}99`,       // crisp ring
        `0 0 25px 10px ${glowColor}77`,   // near glow
        `0 0 55px 25px ${glowColor}33`,   // wide halo
      ].join(', ')
    : 'none'

  const bgFill = isGlowing
    ? `${glowColor}26`                    // ~15% opacity
    : 'rgba(255,255,255,0.09)'

  const borderColor = isGlowing
    ? `${glowColor}bb`
    : 'rgba(255,255,255,0.18)'

  // At max size: pulse the outer glow rings
  const maxPulse =
    isHeld && isAtMax && isGlowing
      ? {
          boxShadow: [
            `0 0 0 3px ${glowColor}99, 0 0 30px 12px ${glowColor}88, 0 0 60px 30px ${glowColor}44`,
            `0 0 0 6px ${glowColor}66, 0 0 50px 20px ${glowColor}aa, 0 0 90px 45px ${glowColor}33`,
            `0 0 0 3px ${glowColor}99, 0 0 30px 12px ${glowColor}88, 0 0 60px 30px ${glowColor}44`,
          ],
        }
      : undefined

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    // Layer 1: Position — anchors at home coordinate and centres
    <div
      className="absolute"
      style={{
        left: homeX,
        top: homeY,
        transform: 'translate(-50%, -50%)',
        // Dragging items float above everything; held above glowing; glowing above idle
        zIndex: isDragging ? 30 : isHeld ? 20 : isGlowing ? 10 : 1,
      }}
    >
      {/* Layer 2: Drag — free-direction with rubber-band at edges, springs back on release */}
      <motion.div
        style={{ x: dragX, y: dragY }}
        drag={dragEnabled}
        dragConstraints={dragEnabled ? dragConstraints : undefined}
        dragElastic={0.25}
        dragMomentum={false}
        onDragStart={() => {
          setIsDragging(true)
          isDraggingRef.current = true
        }}
        onDragEnd={() => {
          setIsDragging(false)
          isDraggingRef.current = false
          // Spring dragX and dragY back to home (0 offset from homeX/homeY)
          animate(dragX, 0, DRAG_SPRING)
          animate(dragY, 0, DRAG_SPRING)
        }}
      >
        {/* Layer 3: Float — y-axis sine-wave (MotionValue, zero re-renders) */}
        <motion.div style={{ y: floatY }}>

          {/* Layer 4a: Beat-pulse — MotionValue driven by short animate() bursts */}
          <motion.div style={{ scale: beatScaleMV }}>

            {/* Layer 4b: Hold-grow — animate prop; scale fed by RAF loop via useKeyHold */}
            <motion.div
              animate={{ scale: holdScale }}
              transition={isHeld && holdScale > 1 ? { duration: 0 } : RELEASE_SPRING}
              style={{ transformOrigin: 'center center' }}
            >

              {/* Layer 5: Glow circle */}
              <motion.div
                className="rounded-full relative overflow-hidden"
                style={{
                  width: size,
                  height: size,
                  border: `1.5px solid ${borderColor}`,
                  transition: `border-color 0.15s ease`,
                }}
                animate={maxPulse ?? { boxShadow, backgroundColor: bgFill }}
                transition={
                  maxPulse
                    ? { duration: 0.75, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0.15, ease: 'easeOut' }
                }
              >
                {/* SVG graphic content — letter, digit, or icon */}
                {graphic && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                    {graphic}
                  </div>
                )}

                {/* Inner highlight shimmer — top-left arc gives 3D bubble look */}
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    top: '8%',
                    left: '10%',
                    width: '38%',
                    height: '26%',
                    background:
                      'radial-gradient(ellipse, rgba(255,255,255,0.38) 0%, transparent 100%)',
                    transform: 'rotate(-25deg)',
                    zIndex: 1,
                  }}
                />
              </motion.div>

            </motion.div>

          </motion.div>
        </motion.div>

        {/* Layer 6: Label — shown in preschool mode, moves with drag */}
        {showLabel && (
          <div
            className="text-center font-bold pointer-events-none select-none mt-2"
            style={{
              color: isGlowing ? (glowColor ?? 'white') : 'rgba(255,255,255,0.65)',
              fontSize: Math.max(12, size * 0.18),
              textShadow: isGlowing ? `0 0 10px ${glowColor}` : 'none',
              transition: 'color 0.15s ease, text-shadow 0.15s ease',
            }}
          >
            {label}
          </div>
        )}
      </motion.div>
    </div>
  )
})

PlaygroundItem.displayName = 'PlaygroundItem'
export default PlaygroundItem
