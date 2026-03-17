// InputBlocker — mounts in Child Mode and captures all disallowed inputs
// via event.preventDefault() in the capture phase on document.
//
// Allowed: printable single chars (A–Z, 0–9) without modifier keys,
//          the configured exit shortcut key.
// Blocked: everything else — F1–F12, Space, Enter, Tab, Backspace, Delete,
//          modifier combos, right-click, middle-click, scroll, wheel,
//          text selection, drag, double-click, browser gestures.

import { useEffect } from 'react'
import { useAppStore } from '@/app/store'

const ALLOWED_KEYS = /^[a-zA-Z0-9]$/

export default function InputBlocker() {
  const exitShortcut = useAppStore(s => s.settings.exitShortcut)

  useEffect(() => {
    // ── Key blocking ────────────────────────────────────────────────────────
    const isAllowedKey = (e: KeyboardEvent): boolean => {
      if (isExitShortcutKey(e, exitShortcut)) return true
      return ALLOWED_KEYS.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey
    }

    const blockKey = (e: KeyboardEvent) => {
      if (isAllowedKey(e)) return
      e.preventDefault()
      e.stopPropagation()
    }

    // ── Mouse / pointer blocking ────────────────────────────────────────────
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    // Block middle-click (button 1) and right-click (button 2) on mousedown
    const blockMouseDown = (e: MouseEvent) => {
      if (e.button === 1 || e.button === 2) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    // Block middle-click auxclick (fires after middle-mousedown)
    const blockAuxClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const blockDblClick = (e: MouseEvent) => {
      e.preventDefault()
    }

    // ── Scroll / wheel blocking ─────────────────────────────────────────────
    const blockScroll = (e: Event) => {
      e.preventDefault()
    }

    // ── Selection / drag blocking ───────────────────────────────────────────
    const blockSelect = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const blockDrag = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
    }

    // ── Mount: disable overscroll bounce/navigation gestures ────────────────
    const prevOverscroll = document.body.style.overscrollBehavior
    document.body.style.overscrollBehavior = 'none'

    // ── Register all listeners (capture phase) ──────────────────────────────
    document.addEventListener('keydown',      blockKey,          { capture: true })
    document.addEventListener('keyup',        blockKey,          { capture: true })
    document.addEventListener('contextmenu',  blockContextMenu,  { capture: true })
    document.addEventListener('mousedown',    blockMouseDown,    { capture: true })
    document.addEventListener('auxclick',     blockAuxClick,     { capture: true })
    document.addEventListener('dblclick',     blockDblClick,     { capture: true })
    document.addEventListener('wheel',        blockScroll,       { capture: true, passive: false })
    document.addEventListener('touchmove',    blockScroll,       { capture: true, passive: false })
    document.addEventListener('selectstart',  blockSelect,       { capture: true })
    document.addEventListener('dragstart',    blockDrag,         { capture: true })

    return () => {
      document.body.style.overscrollBehavior = prevOverscroll

      document.removeEventListener('keydown',      blockKey,          { capture: true })
      document.removeEventListener('keyup',        blockKey,          { capture: true })
      document.removeEventListener('contextmenu',  blockContextMenu,  { capture: true })
      document.removeEventListener('mousedown',    blockMouseDown,    { capture: true })
      document.removeEventListener('auxclick',     blockAuxClick,     { capture: true })
      document.removeEventListener('dblclick',     blockDblClick,     { capture: true })
      // passive:false listeners must be removed with { capture: true } only
      // (passive is not part of the listener identity for removal)
      document.removeEventListener('wheel',        blockScroll,       { capture: true })
      document.removeEventListener('touchmove',    blockScroll,       { capture: true })
      document.removeEventListener('selectstart',  blockSelect,       { capture: true })
      document.removeEventListener('dragstart',    blockDrag,         { capture: true })
    }
  }, [exitShortcut])

  return null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the keyboard event matches the exit shortcut KEY (not
 * the full hold sequence — that's handled by KeyHandler).  We just need to
 * let the raw key through so KeyHandler's timers can fire.
 */
function isExitShortcutKey(e: KeyboardEvent, shortcut: string): boolean {
  // "Escape:3000" → allow Escape key through
  if (shortcut.startsWith('Escape:')) return e.key === 'Escape'

  // Custom combo like "ctrl+alt+d" → allow when all modifiers match
  const parts = shortcut.toLowerCase().split('+')
  const key   = parts[parts.length - 1]
  const ctrl  = parts.includes('ctrl')
  const alt   = parts.includes('alt')
  const meta  = parts.includes('meta') || parts.includes('cmd')
  const shift = parts.includes('shift')
  return (
    e.key.toLowerCase() === key &&
    e.ctrlKey === ctrl &&
    e.altKey  === alt  &&
    e.metaKey === meta &&
    e.shiftKey === shift
  )
}
