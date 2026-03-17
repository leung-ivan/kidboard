// AudioManager — Howler.js wrapper for KidBoard audio system.
//
// Responsibilities:
//   • Playlist: auto-advancing song queue, skip on load error, BPM callbacks
//   • SFX one-shot: playSfx() for trigger events
//   • SFX hold-loop: startHoldSfx() with 50ms crossfade at loop boundary
//   • ToneSynth: Web Audio API fallback when a file fails to load (404 etc.)
//   • Separate music/sfx volume controls
//   • unlockAudio(): resumes AudioContext on first user gesture (iOS requirement)
//
// File loading strategy:
//   All src arrays include a .wav fallback so placeholder WAV files work
//   while real .mp3 files are pending:
//     preloadSfx('/audio/sfx/star-chime.mp3')
//     → Howler tries ['.mp3', '.wav'] in order

import { Howl, Howler } from 'howler'
import type { SongMetadata } from './SongData'

// ---------------------------------------------------------------------------
// ToneSynth — Web Audio API synthesiser used as fallback for missing files
// ---------------------------------------------------------------------------

// C major pentatonic scale across two octaves — pleasant for children
const PENTATONIC_HZ = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.26, 783.99, 880.00]

/** Hashes a string to a stable musical note frequency. */
function hashToFreq(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffff
  return PENTATONIC_HZ[Math.abs(h) % PENTATONIC_HZ.length]
}

class ToneSynth {
  private ctx: AudioContext | null = null

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext()
    }
    // Resume if suspended (iOS autoplay policy)
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  /** Play a single tone burst. */
  play(fileKey: string, volume = 0.5, duration = 0.35) {
    try {
      const ctx  = this.getCtx()
      const freq = hashToFreq(fileKey)
      const now  = ctx.currentTime

      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      // Soft attack (20ms) + exponential decay to near-zero
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(volume, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + duration + 0.01)
    } catch { /* AudioContext may be unavailable in test environments */ }
  }

  /** Start a looping tone. Returns a stop function. */
  startLoop(fileKey: string, volume = 0.5): () => void {
    let active = true
    const loopMs = 350

    const cycle = () => {
      if (!active) return
      this.play(fileKey, volume, loopMs / 1000)
      setTimeout(cycle, loopMs - 50) // 50ms before the tone ends → crossfade-like overlap
    }
    cycle()

    return () => { active = false }
  }

  resume() {
    this.ctx?.resume()
  }
}

// ---------------------------------------------------------------------------
// AudioManager
// ---------------------------------------------------------------------------

export class AudioManager {
  private readonly toneSynth = new ToneSynth()

  // ── Playlist state ────────────────────────────────────────────────────────
  private playlist: SongMetadata[] = []
  private playlistIdx = 0
  private songHowl: Howl | null = null
  private onBpmChange: ((bpm: number) => void) | null = null
  private _isPlaying = false

  // ── SFX state ─────────────────────────────────────────────────────────────
  private sfxHowls = new Map<string, Howl>()
  /** Files that failed to load — served by ToneSynth instead. */
  private sfxFallbacks = new Set<string>()

  // ── Volume state ──────────────────────────────────────────────────────────
  private _musicVolume = 0.45
  private _sfxVolume   = 0.65

  // ── Playlist API ─────────────────────────────────────────────────────────

  /**
   * Load a playlist and immediately start playing song[0].
   * @param onBpmChange Called each time the playing song changes.
   */
  loadPlaylist(songs: SongMetadata[], onBpmChange?: (bpm: number) => void) {
    this._stopSong()
    this.playlist    = songs
    this.playlistIdx = 0
    this.onBpmChange = onBpmChange ?? null
    if (songs.length > 0) this._playSong(0)
  }

  pause() {
    this.songHowl?.pause()
    this._isPlaying = false
  }

  resume() {
    this.songHowl?.play()
    this._isPlaying = true
  }

  next() {
    const next = (this.playlistIdx + 1) % Math.max(1, this.playlist.length)
    this._playSong(next)
  }

  prev() {
    const prev = (this.playlistIdx - 1 + this.playlist.length) % Math.max(1, this.playlist.length)
    this._playSong(prev)
  }

  skipTo(index: number) {
    this._playSong(index)
  }

  // ── SFX API ───────────────────────────────────────────────────────────────

  /**
   * Preload SFX for a set of file paths.
   * Tries ['.mp3', '.wav'] in order; falls back to ToneSynth on load error.
   */
  preloadSfx(files: string[]) {
    files.forEach(file => {
      if (!file || this.sfxHowls.has(file) || this.sfxFallbacks.has(file)) return

      const howl = new Howl({
        src:     this._sfxSrc(file),
        preload: true,
        volume:  this._sfxVolume,
        onloaderror: () => {
          // File not available — route to ToneSynth
          this.sfxHowls.delete(file)
          this.sfxFallbacks.add(file)
        },
      })
      this.sfxHowls.set(file, howl)
    })
  }

  /** One-shot trigger SFX (item tap / keypress). */
  playSfx(file: string) {
    if (this.sfxFallbacks.has(file)) {
      this.toneSynth.play(file, this._sfxVolume)
      return
    }
    const howl = this.sfxHowls.get(file)
    if (!howl) {
      // Not preloaded yet — synthesise immediately
      this.toneSynth.play(file, this._sfxVolume)
      return
    }
    howl.volume(this._sfxVolume)
    howl.play()
  }

