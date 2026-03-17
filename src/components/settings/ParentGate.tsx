// ParentGate — exit gate overlay rendered on top of the dimmed playground.
//
// Appears when a parent holds Escape for 5 s (desktop) or holds the lock icon
// for 2 s (mobile).  Guards the transition from fullscreen playground → Settings.
//
// Math problem: random multiplication (2–9 × 2–9).
// Three wrong answers → 30-second cooldown.
// Correct answer → onSuccess()  (App.tsx exits fullscreen + navigates to Settings)
// Cancel button  → onCancel()   (dismisses overlay, playground resumes)

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'

interface ParentGateProps {
  onSuccess: () => void
  onCancel:  () => void
}

interface Problem {
  a:      number
  b:      number
  answer: number
}

const MAX_ATTEMPTS  = 3
const COOLDOWN_SECS = 30

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function newProblem(): Problem {
  const a = 2 + Math.floor(Math.random() * 8) // 2–9
  const b = 2 + Math.floor(Math.random() * 8) // 2–9
  return { a, b, answer: a * b }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ParentGate({ onSuccess, onCancel }: ParentGateProps) {
  const [problem,     setProblem]     = useState<Problem>(newProblem)
  const [input,       setInput]       = useState('')
  const [attempts,    setAttempts]    = useState(0)           // wrong attempts used
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null)
  const [remaining,   setRemaining]   = useState(0)           // seconds left in cooldown
  const [phase,       setPhase]       = useState<'idle' | 'wrong' | 'success'>('idle')

  const inputRef = useRef<HTMLInputElement>(null)

  // MotionValues replace useAnimation (unreliable in Framer Motion v11)
  const shakeX   = useMotionValue(0)   // drives horizontal shake on wrong answer
  const cardScale = useMotionValue(1)  // drives success micro-scale on correct answer

  const isLocked = cooldownEnd !== null

  // ── Cooldown ticker ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!cooldownEnd) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) setCooldownEnd(null)
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [cooldownEnd])

  // ── Focus input when unlocked ────────────────────────────────────────────
  useEffect(() => {
    if (!isLocked) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isLocked])

  // ── Submit handler ───────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const guess = parseInt(input.trim(), 10)
    if (isNaN(guess) || isLocked) return

    if (guess === problem.answer) {
      // Correct ✓ — subtle scale bounce then call onSuccess
      setPhase('success')
      await animate(cardScale, [1, 1.03, 1], { duration: 0.35 })
      setTimeout(onSuccess, 100)
    } else {
      // Wrong ✗ — shake the problem row, increment attempt counter
      setPhase('wrong')
      const nextAttempts = attempts + 1
      setAttempts(nextAttempts)
      setInput('')

      await animate(shakeX, [0, -14, 12, -10, 7, -4, 2, 0], {
        duration: 0.45,
        times: [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1],
      })

      if (nextAttempts >= MAX_ATTEMPTS) {
        setCooldownEnd(Date.now() + COOLDOWN_SECS * 1000)
        setAttempts(0)
        setProblem(newProblem())
      } else {
        setProblem(newProblem())  // fresh problem each wrong attempt
      }
      setPhase('idle')
    }
  }, [input, problem, attempts, isLocked, shakeX, cardScale, onSuccess])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    // Stop propagation so keystrokes don't reach the Playground's KeyHandler
    e.stopPropagation()
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="relative w-full max-w-sm mx-4"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        style={{ scale: cardScale, border: '2px solid #e2e8f0' }}
        className="bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-5 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="#2E75B6" strokeWidth="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="#2E75B6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Parent Check</h2>
          <p className="text-sm text-slate-500 mt-1">
            {isLocked
              ? 'Too many wrong answers — please wait'
              : 'Solve to exit and open settings'}
          </p>
        </div>

        <div className="h-px bg-slate-100 mx-0" />

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="px-8 py-7">
          <AnimatePresence mode="wait">
            {isLocked ? (
              /* Cooldown countdown */
              <motion.div
                key="cooldown"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-2"
              >
                <div className="text-7xl font-extrabold text-slate-800 tabular-nums mb-3 leading-none">
                  {remaining}
                </div>
                <p className="text-slate-400 text-sm mb-5">seconds until you can try again</p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-1.5 rounded-full bg-blue-400 origin-left"
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: remaining / COOLDOWN_SECS }}
                    transition={{ duration: 0.5, ease: 'linear' }}
                  />
                </div>
              </motion.div>
            ) : (
              /* Question + input */
              <motion.div
                key="question"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Problem display — shakes on wrong answer */}
                <motion.div
                  style={{ x: shakeX }}
                  className="flex items-center justify-center gap-4 mb-7"
                >
                  <NumberBadge value={problem.a} />
                  <span className="text-2xl font-light text-slate-400">×</span>
                  <NumberBadge value={problem.b} />
                  <span className="text-2xl font-light text-slate-400">=</span>
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border-2 border-blue-200
                                  flex items-center justify-center shadow-inner">
                    <span className="text-3xl font-bold text-blue-400">?</span>
                  </div>
                </motion.div>

                {/* Answer input */}
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={input}
                  onChange={e => setInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your answer"
                  autoComplete="off"
                  disabled={phase === 'success'}
                  className={[
                    'w-full text-center text-2xl font-semibold tracking-wider',
                    'px-4 py-3 rounded-2xl border-2 outline-none',
                    'transition-all duration-150',
                    phase === 'wrong'
                      ? 'border-red-300 bg-red-50 text-red-600 placeholder:text-red-300'
                      : phase === 'success'
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-300 '
                        + 'focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]',
                  ].join(' ')}
                />

                {/* Attempt indicator dots */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        backgroundColor: i < attempts ? '#f87171' : '#e2e8f0',
                        scale:           i === attempts - 1 ? [1, 1.4, 1] : 1,
                      }}
                      transition={{ duration: 0.25 }}
                      className="w-2.5 h-2.5 rounded-full"
                    />
                  ))}
                  {attempts > 0 && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-slate-400 ml-1"
                    >
                      {MAX_ATTEMPTS - attempts} {MAX_ATTEMPTS - attempts === 1 ? 'try' : 'tries'} left
                    </motion.span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="flex gap-3 px-8 pb-8">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600
                       font-semibold text-base hover:bg-slate-50 active:scale-95 transition-all"
          >
            Cancel
          </button>

          {!isLocked && (
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || phase === 'success'}
              className="flex-1 py-3 rounded-2xl font-semibold text-base transition-all
                         active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
                         bg-blue-600 text-white shadow-md shadow-blue-600/20
                         hover:bg-blue-500 disabled:shadow-none"
            >
              {phase === 'success' ? '✓' : 'Check →'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// NumberBadge
// ---------------------------------------------------------------------------

function NumberBadge({ value }: { value: number }) {
  return (
    <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-slate-200
                    flex items-center justify-center shadow-inner">
      <span className="text-3xl font-bold text-slate-700 tabular-nums">{value}</span>
    </div>
  )
}
