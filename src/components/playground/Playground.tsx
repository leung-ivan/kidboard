// Playground — fullscreen child-mode canvas.
//
// Responsibilities:
//   • Requests Fullscreen on mount; exits on unmount
//   • Lays out N items across the viewport (grid scatter, ageMode-dependent count)
//   • Wires KeyHandler: trigger → glow+color-cycle, hold → grow, release → spring-back
//   • Wires TouchHandler: same actions via Pointer Events (touch/pen, up to 5 fingers)
//   • Wires BeatEngine: fires scale-pulse on every beat via beatTick prop
//   • Manages per-item glow colors (palette cycles, no consecutive repeat)
//   • Supports multiple simultaneous held items (one per active touch/key)
//   • Exit shortcut (hold Escape 3 s) → sets mode to 'parent-gate'
//   • Mobile: semi-transparent lock icon top-right for long-press exit

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import BackgroundScene from './BackgroundScene'
import PlaygroundItem from './PlaygroundItem'
import ItemGraphic from './ItemGraphic'
import { useBeatEngine } from './BeatEngine'
import { KeyHandler } from '@/components/input/KeyHandler'
import { TouchHandler } from '@/components/input/TouchHandler'
import { usePlaylist, useItemSfx, useAudioUnlock } from '@/components/audio/useAudioManager'
import { useAppStore, selectThemeId, selectAgeMode, selectSoundMode } from '@/app/store'
import { THEMES_BY_ID } from '@/themes/index'
import { requestFullscreen, exitFullscreen } from '@/utils/platform'
import type { ThemeItem } from '@/themes/types'
import type { KeyAction } from '@/components/input/KeyHandler'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ITEM_SIZE:  Record<string, number> = { baby: 110, toddler: 84, preschool: 68 }
const ITEM_COUNT: Record<string, number> = { baby: 6, toddler: 12, preschool: 18 }
const GLOW_TAP_DURATION = 650  // ms glow persists after a quick tap

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

interface ItemLayout {
  id: string
  homeX: number
  homeY: number
  phaseOffset: number
  floatPeriod: number
  floatAmplitude: number
}

