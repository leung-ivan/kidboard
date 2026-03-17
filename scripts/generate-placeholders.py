#!/usr/bin/env python3
"""
generate-placeholders.py — Creates WAV placeholder audio files for KidBoard.

Run from the project root:
    python3 scripts/generate-placeholders.py

Generates:
  public/audio/sfx/*.wav   — unique sine-wave tones for each Stars theme item
  public/audio/songs/*.wav — short silent stubs for the 3 starter songs

These files are served as .wav fallbacks by AudioManager when the final .mp3
files are not yet present (Howler src: ['file.mp3', 'file.wav']).
Replace with real audio files by dropping the corresponding .mp3 into the
same directories — the .wav files can then be deleted.
"""

import math
import os
import struct
import wave

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

SAMPLE_RATE = 22050   # Hz — good balance of quality vs file size
BIT_DEPTH   = 2       # bytes per sample (16-bit PCM)

def write_wav(path: str, frames: bytes):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, 'w') as w:
        w.setnchannels(1)          # mono
        w.setsampwidth(BIT_DEPTH)  # 16-bit
        w.setframerate(SAMPLE_RATE)
        w.writeframes(frames)
    size_kb = os.path.getsize(path) / 1024
    print(f"  ✓ {path}  ({size_kb:.1f} KB)")


def sine_tone(freq: float, duration: float, volume: float = 0.55) -> bytes:
    """
    Generate a sine wave tone with a soft ADSR envelope.
    - Attack:  20ms linear ramp up
    - Decay:   30ms ramp to sustain level (0.85 × peak)
    - Sustain: body of the note
    - Release: 60ms exponential decay to silence
    """
    n_samples = int(SAMPLE_RATE * duration)
    attack_n  = int(SAMPLE_RATE * 0.020)
    decay_n   = int(SAMPLE_RATE * 0.030)
    release_n = int(SAMPLE_RATE * 0.060)
    sustain   = 0.85 * volume

    frames = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        # Envelope
        if i < attack_n:
            env = volume * (i / attack_n)
        elif i < attack_n + decay_n:
            p   = (i - attack_n) / decay_n
            env = volume + (sustain - volume) * p
        elif i >= n_samples - release_n:
            p   = (n_samples - i) / release_n
            env = sustain * max(p, 0.0)
        else:
            env = sustain

        sample = int(env * 32767 * math.sin(2 * math.pi * freq * t))
        sample = max(-32768, min(32767, sample))
        frames.append(struct.pack('<h', sample))

    return b''.join(frames)


def sweep_tone(freq_lo: float, freq_hi: float, duration: float, volume: float = 0.50) -> bytes:
    """
    Exponential frequency sweep (for rocket whoosh effect).
    """
    n_samples = int(SAMPLE_RATE * duration)
    release_n = int(SAMPLE_RATE * 0.060)
    frames = []
    phase = 0.0

    for i in range(n_samples):
        t   = i / (n_samples - 1)                               # 0.0 → 1.0
        freq = freq_lo * ((freq_hi / freq_lo) ** t)             # exponential sweep
        phase += 2 * math.pi * freq / SAMPLE_RATE

        # Envelope: full volume through body, short release at the end
        if i >= n_samples - release_n:
            env = volume * ((n_samples - i) / release_n)
        else:
            env = volume

        sample = int(env * 32767 * math.sin(phase))
        sample = max(-32768, min(32767, sample))
        frames.append(struct.pack('<h', sample))

    return b''.join(frames)


def silence(duration: float) -> bytes:
    """Generate silent PCM frames."""
    n_samples = int(SAMPLE_RATE * duration)
    return struct.pack('<h', 0) * n_samples


def chime_tone(fund: float, duration: float, volume: float = 0.50) -> bytes:
    """
    Bell-like chime: fundamental + 2nd harmonic (slight detuning for shimmer).
    """
    n_samples = int(SAMPLE_RATE * duration)
    attack_n  = int(SAMPLE_RATE * 0.010)   # very fast attack (percussive)
    release_n = int(SAMPLE_RATE * 0.180)   # long tail

    frames = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        # Envelope: instant attack, slow exponential decay (bell-like)
        if i < attack_n:
            env = volume * (i / attack_n)
        else:
            decay_frac = (i - attack_n) / max(n_samples - attack_n, 1)
            env = volume * max(1.0 - decay_frac, 0.0)

        # Bell partials: fundamental + slightly-detuned octave partial
        s = (math.sin(2 * math.pi * fund * t) * 0.70
           + math.sin(2 * math.pi * fund * 2.02 * t) * 0.30)

        sample = int(env * 32767 * s)
        sample = max(-32768, min(32767, sample))
        frames.append(struct.pack('<h', sample))

    return b''.join(frames)


# ---------------------------------------------------------------------------
# Define sounds
# ---------------------------------------------------------------------------

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")

# Musical note frequencies (Hz)
C4, D4, E4, F4, G4, A4, B4 = 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88
C5, D5, E5, F5, G5, A5, B5 = 523.25, 587.33, 659.26, 698.46, 783.99, 880.00, 987.77
C6 = 1046.50

