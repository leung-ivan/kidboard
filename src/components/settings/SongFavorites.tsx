// SongFavorites — "Music" tab in SettingsPanel.
// Shows the full song catalog with title, category, BPM, and duration.
// Heart-toggle marks favorites (persisted to localStorage via Zustand).
// No playback controls yet — audio wiring in Settings is P1.

import { motion } from 'framer-motion'
import { useAppStore } from '@/app/store'
import { SONGS } from '@/components/audio/SongData'
import type { SongMetadata } from '@/components/audio/SongData'

type Category = SongMetadata['category']

const CATEGORY_LABELS: Record<Category, string> = {
  lullaby:  '🌙 Lullabies',
  nursery:  '🐣 Nursery Rhymes',
  learning: '📚 Learning Songs',
}

const CATEGORY_ORDER: Category[] = ['lullaby', 'nursery', 'learning']

export default function SongFavorites() {
  const favIds         = useAppStore(s => s.settings.favoriteSongIds)
  const updateSettings = useAppStore(s => s.updateSettings)

  const toggleFavorite = (id: string) => {
    const next = favIds.includes(id)
      ? favIds.filter(f => f !== id)
      : [...favIds, id]
    updateSettings({ favoriteSongIds: next })
  }

  // Group songs by category, maintaining order
  const grouped = CATEGORY_ORDER.reduce<Record<Category, SongMetadata[]>>(
    (acc, cat) => {
      acc[cat] = SONGS.filter(s => s.category === cat)
      return acc
    },
    { lullaby: [], nursery: [], learning: [] },
  )

  return (
    <div className="space-y-5">
      {CATEGORY_ORDER.map(cat => {
        const songs = grouped[cat]
        if (songs.length === 0) return null
        return (
          <div key={cat} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {CATEGORY_LABELS[cat]}
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {songs.map(song => (
                <SongRow
                  key={song.id}
                  song={song}
                  isFavorite={favIds.includes(song.id)}
                  onToggleFavorite={() => toggleFavorite(song.id)}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Playback note */}
      <p className="text-center text-xs text-slate-400 pb-2">
        Song previews coming in a future update.
        Add real audio files to{' '}
        <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-500">
          public/audio/songs/
        </code>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SongRow
// ---------------------------------------------------------------------------

function SongRow({
  song,
  isFavorite,
  onToggleFavorite,
}: {
  song:             SongMetadata
  isFavorite:       boolean
  onToggleFavorite: () => void
}) {
  const minutes = Math.floor(song.duration / 60)
  const seconds = song.duration % 60
  const durationStr = `${minutes}:${String(seconds).padStart(2, '0')}`

  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      {/* Music note icon */}
      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-base">
        🎵
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{song.title}</p>
        <p className="text-xs text-slate-400">
          {song.bpm} BPM · {durationStr}
        </p>
      </div>

      {/* Favorite toggle */}
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={onToggleFavorite}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full
                   hover:bg-slate-100 transition-colors"
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <motion.span
          animate={{ scale: isFavorite ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 0.25 }}
          className="text-base leading-none"
        >
          {isFavorite ? '❤️' : '🤍'}
        </motion.span>
      </motion.button>
    </div>
  )
}
