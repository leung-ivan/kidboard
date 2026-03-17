// useAudioManager — React hooks that connect the AudioManager singleton
// to Playground.tsx without causing unnecessary re-renders.
//
// usePlaylist  — loads a song list, auto-starts playback, syncs BPM
// useItemSfx  — preloads SFX for a theme and exposes trigger/hold functions

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { audioManager } from './AudioManager'
import type { SongMetadata } from './SongData'
import { SONGS_BY_ID } from './SongData'
import type { ThemeItem } from '@/themes/types'
import type { Settings } from '@/app/store'

// ---------------------------------------------------------------------------
// usePlaylist
// ---------------------------------------------------------------------------

/**
 * Loads a playlist of songs into the AudioManager and starts playing.
 * Returns the live BPM of the currently-playing song (updates on song change).
 *
 * Usage in Playground:
 *   const { bpm } = usePlaylist(theme.defaultSongs)
 *   const { beatTick } = useBeatEngine(bpm)
 */
export function usePlaylist(songIds: string[]): { bpm: number } {
  // Resolve song IDs → metadata (filter out unknown IDs)
  const songs: SongMetadata[] = useMemo(
    () => songIds.map(id => SONGS_BY_ID[id]).filter(Boolean),
    // Stringify so useMemo only re-runs when IDs actually change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [songIds.join(',')],
  )

  const [bpm, setBpm] = useState<number>(() => songs[0]?.bpm ?? 80)

  useEffect(() => {
    if (songs.length === 0) return
    audioManager.loadPlaylist(songs, setBpm)
    return () => { audioManager.pause() }
  }, [songs])

  // Keep bpm in sync if songs array changes while playing
  useEffect(() => {
    const current = songs.find(s => s.id === audioManager.currentSongId)
    if (current) setBpm(current.bpm)
  }, [songs])

  return { bpm }
}

// ---------------------------------------------------------------------------
// useItemSfx
// ---------------------------------------------------------------------------

/**
 * Preloads SFX for all items in the current theme and returns three stable
 * callbacks for Playground.tsx's onAction handler:
 *
 *   triggerSfx(itemId)   — one-shot on tap / keypress
 *   startHoldSfx(itemId) — begins crossfade-looping SFX on key/touch hold
 *   stopHoldSfx(itemId)  — ends the hold loop with fade-out
 *
 * `soundMode` determines which file is used per item:
 *   'item_sounds'  → item.soundFile  (default)
 *   'pronunciation'→ item.pronunciationFile
 *   'vocabulary'   → item.pronunciationFile  (vocabulary audio added in P1)
 *   'phonics'      → item.soundFile           (phonics files added in P1)
 */
export function useItemSfx(
  items: ThemeItem[],
  soundMode: Settings['soundMode'],
): {
  triggerSfx:  (itemId: string) => void
  startHoldSfx:(itemId: string) => void
  stopHoldSfx: (itemId: string) => void
} {
  // Map of itemId → active hold-stop function
  const holdStops = useRef<Map<string, () => void>>(new Map())

  // Build a stable item-id→file lookup
  const fileMap = useMemo<Map<string, string>>(() => {
    const m = new Map<string, string>()
    items.forEach(item => {
      const file = soundModeFile(item, soundMode)
      if (file) m.set(item.id, file)
    })
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, soundMode])

  // Preload all files whenever items or soundMode changes
  useEffect(() => {
    const files = Array.from(fileMap.values())
    if (files.length > 0) audioManager.preloadSfx(files)
  }, [fileMap])

  // Stop all active holds on unmount
  useEffect(() => {
    const stops = holdStops.current
    return () => {
      stops.forEach(stop => stop())
      stops.clear()
    }
  }, [])

  const triggerSfx = useCallback((itemId: string) => {
    const file = fileMap.get(itemId)
    if (file) audioManager.playSfx(file)
  }, [fileMap])

  const startHoldSfx = useCallback((itemId: string) => {
    const file = fileMap.get(itemId)
    if (!file) return
    // Stop any previous hold for this item before starting a new one
    holdStops.current.get(itemId)?.()
    holdStops.current.set(itemId, audioManager.startHoldSfx(file))
  }, [fileMap])

  const stopHoldSfx = useCallback((itemId: string) => {
    holdStops.current.get(itemId)?.()
    holdStops.current.delete(itemId)
  }, [])

  return { triggerSfx, startHoldSfx, stopHoldSfx }
}

// ---------------------------------------------------------------------------
// useAudioUnlock
// ---------------------------------------------------------------------------

/**
 * Calls audioManager.unlockAudio() on the first user gesture.
 * Mount this once at the app root or inside Playground.
 * Safe to call from both keydown and pointerdown handlers.
 */
export function useAudioUnlock() {
  const unlocked = useRef(false)
  useEffect(() => {
    const unlock = () => {
      if (unlocked.current) return
      unlocked.current = true
      audioManager.unlockAudio()
    }
    document.addEventListener('keydown',     unlock, { once: true })
    document.addEventListener('pointerdown', unlock, { once: true })
    return () => {
      document.removeEventListener('keydown',     unlock)
      document.removeEventListener('pointerdown', unlock)
    }
  }, [])
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function soundModeFile(item: ThemeItem, mode: Settings['soundMode']): string {
  switch (mode) {
    case 'pronunciation':
    case 'vocabulary':
      return item.pronunciationFile
    case 'item_sounds':
    case 'phonics':
    default:
      return item.soundFile
  }
}
