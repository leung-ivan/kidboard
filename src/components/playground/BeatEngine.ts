// BeatEngine — requestAnimationFrame loop that fires callbacks in sync with song BPM.
// Used to drive the subtle scale-pulse (1.0 → 1.08 → 1.0) on every beat.

import { useEffect, useRef, useState } from 'react'

export type BeatCallback = (beatNumber: number, timestamp: number) => void

export class BeatEngine {
  private bpm: number
  private callbacks: Set<BeatCallback> = new Set()
  private rafId: number | null = null
  private startTime: number | null = null
  private lastBeat: number = -1

  constructor(bpm: number) {
    this.bpm = bpm
  }

  setBpm(bpm: number) {
    // Re-sync beat counting when BPM changes without restarting the RAF loop
    this.bpm = bpm
    this.startTime = null  // reset so beat 0 fires immediately after the switch
    this.lastBeat = -1
  }

  /** Subscribe to beats. Returns an unsubscribe function. */
  onBeat(cb: BeatCallback): () => void {
    this.callbacks.add(cb)
    return () => this.callbacks.delete(cb)
  }

  start() {
    if (this.rafId !== null) return  // already running
    this.startTime = null
    this.lastBeat = -1

    const tick = (timestamp: number) => {
      if (this.startTime === null) this.startTime = timestamp
      const elapsed = timestamp - this.startTime
      const beatDuration = (60 / this.bpm) * 1000
      const currentBeat = Math.floor(elapsed / beatDuration)
      if (currentBeat !== this.lastBeat) {
        this.lastBeat = currentBeat
        this.callbacks.forEach(cb => cb(currentBeat, timestamp))
      }
      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.startTime = null
    this.lastBeat = -1
  }

  get isRunning(): boolean {
    return this.rafId !== null
  }
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * useBeatEngine — creates a BeatEngine for the given BPM, starts on mount,
 * stops on unmount. Returns `beatTick` (increments each beat) so components
 * can use it as a useEffect dependency to react to beats.
 */
export function useBeatEngine(bpm: number): { beatTick: number } {
  // Create the engine once; never recreate it
  const engineRef = useRef<BeatEngine | null>(null)
  if (engineRef.current === null) {
    engineRef.current = new BeatEngine(bpm)
  }

  // Sync BPM changes without restarting the loop
  const prevBpmRef = useRef(bpm)
  useEffect(() => {
    if (bpm !== prevBpmRef.current && engineRef.current) {
      engineRef.current.setBpm(bpm)
      prevBpmRef.current = bpm
    }
  }, [bpm])

  const [beatTick, setBeatTick] = useState(0)

  useEffect(() => {
    const engine = engineRef.current!
    const unsub = engine.onBeat(() => setBeatTick(t => t + 1))
    engine.start()
    return () => {
      unsub()
      engine.stop()
    }
  }, [])  // mount/unmount only; BPM updates handled above

  return { beatTick }
}
