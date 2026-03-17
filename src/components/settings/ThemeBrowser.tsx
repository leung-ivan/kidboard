// ThemeBrowser — "Theme" tab in SettingsPanel.
// 3 real free themes (selectable) + coming-soon placeholders.

import { motion } from 'framer-motion'
import { useAppStore } from '@/app/store'
import { THEMES } from '@/themes/index'
import type { ThemeConfig } from '@/themes/types'

// Placeholder cards for themes not yet implemented
const COMING_SOON = [
  { id: 'solar-system',  name: 'Solar System',  emoji: '🌌', palette: ['#0A0A2E','#1B2A6B','#4B6BCC','#7B9AE0','#FFD700','#FF8C42'] },
  { id: 'pet-animals',   name: 'Pet Animals',   emoji: '🐾', palette: ['#FFF5E6','#FFDDB3','#FFB347','#8B6914','#6B4226','#D2691E'] },
  { id: 'farm-animals',  name: 'Farm Animals',  emoji: '🐄', palette: ['#E8F5E9','#C8E6C9','#81C784','#4CAF50','#2E7D32','#795548'] },
]

export default function ThemeBrowser() {
  const selectedThemeId = useAppStore(s => s.settings.selectedThemeId)
  const updateSettings  = useAppStore(s => s.updateSettings)

  return (
    <div className="space-y-5">
      {/* Real themes */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Free Themes
        </p>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isSelected={theme.id === selectedThemeId}
              onSelect={() => updateSettings({ selectedThemeId: theme.id })}
            />
          ))}
        </div>
      </div>

      {/* Coming-soon placeholder themes */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Coming Soon
        </p>
        <div className="grid grid-cols-2 gap-3">
          {COMING_SOON.map(t => (
            <ComingSoonCard key={t.id} name={t.name} emoji={t.emoji} palette={t.palette} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ThemeCard — a selectable theme tile
// ---------------------------------------------------------------------------

function ThemeCard({
  theme,
  isSelected,
  onSelect,
}: {
  theme: ThemeConfig
  isSelected: boolean
  onSelect: () => void
}) {
  const emoji = themeEmoji(theme.id)

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={[
        'relative text-left rounded-2xl overflow-hidden border-2 transition-all duration-200',
        isSelected
          ? 'border-blue-500 shadow-md shadow-blue-500/15'
          : 'border-slate-200 hover:border-slate-300',
      ].join(' ')}
    >
      {/* Palette swatch strip */}
      <div className="h-16 flex">
        {theme.palette.map((color, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Info */}
      <div className="bg-white px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="mr-1.5">{emoji}</span>
            <span className="text-sm font-semibold text-slate-800">{theme.name}</span>
          </div>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
            >
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">Free</p>
      </div>
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// ComingSoonCard — locked placeholder tile
// ---------------------------------------------------------------------------

function ComingSoonCard({
  name,
  emoji,
  palette,
}: {
  name: string
  emoji: string
  palette: string[]
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 opacity-60">
      {/* Palette swatch strip */}
      <div className="h-16 flex">
        {palette.map((color, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      {/* Blur + lock overlay */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-start justify-end p-2">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-700/80 text-white">
          Soon
        </span>
      </div>

      {/* Info */}
      <div className="bg-white px-3 py-2.5">
        <span className="mr-1.5">{emoji}</span>
        <span className="text-sm font-semibold text-slate-400">{name}</span>
        <p className="text-xs text-slate-300 mt-0.5">Coming soon</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function themeEmoji(id: string): string {
  const map: Record<string, string> = {
    stars:    '⭐',
    alphabet: '🔤',
    numbers:  '🔢',
  }
  return map[id] ?? '🎨'
}