SFX = [
    # (filename,             generator function,                          duration_s)
    ("star-chime",     lambda d: chime_tone(C5,  d, 0.60), 0.70),
    ("moon-chime",     lambda d: chime_tone(G4,  d, 0.55), 0.80),  # lower, dreamy
    ("planet-chime",   lambda d: chime_tone(A4,  d, 0.55), 0.75),
    ("comet-chime",    lambda d: chime_tone(E5,  d, 0.55), 0.65),
    ("rocket-whoosh",  lambda d: sweep_tone(180, 1100, d, 0.50), 0.60),
    ("sun-chime",      lambda d: chime_tone(F5,  d, 0.60), 0.70),
    ("shooting-star",  lambda d: chime_tone(B4,  d, 0.45), 0.55),  # shorter, sparkly
    ("sparkle-chime",  lambda d: chime_tone(D5,  d, 0.55), 0.65),
]

SONGS = [
    ("twinkle-twinkle", 10.0),  # 10 s of silence — replace with real MP3 later
    ("abc-song",        10.0),
    ("counting-song",   10.0),
]

# ---------------------------------------------------------------------------
# Chromatic scale for letters — 12 notes of the chromatic scale,
# repeated across two octaves for all 26 letters.
# ---------------------------------------------------------------------------

CHROMATIC_HZ = [
    261.63,  # C4
    277.18,  # C#4
    293.66,  # D4
    311.13,  # Eb4
    329.63,  # E4
    349.23,  # F4
    369.99,  # F#4
    392.00,  # G4
    415.30,  # Ab4
    440.00,  # A4
    466.16,  # Bb4
    493.88,  # B4
    523.25,  # C5
    554.37,  # C#5
    587.33,  # D5
    622.25,  # Eb5
    659.26,  # E5
    698.46,  # F5
    739.99,  # F#5
    783.99,  # G5
    830.61,  # Ab5
    880.00,  # A5
    932.33,  # Bb5
    987.77,  # B5
    1046.50, # C6
    1108.73, # C#6
]

NUMBER_HZ = [
    261.63,  # 0 → C4
    293.66,  # 1 → D4
    329.63,  # 2 → E4
    349.23,  # 3 → F4
    392.00,  # 4 → G4
    440.00,  # 5 → A4
    493.88,  # 6 → B4
    523.25,  # 7 → C5
    587.33,  # 8 → D5
    659.26,  # 9 → E5
]


def two_note_arpeggio(freq: float, duration: float, volume: float = 0.45) -> bytes:
    """
    Play two notes quickly (root then major-third above) — used for
    pronunciation placeholders to distinguish them from single-note SFX.
    """
    half   = duration / 2.0
    note1  = chime_tone(freq,          half,  volume * 0.9)
    note2  = chime_tone(freq * 1.2599, half,  volume * 0.75)  # ~minor-third
    return note1 + note2


# ---------------------------------------------------------------------------
# Generate
# ---------------------------------------------------------------------------

def main():
    print("\n🔊  KidBoard placeholder audio generator\n")

    print("Stars SFX tones → public/audio/sfx/")
    for (name, gen, dur) in SFX:
        path   = os.path.join(BASE, "audio", "sfx", f"{name}.wav")
        frames = gen(dur)
        write_wav(path, frames)

    print("\nSong stubs → public/audio/songs/")
    for (name, dur) in SONGS:
        path   = os.path.join(BASE, "audio", "songs", f"{name}.wav")
        frames = silence(dur)
        write_wav(path, frames)

    print("\nAlphabet SFX tones → public/audio/sfx/letter-*.wav")
    for i, letter in enumerate("abcdefghijklmnopqrstuvwxyz"):
        freq   = CHROMATIC_HZ[i % len(CHROMATIC_HZ)]
        path   = os.path.join(BASE, "audio", "sfx", f"letter-{letter}.wav")
        frames = chime_tone(freq, 0.45, 0.52)
        write_wav(path, frames)

    print("\nAlphabet pronunciation → public/audio/pronounce/letter-*.wav")
    for i, letter in enumerate("abcdefghijklmnopqrstuvwxyz"):
        freq   = CHROMATIC_HZ[i % len(CHROMATIC_HZ)]
        path   = os.path.join(BASE, "audio", "pronounce", f"letter-{letter}.wav")
        frames = two_note_arpeggio(freq, 0.55, 0.48)
        write_wav(path, frames)

    print("\nNumbers SFX tones → public/audio/sfx/number-*.wav")
    for i in range(10):
        freq   = NUMBER_HZ[i]
        path   = os.path.join(BASE, "audio", "sfx", f"number-{i}.wav")
        frames = chime_tone(freq, 0.50, 0.55)
        write_wav(path, frames)

    print("\nNumbers pronunciation → public/audio/pronounce/number-*.wav")
    for i in range(10):
        freq   = NUMBER_HZ[i]
        path   = os.path.join(BASE, "audio", "pronounce", f"number-{i}.wav")
        frames = two_note_arpeggio(freq, 0.60, 0.50)
        write_wav(path, frames)

    print("\n✅  Done. Drop real .mp3 files alongside these .wav files to activate them.")
    print("    AudioManager automatically prefers .mp3 over .wav when both exist.\n")


if __name__ == "__main__":
    main()