/** Deterministic pseudo-random so positions are stable across re-renders */
function dr(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function computeLayout(
  items: ThemeItem[],
  count: number,
  vpW: number,
  vpH: number,
  size: number,
  ageMode: string,
): ItemLayout[] {
  const n = Math.min(count, items.length)
  const cols = Math.max(2, Math.round(Math.sqrt(n * (vpW / vpH))))
  const rows = Math.ceil(n / cols)

  // Pad enough to keep circle edges off the viewport border (not size×1.6 which
  // eats too much space on mobile — a phone with 110px baby items would barely
  // fit 2 columns).
  const padX = size / 2 + 12
  const padY = size / 2 + 12
  const cellW = (vpW - padX * 2) / cols
  const cellH = (vpH - padY * 2) / rows

  // Baby mode: slower, gentler float so large items don't feel jittery
  const isBaby = ageMode === 'baby'

  // Jitter range: capped so item edges can't overlap with neighbours.
  // If free space per cell (cellW - size) is small, jitter stays small; never negative.
  const jRangeX = Math.min(cellW * 0.4, Math.max(0, cellW - size)) * 0.75
  const jRangeY = Math.min(cellH * 0.4, Math.max(0, cellH - size)) * 0.75

  return items.slice(0, n).map((item, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const jx = (dr(i * 3 + 1) - 0.5) * jRangeX
    const jy = (dr(i * 7 + 2) - 0.5) * jRangeY
    return {
      id: item.id,
      homeX: padX + col * cellW + cellW / 2 + jx,
      homeY: padY + row * cellH + cellH / 2 + jy,
      phaseOffset: (i / n) * 2 * Math.PI,
      // Baby: 6–10 s period, 4–6 px amplitude (slower & bigger items)
      // Others: 4–6 s period, 3–5 px amplitude
      floatPeriod:    isBaby ? 6 + dr(i * 11) * 4 : 4 + dr(i * 11) * 2,
      floatAmplitude: isBaby ? 4 + dr(i * 13) * 2 : 3 + dr(i * 13) * 2,
    }
  })
}

// ---------------------------------------------------------------------------
// Color cycling
// ---------------------------------------------------------------------------

function pickNextColor(palette: string[], lastIdx: number): [string, number] {
  if (palette.length === 1) return [palette[0], 0]
  let idx: number
  do { idx = Math.floor(Math.random() * palette.length) }
  while (idx === lastIdx)
  return [palette[idx], idx]
}

// ---------------------------------------------------------------------------
// Playground component
// ---------------------------------------------------------------------------

export default function Playground() {
  const themeId   = useAppStore(selectThemeId)
  const ageMode   = useAppStore(selectAgeMode)
  const soundMode = useAppStore(selectSoundMode)
  const settings  = useAppStore(s => s.settings)

  const setShowExitGate = useAppStore(s => s.setShowExitGate)
  const showExitGate    = useAppStore(s => s.showExitGate)

  const theme     = THEMES_BY_ID[themeId] ?? THEMES_BY_ID['stars']
  const itemSize  = ITEM_SIZE[ageMode] ?? ITEM_SIZE.toddler
  const itemCount = ITEM_COUNT[ageMode] ?? ITEM_COUNT.toddler

  // Ref so event-handler closures can check gate state without stale captures
  const showExitGateRef = useRef(false)
  useEffect(() => { showExitGateRef.current = showExitGate }, [showExitGate])

  // ── Fullscreen ─────────────────────────────────────────────────────────
  useEffect(() => {
    requestFullscreen()
    return () => { exitFullscreen() }
  }, [])

  // ── Viewport & layout ──────────────────────────────────────────────────
  const [vpW, setVpW] = useState(() => window.innerWidth)
  const [vpH, setVpH] = useState(() => window.innerHeight)

  useEffect(() => {
    const onResize = () => { setVpW(window.innerWidth); setVpH(window.innerHeight) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const layout = useMemo(
    () => computeLayout(theme.items, itemCount, vpW, vpH, itemSize, ageMode),
    [theme.items, itemCount, vpW, vpH, itemSize, ageMode],
  )

  const labelMap = useMemo(
    () => Object.fromEntries(theme.items.map(i => [i.id, i.name])),
    [theme.items],
  )

  // ── Audio ───────────────────────────────────────────────────────────────
  // Unlock AudioContext on first gesture (required on iOS/Safari)
  useAudioUnlock()

  // Start the playlist for this theme; get live BPM for BeatEngine
  const { bpm } = usePlaylist(theme.defaultSongs)

  // Preload SFX for all visible items; get stable trigger/hold callbacks
  // (must be declared before onAction so the callbacks are in scope)
  const { triggerSfx, startHoldSfx, stopHoldSfx } = useItemSfx(
    theme.items.slice(0, itemCount),
    soundMode,
  )

  // ── BeatEngine ─────────────────────────────────────────────────────────
  const { beatTick } = useBeatEngine(bpm)

  // ── Interaction state ──────────────────────────────────────────────────
  const [itemColors, setItemColors]   = useState<Record<string, string | null>>({})
  // Set of currently held item IDs — supports simultaneous key + multi-touch
  const [heldItemIds, setHeldItemIds] = useState<ReadonlySet<string>>(new Set())

  const glowTimers   = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const lastColorIdx = useRef(-1)

  const setGlow = useCallback((id: string, color: string, autoFade: boolean) => {
    if (glowTimers.current[id]) clearTimeout(glowTimers.current[id])
    setItemColors(prev => ({ ...prev, [id]: color }))
    if (autoFade) {
      glowTimers.current[id] = setTimeout(() => {
        setItemColors(prev => ({ ...prev, [id]: null }))
        delete glowTimers.current[id]
      }, GLOW_TAP_DURATION)
    }
  }, [])

  const fadeGlow = useCallback((id: string) => {
    if (glowTimers.current[id]) clearTimeout(glowTimers.current[id])
    glowTimers.current[id] = setTimeout(() => {
      setItemColors(prev => ({ ...prev, [id]: null }))
      delete glowTimers.current[id]
    }, 300)
  }, [])

  useEffect(() => {
    const timers = glowTimers.current
    return () => Object.values(timers).forEach(clearTimeout)
  }, [])

  // Shared action handler for both KeyHandler and TouchHandler.
  // Guarded: while the exit gate is open, ignore all actions so the parent's
  // keyboard input (typing the math answer) doesn't trigger playground items.
  const onAction = useCallback((action: KeyAction) => {
    if (showExitGateRef.current) return

    switch (action.type) {
      case 'trigger': {
        const [color, nextIdx] = pickNextColor(theme.palette, lastColorIdx.current)
        lastColorIdx.current = nextIdx
        setGlow(action.itemId, color, true)
        triggerSfx(action.itemId)
        break
      }
      case 'hold_start': {
        // Cancel tap-fade so glow persists during hold
        if (glowTimers.current[action.itemId]) {
          clearTimeout(glowTimers.current[action.itemId])
          delete glowTimers.current[action.itemId]
        }
        setHeldItemIds(prev => new Set([...prev, action.itemId]))
        startHoldSfx(action.itemId)
        break
      }
      case 'hold_end': {
        setHeldItemIds(prev => {
          const next = new Set(prev)
          next.delete(action.itemId)
          return next
        })
        fadeGlow(action.itemId)
        stopHoldSfx(action.itemId)
        break
      }
      case 'exit': {
        // Show the exit gate overlay — stays on top of the (dimmed) playground
        setShowExitGate(true)
        break
      }
    }
  }, [theme.palette, setGlow, fadeGlow, setShowExitGate, triggerSfx, startHoldSfx, stopHoldSfx])

  // ── KeyHandler ─────────────────────────────────────────────────────────
  useEffect(() => {
    const itemIds = layout.map(l => l.id)
    const matchKeys: Record<string, string> = {}
    theme.items.forEach(item => {
      if (item.matchKey) matchKeys[item.matchKey] = item.id
    })

    const handler = new KeyHandler({
      itemIds,
      matchKeys,
      exitShortcut: settings.exitShortcut,
      onAction,
    })

    const onKD = (e: KeyboardEvent) => handler.handleKeyDown(e)
    const onKU = (e: KeyboardEvent) => handler.handleKeyUp(e)
    document.addEventListener('keydown', onKD)
    document.addEventListener('keyup',   onKU)

    return () => {
      handler.destroy()
      document.removeEventListener('keydown', onKD)
      document.removeEventListener('keyup',   onKU)
    }
  }, [layout, theme.items, settings.exitShortcut, onAction])

  // ── TouchHandler ────────────────────────────────────────────────────────
  const touchHandlerRef = useRef<TouchHandler | null>(null)

  // Build the item positions array for TouchHandler from current layout
  const touchItems = useMemo(
    () => layout.map(l => ({ id: l.id, x: l.homeX, y: l.homeY })),
    [layout],
  )

  useEffect(() => {
    const handler = new TouchHandler({
      items: touchItems,
      itemSize,
      ageMode,
      onAction,
    })
    touchHandlerRef.current = handler
    handler.attach(document)

    return () => {
      handler.destroy()
      handler.detach(document)
      touchHandlerRef.current = null
    }
  }, [touchItems, itemSize, ageMode, onAction])

  // ── Escape-hold progress bar ───────────────────────────────────────────
  const [escProgress, setEscProgress] = useState(0)
  const escRafRef   = useRef<number | null>(null)
  const escStartRef = useRef<number | null>(null)

  useEffect(() => {
    const holdMs = settings.exitShortcut.startsWith('Escape:')
      ? parseInt(settings.exitShortcut.split(':')[1], 10)
      : 3000

    const onDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || escStartRef.current !== null) return
      escStartRef.current = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - escStartRef.current!) / holdMs, 1)
        setEscProgress(p)
        if (p < 1) escRafRef.current = requestAnimationFrame(tick)
      }
      escRafRef.current = requestAnimationFrame(tick)
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      escStartRef.current = null
      if (escRafRef.current) { cancelAnimationFrame(escRafRef.current); escRafRef.current = null }
      setEscProgress(0)
    }

    document.addEventListener('keydown', onDown)
    document.addEventListener('keyup',   onUp)
    return () => {
      document.removeEventListener('keydown', onDown)
      document.removeEventListener('keyup',   onUp)
      if (escRafRef.current) cancelAnimationFrame(escRafRef.current)
    }
  }, [settings.exitShortcut])

  // ── Mobile lock icon ───────────────────────────────────────────────────
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [lockHeld, setLockHeld] = useState(false)

  const onLockStart = useCallback(() => {
    setLockHeld(true)
    lockTimerRef.current = setTimeout(() => {
      setLockHeld(false)
      setShowExitGate(true)
    }, 2000)
  }, [setShowExitGate])

  const onLockEnd = useCallback(() => {
    setLockHeld(false)
    if (lockTimerRef.current) { clearTimeout(lockTimerRef.current); lockTimerRef.current = null }
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────
  const showLabels = ageMode === 'preschool'

  return (
    <div
      className="fixed inset-0 w-full h-full overflow-hidden"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* Background: gradient + animated star field */}
      <BackgroundScene gradient={theme.background.value} />

      {/* Items */}
      {layout.map(l => (
        <PlaygroundItem
          key={l.id}
          id={l.id}
          label={labelMap[l.id] ?? l.id}
          homeX={l.homeX}
          homeY={l.homeY}
          size={itemSize}
          glowColor={itemColors[l.id] ?? null}
          isHeld={heldItemIds.has(l.id)}
          beatTick={beatTick}
          showLabel={showLabels}
          phaseOffset={l.phaseOffset}
          floatPeriod={l.floatPeriod}
          floatAmplitude={l.floatAmplitude}
          dragEnabled={ageMode !== 'baby'}
          vpW={vpW}
          vpH={vpH}
          beatPulseScale={ageMode === 'baby' ? 1.06 : 1.08}
          graphic={
            <ItemGraphic
              themeId={themeId}
              itemId={l.id}
              label={labelMap[l.id] ?? l.id}
              size={itemSize}
              glowColor={itemColors[l.id] ?? null}
            />
          }
        />
      ))}

      {/* Escape-hold progress bar — slim bar at the very top */}
      {escProgress > 0 && (
        <div className="fixed top-0 left-0 right-0 h-[3px] pointer-events-none z-50">
          <motion.div
            className="h-full rounded-r-full"
            style={{
              width: `${escProgress * 100}%`,
              background: 'linear-gradient(90deg, #2E75B6 0%, #87CEEB 100%)',
              boxShadow: '0 0 8px #87CEEB',
            }}
          />
        </div>
      )}

      {/* Mobile lock icon — very low contrast, top-right corner */}
      <div
        className="fixed top-3 right-3 z-50"
        onPointerDown={onLockStart}
        onPointerUp={onLockEnd}
        onPointerLeave={onLockEnd}
        onPointerCancel={onLockEnd}
        style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}
      >
        <motion.div
          className="w-8 h-8 flex items-center justify-center rounded-full relative"
          animate={{ opacity: lockHeld ? 0.55 : 0.13 }}
          transition={{ duration: 0.1 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="8" width="10" height="7" rx="1.5" fill="white" />
            <path
              d="M5 8V5.5a3 3 0 016 0V8"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          {lockHeld && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white/50"
              initial={{ scale: 0.7, opacity: 0.8 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 2, ease: 'linear' }}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}
