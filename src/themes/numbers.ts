// Numbers theme — free. Default song: Counting Song.

import type { ThemeConfig } from './types'

const numbers: ThemeConfig = {
  id: 'numbers',
  name: 'Numbers',
  tier: 'free',
  priceInCents: 0,
  background: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #0d0d2b 0%, #1a0533 50%, #0d1b4b 100%)',
  },
  palette: ['#FF6B9D', '#C44DFF', '#4DD9FF', '#FFD93D', '#6BCB77', '#FF9A3C'],
  defaultSongs: ['counting-song'],
  items: Array.from({ length: 10 }, (_, i) => ({
    id: `number-${i}`,
    name: String(i),
    svgComponent: `Number${i}Svg`,
    soundFile: `/audio/sfx/number-${i}.mp3`,
    pronunciationFile: `/audio/pronounce/number-${i}.mp3`,
    matchKey: String(i),
  })),
}

export default numbers
