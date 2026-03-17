// Zustand store — from PRD Section 8.6.
// Guest mode only: auth and purchase fields are excluded per initial scope.
// All settings are persisted to localStorage via the 'persist' middleware.

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ItemState } from '@/themes/types'

// ---------------------------------------------------------------------------
// Settings shape
// ---------------------------------------------------------------------------

export interface Settings {
  ageMode: 'baby' | 'toddler' | 'preschool'
  soundMode: 'item_sounds' | 'phonics' | 'pronunciation' | 'vocabulary'
  selectedThemeId: string
  exitShortcut: string        // e.g. "Escape:5000" or "ctrl+alt+d"
  parentGateType: 'math' | 'pin'
  parentGatePin?: string      // hashed 4-digit PIN; only present when type === 'pin'
  favoriteSongIds: string[]
}

const DEFAULT_SETTINGS: Settings = {
  ageMode: 'toddler',
  soundMode: 'item_sounds',
  selectedThemeId: 'stars',
  exitShortcut: 'Escape:5000',
  parentGateType: 'math',
  favoriteSongIds: [],
}

// ---------------------------------------------------------------------------
// App state shape
// ---------------------------------------------------------------------------

export interface AppState {
  // App mode — drives top-level view rendering
  mode: 'landing' | 'playground' | 'settings'

  // Whether the exit gate overlay is currently visible on top of the playground
  showExitGate: boolean

  // Which child profile is active (null = no profiles / guest default)
  // Populated in P1 when child profiles are implemented
  activeChildProfileId: string | null

  // Settings (persisted to localStorage for guests)
  settings: Settings

  // Playground runtime state (not persisted)
  currentSongId: string
  playlistIndex: number
  itemStates: Map<string, ItemState>

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /** Switch to a new app mode. */
  setMode(mode: AppState['mode']): void

  /** Show or hide the exit gate overlay (renders on top of the playground). */
  setShowExitGate(show: boolean): void

  /** Partial-update settings and persist to localStorage. */
  updateSettings(partial: Partial<Settings>): void

  /** Reset settings to defaults (e.g. after a factory reset in parent settings). */
  resetSettings(): void

  /** Update the runtime state of a single playground item. */
  setItemState(id: string, partial: Partial<ItemState>): void

  /** Replace the full itemStates map (called on theme switch / layout recalc). */
  resetItemStates(states: ItemState[]): void

  /** Advance the playlist to the given index. */
  setPlaylistIndex(index: number): void

  /** Update the currently playing song ID. */
  setCurrentSongId(id: string): void
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      mode: 'landing',
      showExitGate: false,
      activeChildProfileId: null,
      settings: DEFAULT_SETTINGS,
      currentSongId: '',
      playlistIndex: 0,
      itemStates: new Map(),

      // Actions
      setMode(mode) {
        set({ mode })
      },

      setShowExitGate(show) {
        set({ showExitGate: show })
      },

      updateSettings(partial) {
        set(state => ({
          settings: { ...state.settings, ...partial },
        }))
      },

      resetSettings() {
        set({ settings: DEFAULT_SETTINGS })
      },

      setItemState(id, partial) {
        set(state => {
          const next = new Map(state.itemStates)
          const existing = next.get(id)
          if (existing) {
            next.set(id, { ...existing, ...partial })
          }
          return { itemStates: next }
        })
      },

      resetItemStates(states) {
        set({ itemStates: new Map(states.map(s => [s.id, s])) })
      },

      setPlaylistIndex(index) {
        set({ playlistIndex: index })
      },

      setCurrentSongId(id) {
        set({ currentSongId: id })
      },
    }),
    {
      name: 'kidboard-settings',  // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist settings — not runtime playground state
      partialize: (state) => ({
        settings: state.settings,
        activeChildProfileId: state.activeChildProfileId,
      }),
    }
  )
)

// ---------------------------------------------------------------------------
// Convenience selectors
// ---------------------------------------------------------------------------

export const selectSettings = (s: AppState) => s.settings
export const selectMode = (s: AppState) => s.mode
export const selectAgeMode = (s: AppState) => s.settings.ageMode
export const selectThemeId = (s: AppState) => s.settings.selectedThemeId
export const selectSoundMode = (s: AppState) => s.settings.soundMode
