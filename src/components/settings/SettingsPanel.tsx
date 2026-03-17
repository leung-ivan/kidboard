// SettingsPanel — tabbed parent-mode UI.
//
// Tabs: Controls · Theme · Sound · Music · Account
// Fixed "Start Playing" footer returns to playground.
// All changes persist automatically via Zustand's localStorage middleware.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, selectAgeMode } from '@/app/store'
import AccountSection from './AccountSection'
import ThemeBrowser from './ThemeBrowser'
import SoundSettings from './SoundSettings'
import SongFavorites from './SongFavorites'

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabId = 'controls' | 'theme' | 'sound' | 'music' | 'account'

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'controls', icon: '⚙️', label: 'Controls' },
  { id: 'theme',    icon: '🎨', label: 'Theme'    },
  { id: 'sound',    icon: '🔊', label: 'Sound'    },
  { id: 'music',    icon: '🎵', label: 'Music'    },
  { id: 'account',  icon: '👤', label: 'Account'  },
]

// ---------------------------------------------------------------------------
// SettingsPanel
// ---------------------------------------------------------------------------

export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('controls')
  const setMode = useAppStore(s => s.setMode)

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200 px-5">
        <div className="flex items-center h-14 max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#2E75B6" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="#2E75B6" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-base font-bold text-slate-800 tracking-tight">Settings</h1>
          </div>
          <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-100
                           px-2.5 py-1 rounded-full">
            Parent Mode
          </span>
        </div>
      </header>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <nav className="flex-shrink-0 bg-white border-b border-slate-200">
        <div className="flex max-w-2xl mx-auto overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
      </nav>

      {/* ── Scrollable content ──────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto overscroll-y-contain">
        <div className="max-w-2xl mx-auto px-4 py-5 pb-32">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {activeTab === 'controls' && <ControlsTab />}
              {activeTab === 'theme'    && <ThemeBrowser />}
              {activeTab === 'sound'    && <SoundSettings />}
              {activeTab === 'music'    && <SongFavorites />}
              {activeTab === 'account'  && <AccountSection />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Fixed footer ────────────────────────────────────────────────── */}
      <footer className="flex-shrink-0 bg-white border-t border-slate-200 px-5 py-4">
        <div className="max-w-2xl mx-auto">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('playground')}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg
                       shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition-colors
                       flex items-center justify-center gap-2"
          >
            <span>▶</span>
            <span>Start Playing</span>
          </motion.button>
        </div>
      </footer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TabButton
// ---------------------------------------------------------------------------

function TabButton({
  tab,
  isActive,
  onClick,
}: {
  tab:      { id: TabId; icon: string; label: string }
  isActive: boolean
  onClick:  () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'relative flex-1 flex flex-col items-center gap-0.5 px-3 py-3 min-w-[60px]',
        'text-xs font-semibold transition-colors select-none',
        isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600',
      ].join(' ')}
    >
      <span className="text-base leading-none">{tab.icon}</span>
      <span className="leading-none">{tab.label}</span>

      {isActive && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-blue-500"
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        />
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// ControlsTab — Age Mode selector + Exit Shortcut display
// ---------------------------------------------------------------------------

const AGE_MODES = [
  {
    id:          'baby'      as const,
    emoji:       '🍼',
    label:       'Baby',
    description: 'Large items · Any key triggers · No labels',
  },
  {
    id:          'toddler'   as const,
    emoji:       '🧸',
    label:       'Toddler',
    description: 'Medium items · Tap nearest · Default mode',
  },
  {
    id:          'preschool' as const,
    emoji:       '📖',
    label:       'Preschool',
    description: 'Smaller items · Item labels shown',
  },
]

function ControlsTab() {
  const ageMode        = useAppStore(selectAgeMode)
  const updateSettings = useAppStore(s => s.updateSettings)
  const settings       = useAppStore(s => s.settings)

  const shortcutLabel = settings.exitShortcut.startsWith('Escape:')
    ? `Hold Escape for ${parseInt(settings.exitShortcut.split(':')[1], 10) / 1000}s`
    : settings.exitShortcut

  return (
    <div className="space-y-5">

      {/* Age Mode */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Age Mode</p>
          <p className="text-xs text-slate-400 mt-1">Controls item size, count, and touch sensitivity</p>
        </div>
        <div className="divide-y divide-slate-100">
          {AGE_MODES.map(mode => (
            <motion.button
              key={mode.id}
              whileTap={{ scale: 0.99 }}
              onClick={() => updateSettings({ ageMode: mode.id })}
              className={[
                'w-full text-left flex items-center gap-4 px-5 py-4 transition-colors',
                ageMode === mode.id ? 'bg-blue-50' : 'hover:bg-slate-50',
              ].join(' ')}
            >
              <span className="text-2xl">{mode.emoji}</span>
              <div className="flex-1">
                <p className={[
                  'text-sm font-semibold',
                  ageMode === mode.id ? 'text-blue-700' : 'text-slate-800',
                ].join(' ')}>
                  {mode.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{mode.description}</p>
              </div>
              {ageMode === mode.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0"
                >
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Exit Shortcut — read-only display (custom shortcuts in P2) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Exit Shortcut
        </p>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">{shortcutLabel}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Hold this key to open Settings from the playground
            </p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100
                           text-slate-400 flex-shrink-0">
            Default
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
          Custom shortcuts coming in a future update
        </p>
      </div>

      {/* Mobile lock icon hint */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-500 mb-1.5">Mobile Exit</p>
        <p className="text-sm text-slate-500 leading-relaxed">
          On touchscreens, press and hold the{' '}
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="inline mb-0.5">
            <rect x="3" y="8" width="10" height="7" rx="1.5" fill="#94a3b8"/>
            <path d="M5 8V5.5a3 3 0 016 0V8" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>{' '}
          lock icon (top-right corner) for 2 seconds to exit.
        </p>
      </div>
    </div>
  )
}