  /**
   * Start a crossfade-looped SFX for a key/touch hold.
   * @returns A stop function — call it on hold release.
   */
  startHoldSfx(file: string): () => void {
    // Fallback path: ToneSynth loop
    if (this.sfxFallbacks.has(file) || !this.sfxHowls.has(file)) {
      return this.toneSynth.startLoop(file, this._sfxVolume)
    }

    const howl   = this.sfxHowls.get(file)!
    const fadeMs = 50
    let active       = true
    let currentId: number | null = null

    const doLoop = () => {
      if (!active) return

      const durMs = howl.duration() * 1000

      // Very short or unknown duration — use Howler's native loop (no crossfade needed)
      if (durMs <= 0 || durMs < fadeMs * 3) {
        const id = howl.play()
        currentId = id
        howl.loop(true,          id)
        howl.volume(this._sfxVolume, id)
        return
      }

      // Crossfade loop: fade-in at start, start next instance fadeMs before the end
      const id = howl.play()
      currentId = id
      howl.volume(0,               id)
      howl.fade(0, this._sfxVolume, fadeMs, id)

      const xfadeAt = durMs - fadeMs
      setTimeout(() => {
        if (!active) {
          howl.stop(id)
          return
        }
        // Fade out this instance as the next one fades in
        howl.fade(this._sfxVolume, 0, fadeMs, id)
        doLoop()
      }, xfadeAt)

      // Hard-stop this instance once fully silent (dur + small buffer)
      setTimeout(() => {
        try { howl.stop(id) } catch { /* already stopped */ }
      }, durMs + 20)
    }

    // Wait for the Howl to be loaded before looping
    if (howl.state() === 'loaded') {
      doLoop()
    } else {
      howl.once('load', doLoop)
    }

    return () => {
      active = false
      if (currentId !== null) {
        try { howl.stop(currentId) } catch { /* already stopped */ }
        currentId = null
      }
    }
  }

  // ── Volume API ────────────────────────────────────────────────────────────

  setMusicVolume(v: number) {
    this._musicVolume = Math.max(0, Math.min(1, v))
    if (this.songHowl) this.songHowl.volume(this._musicVolume)
  }

  setSfxVolume(v: number) {
    this._sfxVolume = Math.max(0, Math.min(1, v))
  }

  /** Set master volume (both music and SFX scaled together). */
  setMasterVolume(v: number) {
    Howler.volume(Math.max(0, Math.min(1, v)))
  }

  // ── Unlock (iOS/Safari autoplay policy) ───────────────────────────────────

  /**
   * Call once on any user gesture (keydown, pointerdown).
   * Resumes the AudioContext so sounds play on iOS.
   */
  unlockAudio() {
    this.toneSynth.resume()
    // Howler auto-unlocks on first play, but this covers edge cases
    if (this.songHowl && Howler.ctx?.state === 'suspended') {
      Howler.ctx.resume()
    }
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get currentBpm():    number  { return this.playlist[this.playlistIdx]?.bpm     ?? 80 }
  get currentSongId(): string  { return this.playlist[this.playlistIdx]?.id       ?? '' }
  get isPlaying():     boolean { return this._isPlaying }
  get musicVolume():   number  { return this._musicVolume }
  get sfxVolume():     number  { return this._sfxVolume }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  destroy() {
    this._stopSong()
    this.sfxHowls.forEach(h => h.unload())
    this.sfxHowls.clear()
    this.sfxFallbacks.clear()
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _playSong(index: number) {
    const song = this.playlist[index]
    if (!song) return

    this._stopSong()
    this.playlistIdx = index

    this.songHowl = new Howl({
      src:    this._songSrc(song.filePath),
      volume: this._musicVolume,
      loop:   false,
      onplay: () => {
        this._isPlaying = true
        this.onBpmChange?.(song.bpm)
      },
      onend: () => {
        // Auto-advance to next song
        const nextIdx = (index + 1) % this.playlist.length
        this._playSong(nextIdx)
      },
      onloaderror: () => {
        // Skip to next song silently — placeholder files may not exist yet
        const nextIdx = (index + 1) % this.playlist.length
        if (nextIdx !== index) {
          // Avoid infinite loop if all songs are missing
          this._playSong(nextIdx)
        }
      },
    })
    this.songHowl.play()
  }

  private _stopSong() {
    if (this.songHowl) {
      this.songHowl.stop()
      this.songHowl.unload()
      this.songHowl = null
    }
    this._isPlaying = false
  }

  /** Returns ['.mp3', '.wav'] src array so Howler tries the real file first,
   *  then falls back to our placeholder WAV. */
  private _sfxSrc(file: string): string[] {
    if (file.endsWith('.mp3')) return [file, file.replace(/\.mp3$/, '.wav')]
    return [file]
  }

  private _songSrc(file: string): string[] {
    if (file.endsWith('.mp3')) return [file, file.replace(/\.mp3$/, '.wav')]
    return [file]
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const audioManager = new AudioManager()
