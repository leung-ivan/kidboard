// App — root component. Reads `mode` from the Zustand store and renders
// the appropriate top-level view. No React Router needed for the main SPA flow
// (mode transitions are in-memory); react-router-dom is used only for the
// /purchase/success return URL from Stripe Checkout.

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from '@/components/auth/AuthProvider'
import Playground from '@/components/playground/Playground'
import ParentGate from '@/components/settings/ParentGate'
import SettingsPanel from '@/components/settings/SettingsPanel'
import InputBlocker from '@/components/input/InputBlocker'
import { useAppStore, selectMode } from './store'

const PAGE_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
}
const PAGE_TRANSITION = { duration: 0.25, ease: 'easeInOut' as const }

export default function App() {
  const mode    = useAppStore(selectMode)
  const setMode = useAppStore(s => s.setMode)

  // Track which mode the user was in before entering parent-gate/settings so
  // Cancel on ParentGate correctly navigates back (playground vs. landing).
  // We only update this ref when the mode is a "content" mode — not while
  // inside the gate/settings flow itself.
  const returnModeRef = useRef<'landing' | 'playground'>('landing')
  useEffect(() => {
    if (mode === 'landing' || mode === 'playground') {
      returnModeRef.current = mode
    }
  }, [mode])

  return (
    <AuthProvider>
      <div className="fixed inset-0 w-full h-full overflow-hidden bg-kidboard-bg">
        <AnimatePresence mode="wait">
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
              <button
                className="text-gray-400 text-sm underline"
                onClick={() => setMode('parent-gate')}
              >
                Settings
              </button>
            </motion.div>
          )}

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
              <InputBlocker />
              <Playground />
            </motion.div>
          )}

          {mode === 'parent-gate' && (
            <motion.div
              key="parent-gate"
              className="fixed inset-0 flex items-center justify-center bg-black/80"
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={PAGE_TRANSITION}
            >
              <ParentGate
                onSuccess={() => setMode('settings')}
                // returnModeRef correctly holds 'playground' or 'landing'
                // (whichever the user was at before entering this gate)
                onCancel={() => setMode(returnModeRef.current)}
              />
            </motion.div>
          )}

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
      </div>
    </AuthProvider>
  )
}
