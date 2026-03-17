// KeyHandler — maps keydown/keyup events to playground actions.
// - On keydown: selects a random (non-repeating) item to highlight, plays SFX.
//   If key matches a theme item's matchKey, preferentially highlights that item.
// - On key-hold: starts the grow animation (1.0× → 2.5× over 2s), loops SFX.
// - On keyup: triggers spring-back (ease-out-elastic, ~400ms).
// - Exit shortcut: "Escape:3000" = hold Escape for 3s; fires onExit callback.

export type KeyAction =
  | { type: 'trigger'; key: string; itemId: string }
  | { type: 'hold_start'; itemId: string }
  | { type: 'hold_end'; itemId: string }
  | { type: 'exit' }

export interface KeyHandlerOptions {
  itemIds: string[]
  matchKeys: Record<string, string>  // key → itemId
  exitShortcut: string               // e.g. "Escape:3000"
  onAction: (action: KeyAction) => void
}

export class KeyHandler {
  private opts: KeyHandlerOptions
  private lastItemId: string | null = null
  private holdTimer: ReturnType<typeof setTimeout> | null = null
  private escapeHoldTimer: ReturnType<typeof setTimeout> | null = null
  private heldKey: string | null = null

  constructor(opts: KeyHandlerOptions) {
    this.opts = opts
  }

  handleKeyDown(e: KeyboardEvent) {
    const { exitShortcut, itemIds, matchKeys, onAction } = this.opts

    // Exit shortcut: "Escape:3000"
    if (exitShortcut.startsWith('Escape:') && e.key === 'Escape') {
      const ms = parseInt(exitShortcut.split(':')[1], 10)
      if (!this.escapeHoldTimer) {
        this.escapeHoldTimer = setTimeout(() => {
          onAction({ type: 'exit' })
          this.escapeHoldTimer = null
        }, ms)
      }
      return
    }

    if (e.repeat) return
    if (!/^[a-zA-Z0-9]$/.test(e.key)) return

    const key = e.key.toUpperCase()

    // Pick item: prefer matchKey, else random non-repeating
    let itemId: string
    if (matchKeys[key] && matchKeys[key] !== this.lastItemId) {
      itemId = matchKeys[key]
    } else {
      const candidates = itemIds.filter(id => id !== this.lastItemId)
      itemId = candidates[Math.floor(Math.random() * candidates.length)] ?? itemIds[0]
    }
    this.lastItemId = itemId
    this.heldKey = e.key

    onAction({ type: 'trigger', key, itemId })

    // Begin hold tracking
    if (this.holdTimer) clearTimeout(this.holdTimer)
    this.holdTimer = setTimeout(() => {
      onAction({ type: 'hold_start', itemId })
    }, 150)
  }

  handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.escapeHoldTimer) {
      clearTimeout(this.escapeHoldTimer)
      this.escapeHoldTimer = null
      return
    }

    if (e.key !== this.heldKey) return
    if (this.holdTimer) {
      clearTimeout(this.holdTimer)
      this.holdTimer = null
    }
    if (this.lastItemId) {
      this.opts.onAction({ type: 'hold_end', itemId: this.lastItemId })
    }
    this.heldKey = null
  }

  destroy() {
    if (this.escapeHoldTimer) { clearTimeout(this.escapeHoldTimer); this.escapeHoldTimer = null }
    if (this.holdTimer) { clearTimeout(this.holdTimer); this.holdTimer = null }
    // If a key is currently being held, fire hold_end so Playground can clean up
    if (this.heldKey !== null && this.lastItemId !== null) {
      this.opts.onAction({ type: 'hold_end', itemId: this.lastItemId })
    }
    this.heldKey = null
  }
}
