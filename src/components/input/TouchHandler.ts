// TouchHandler — maps Pointer Events (touch/pen) to playground actions.
//
// Supports up to 5 simultaneous touches. Each finger independently:
//   • pointerdown  → find nearest item → trigger + begin hold timer
//   • pointermove  → detect drag (> 8 px from start) → cancel hold timer
//   • pointerup    → fire hold_end if was in hold, else nothing extra
//   • pointercancel → same as pointerup cleanup
//
// Nearest-item logic:
//   Baby mode     : always snaps to nearest item (any distance)
//   Toddler/Pre   : nearest within itemSize/2 + 20 px threshold
//
// Drag vs hold:
//   If a finger moves > DRAG_THRESHOLD px before the 150ms hold timer fires,
//   the hold timer is cancelled.  Framer Motion then handles the visual drag
//   on the PlaygroundItem.  No hold_start is sent for that touch.
//
// The same KeyAction union type is reused so Playground.tsx handles both
// keyboard and touch through one onAction callback.

import type { KeyAction } from './KeyHandler'

export interface ItemPosition {
  id: string
  x: number  // homeX (px from left)
  y: number  // homeY (px from top)
}

export interface TouchHandlerOptions {
  items: ItemPosition[]
  itemSize: number              // diameter in px
  ageMode: 'baby' | 'toddler' | 'preschool'
  onAction: (action: KeyAction) => void
}

/** Pixels of movement before a touch is classified as a drag (not a tap/hold). */
const DRAG_THRESHOLD = 8

interface PointerState {
  pointerId: number
  itemId: string
  holdTimer: ReturnType<typeof setTimeout> | null
  isHolding: boolean
  startX: number
  startY: number
  isDragging: boolean
}

export class TouchHandler {
  private opts: TouchHandlerOptions
  private active = new Map<number, PointerState>()

  // Bound handler refs for removeEventListener
  private boundDown:   (e: PointerEvent) => void
  private boundMove:   (e: PointerEvent) => void
  private boundUp:     (e: PointerEvent) => void
  private boundCancel: (e: PointerEvent) => void

  constructor(opts: TouchHandlerOptions) {
    this.opts = opts
    this.boundDown   = this.handlePointerDown.bind(this)
    this.boundMove   = this.handlePointerMove.bind(this)
    this.boundUp     = this.handlePointerUp.bind(this)
    this.boundCancel = this.handlePointerCancel.bind(this)
  }

  // ── Public API ────────────────────────────────────────────────────────────

  attach(target: EventTarget = document) {
    target.addEventListener('pointerdown',   this.boundDown,   { capture: true })
    target.addEventListener('pointermove',   this.boundMove,   { capture: true, passive: true } as AddEventListenerOptions)
    target.addEventListener('pointerup',     this.boundUp,     { capture: true })
    target.addEventListener('pointercancel', this.boundCancel, { capture: true })
  }

  detach(target: EventTarget = document) {
    target.removeEventListener('pointerdown',   this.boundDown,   { capture: true })
    target.removeEventListener('pointermove',   this.boundMove,   { capture: true })
    target.removeEventListener('pointerup',     this.boundUp,     { capture: true })
    target.removeEventListener('pointercancel', this.boundCancel, { capture: true })
  }

  /** Update options when items/layout changes (avoids recreating the instance). */
  update(opts: TouchHandlerOptions) {
    this.opts = opts
  }

  destroy() {
    // Fire hold_end for any active holds then clean up timers
    this.active.forEach(state => {
      if (state.holdTimer) clearTimeout(state.holdTimer)
      if (state.isHolding) {
        this.opts.onAction({ type: 'hold_end', itemId: state.itemId })
      }
    })
    this.active.clear()
  }

  // ── Private handlers ──────────────────────────────────────────────────────

  private handlePointerDown(e: PointerEvent) {
    // Only handle touch / pen — mouse is handled by KeyHandler
    if (e.pointerType === 'mouse') return
    // Max 5 simultaneous touches
    if (this.active.size >= 5) return

    const itemId = this.findItem(e.clientX, e.clientY)
    if (!itemId) return

    const state: PointerState = {
      pointerId: e.pointerId,
      itemId,
      holdTimer: null,
      isHolding: false,
      startX: e.clientX,
      startY: e.clientY,
      isDragging: false,
    }

    this.active.set(e.pointerId, state)

    // Fire trigger immediately
    this.opts.onAction({ type: 'trigger', key: '', itemId })

    // Begin hold tracking after 150 ms (cancelled if drag is detected first)
    state.holdTimer = setTimeout(() => {
      state.isHolding = true
      state.holdTimer = null
      this.opts.onAction({ type: 'hold_start', itemId })
    }, 150)
  }

  private handlePointerMove(e: PointerEvent) {
    if (e.pointerType === 'mouse') return
    const state = this.active.get(e.pointerId)
    if (!state || state.isDragging) return

    const dx = e.clientX - state.startX
    const dy = e.clientY - state.startY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > DRAG_THRESHOLD) {
      // Finger has moved far enough — treat as drag, cancel hold timer
      state.isDragging = true
      if (state.holdTimer) {
        clearTimeout(state.holdTimer)
        state.holdTimer = null
      }
      // If hold had already started (edge case: very slow drag past 150ms),
      // send hold_end to clean up audio/glow state
      if (state.isHolding) {
        state.isHolding = false
        this.opts.onAction({ type: 'hold_end', itemId: state.itemId })
      }
    }
  }

  private handlePointerUp(e: PointerEvent) {
    if (e.pointerType === 'mouse') return
    this.releasePointer(e.pointerId)
  }

  private handlePointerCancel(e: PointerEvent) {
    if (e.pointerType === 'mouse') return
    this.releasePointer(e.pointerId)
  }

  private releasePointer(pointerId: number) {
    const state = this.active.get(pointerId)
    if (!state) return

    if (state.holdTimer) clearTimeout(state.holdTimer)
    if (state.isHolding) {
      this.opts.onAction({ type: 'hold_end', itemId: state.itemId })
    }
    this.active.delete(pointerId)
  }

  // ── Nearest-item search ───────────────────────────────────────────────────

  private findItem(x: number, y: number): string | null {
    const { items, itemSize, ageMode } = this.opts
    if (items.length === 0) return null

    let nearestId: string | null = null
    let nearestDist = Infinity

    for (const item of items) {
      const dx = x - item.x
      const dy = y - item.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestId = item.id
      }
    }

    // Baby mode: always snap to nearest
    if (ageMode === 'baby') return nearestId

    // Toddler/Preschool: only if within threshold
    const threshold = itemSize / 2 + 20
    return nearestDist <= threshold ? nearestId : null
  }
}
