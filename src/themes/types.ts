// Theme type definitions — from PRD Section 7.3.

export interface ThemeConfig {
  id: string
  name: string
  tier: 'free' | 'paid'
  priceInCents: number          // 0 for free, 99–199 for paid
  items: ThemeItem[]
  background: { type: 'gradient' | 'svg'; value: string }
  palette: string[]             // 5–6 hex glow/highlight colors (WCAG contrast on bg)
  defaultSongs: string[]        // SongMetadata IDs
  vocabularyMap?: Record<string, string>  // letter → word (Alphabet theme)
}

export interface ThemeItem {
  id: string
  name: string                  // label shown in Preschool mode
  svgComponent: string          // name of the React SVG component in assets/svg/
  soundFile: string             // path under /audio/sfx/
  pronunciationFile: string     // spoken name .mp3
  matchKey?: string             // key that preferentially triggers this item (uppercase)
}

/** Runtime state for a single playground item. */
export interface ItemState {
  id: string
  position: { x: number; y: number }
  scale: number                 // 1.0 at rest, up to 2.5 during hold
  glowColor: string | null      // null = not glowing
  isDragging: boolean
  homePosition: { x: number; y: number }
}
