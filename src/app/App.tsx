// App — root component. Reads `mode` from the Zustand store and renders
// the appropriate top-level view. No React Router needed for the main SPA flow
// (mode transitions are in-memory); react-router-dom is used only for the
// /purchase/success return URL from Stripe Checkout.
//
// Exit gate flow (PRD §5.3):
//   Playground  ─[hold Escape 5s / lock-icon 2s]→  Exit gate overlay (on top of
//                                                    dimmed playground)
//               ─[correct answer]→  Settings
//               ─[Cancel]        →  back to playground (gate dismissed)
//   Settings    ─[Start Playing] →  Playground  (NO gate on re-entry)

import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from '@/components/auth/AuthProvider'
import Playground from '@/components/playground/Playground'
import ParentGate from '@/components/settings/ParentGate'
import SettingsPanel from '@/components/settings/SettingsPanel'
import InputBlocker from '@/components/input/InputBlocker'
import { exitFullscreen } from '@/utils/platform'
import { useAppStore, selectMode } from './store'

const PAGE_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
}
const PAGE_TRANSITION = { duration: 0.25, ease: 'easeInOut' as const }

export default function App() {
  const mode           = useAppStore(selectMode)
  const setMode        = useAppStore(s => s.setMode)
  const showExitGate   = useAppStore(s => s.showExitGate)
  const setShowExitGate = useAppStore(s => s.setShowExitGate)

  return (
    <AuthProvider>
      <div className="fixed inset-0 w-full h-full overflow-hidden bg-kidboard-bg">

        {/* ── Main page stack ──────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* Landing */}
          {mode === 'landing' && (
            <motion.div
              key="landing"
              className="flex flex-col items-center justify-center w-full h-full gap-6"
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={PAGE_TRANSITION}
            >
              <h1 className="text-6xl font-bold text-white tracking-wide">KidBoard</h1>
              <p className="text-kidboard-accent text-xl">A sensory playground for little ones</p>
              <button
                className="mt-8 px-10 py-4 bg-kidboard-accent text-white text-2xl font-bold rounded-full shadow-lg active:scale-95 transition-transform"
                onClick={() => setMode('playground')}
              >
                Start Playing ▶
              </button>
              {/* Settings from landing — direct, no gate (not exiting fullscreen playground) */}
              <button
                className="text-gray-400 text-sm underline"
                onClick={() => setMode('settings')}
              >
                Settings
              </button>
            </motion.div>
          )}

          {/* Playground — InputBlocker suspended while exit gate is open so parent can type */}
          {mode === 'playground' && (
            <motion.div
              key="playground"
              className="fixed inset-0"
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={PAGE_TRANSITION}
            >
              {!showExitGate && <InputBlocker />}
              <Playground />
            </motion.div>
          )}

          {/* Settings */}
          {mode === 'settings' && (
            <motion.div
              key="settings"
              className="fixed inset-0"
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={PAGE_TRANSITION}
            >
              <SettingsPanel />
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── Exit gate overlay — floats above everything at z-200 ─────────── */}
        {/* Rendered outside AnimatePresence so playground stays mounted/visible */}
        <AnimatePresence>
          {showExitGate && (
            <motion.div
              key="exit-gate-backdrop"
              className="fixed inset-0 flex items-center justify-center"
              style={{ zIndex: 200, backdropFilter: 'blur(3px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              // Prevent clicks/touches on the backdrop from reaching the playground
              onPointerDown={e => e.stopPropagation()}
            >
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/75" />

              {/* Gate modal */}
              <div className="relative z-10 w-full">
                <ParentGate
                  onSuccess={() => {
                    setShowExitGate(false)
                    exitFullscreen()
                    setMode('settings')
                  }}
                  onCancel={() => setShowExitGate(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AuthProvider>
  )
}
