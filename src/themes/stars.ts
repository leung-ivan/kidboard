// Stars theme — free, default theme. Default song: Twinkle Twinkle Little Star.
// SVG components and audio files are placeholders until assets are added.

import type { ThemeConfig } from './types'

const stars: ThemeConfig = {
  id: 'stars',
  name: 'Stars',
  tier: 'free',
  priceInCents: 0,
  background: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #0A0A2E 0%, #0D1B4B 50%, #0A0A2E 100%)',
  },
  // User-specified palette: gold, white, light blue, soft pink, pale yellow, lavender
  palette: ['#FFD700', '#FFFFFF', '#87CEEB', '#FFB6C1', '#FFFACD', '#E6E6FA'],
  defaultSongs: ['twinkle-twinkle'],
  // 8 items for the initial playground build (more can be added later)
  items: [
    { id: 'star-1',       name: 'Star',         svgComponent: 'StarSvg',         soundFile: '/audio/sfx/star-chime.mp3',       pronunciationFile: '/audio/pronounce/star.mp3',         matchKey: 'S' },
    { id: 'moon-1',       name: 'Moon',         svgComponent: 'MoonSvg',         soundFile: '/audio/sfx/moon-chime.mp3',       pronunciationFile: '/audio/pronounce/moon.mp3',         matchKey: 'M' },
    { id: 'planet-1',     name: 'Planet',       svgComponent: 'PlanetSvg',       soundFile: '/audio/sfx/planet-chime.mp3',     pronunciationFile: '/audio/pronounce/planet.mp3',       matchKey: 'P' },
    { id: 'comet-1',      name: 'Comet',        svgComponent: 'CometSvg',        soundFile: '/audio/sfx/comet-chime.mp3',      pronunciationFile: '/audio/pronounce/comet.mp3',        matchKey: 'C' },
    { id: 'rocket-1',     name: 'Rocket',       svgComponent: 'RocketSvg',       soundFile: '/audio/sfx/rocket-whoosh.mp3',    pronunciationFile: '/audio/pronounce/rocket.mp3',       matchKey: 'R' },
    { id: 'sun-1',        name: 'Sun',          svgComponent: 'SunSvg',          soundFile: '/audio/sfx/sun-chime.mp3',        pronunciationFile: '/audio/pronounce/sun.mp3',          matchKey: 'U' },
    { id: 'shooting-1',   name: 'Shooting Star',svgComponent: 'ShootingStarSvg', soundFile: '/audio/sfx/shooting-star.mp3',    pronunciationFile: '/audio/pronounce/shooting-star.mp3' },
    { id: 'sparkle-1',    name: 'Sparkle',      svgComponent: 'SparkleSvg',      soundFile: '/audio/sfx/sparkle-chime.mp3',   pronunciationFile: '/audio/pronounce/sparkle.mp3' },
  ],
}

export default stars
