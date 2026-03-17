// SoundSettings — "Sound" tab in SettingsPanel.
// Item Sounds, Phonics, and Pronunciation are active.
// Vocabulary Words is coming soon (needs real audio recordings).

import { motion } from 'framer-motion'
import { useAppStore, selectSoundMode } from '@/app/store'
import type { Settings } from '@/app/store'

interface SoundModeOption {
  id:          Settings['soundMode']
  label:       string
  description: string
  available:   boolean
}

const OPTIONS: SoundModeOption[] = [
  {
    id:          'item_sounds',
    label:       'Item Sounds',
    description: 'Each key or tap plays a unique chime for that item.',
    available:   true,
  },
  {
    id:          'phonics',
    label:       'Phonics',
    description: 'Hear the letter sound when you press a key (alphabet theme).',
    available:   true,
  },
  {
    id:          'pronunciation',
    label:       'Pronunciation',
    description: 'Hear the item name spoken aloud on each press.',
    available:   true,
  },
  {
    id:          'vocabulary',
    label:       'Vocabulary Words',
    description: 'Hear a vocabulary word associated with each item.',
    available:   false,
  },
]

export default function SoundSettings() {
  const soundMode      = useAppStore(selectSoundMode)
  const updateSettings = useAppStore(s => s.updateSettings)

  return (
    <div className="space-y-5">
      {/* Sound mode card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Sound Mode
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {OPTIONS.map(opt => (
            <SoundModeRow
              key={opt.id}
              option={opt}
              isSelected={soundMode === opt.id}
              onSelect={() => {
                if (opt.available) updateSettings({ soundMode: opt.id })
              }}
            />
          ))}
        </div>
      </div>

      {/* Placeholder note */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
        <p className="text-sm text-blue-700 leading-relaxed">
          <span className="font-semibold">Using placeholder tones.</span>{' '}
          Phonics and Pronunciation play unique chimes per item until real
          audio recordings are added to{' '}
          <code className="font-mono text-xs bg-blue-100 px-1 py-0.5 rounded">
            public/audio/
          </code>
          . Vocabulary Words mode is coming in a future update.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SoundModeRow
// ---------------------------------------------------------------------------

function SoundModeRow({
  option,
  isSelected,
  onSelect,
}: {
  option:     SoundModeOption
  isSelected: boolean
  onSelect:   () => void
}) {
  return (
    <motion.button
      whileTap={option.available ? { scale: 0.99 } : {}}
      onClick={onSelect}
      disabled={!option.available}
      className={[
        'w-full text-left flex items-start gap-4 px-5 py-4 transition-colors',
        option.available ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-not-allowed opacity-50',
        isSelected ? 'bg-blue-50 hover:bg-blue-50' : '',
      ].join(' ')}
    >
      {/* Custom radio dot */}
      <div className="mt-0.5 flex-shrink-0">
        <div className={[
          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
          isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300',
        ].join(' ')}>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 rounded-full bg-white"
            />
          )}
        </div>
      </div>

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={[
            'text-sm font-semibold',
            isSelected ? 'text-blue-700' : 'text-slate-800',
          ].join(' ')}>
            {option.label}
          </span>
          {!option.available && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                             bg-slate-100 text-slate-400 tracking-wide">
              SOON
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
          {option.description}
        </p>
      </div>
    </motion.button>
  )
}
