// Alphabet theme — free. Supports Phonics and Vocabulary sound modes.
// Each letter is an item; matchKey = the letter itself.
// vocabularyMap: letter → example word (used in Vocabulary Words mode).

import type { ThemeConfig } from './types'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const VOCABULARY_MAP: Record<string, string> = {
  A: 'Apple', B: 'Ball', C: 'Cat', D: 'Dog', E: 'Elephant',
  F: 'Fish', G: 'Goat', H: 'Hat', I: 'Ice cream', J: 'Jellyfish',
  K: 'Kite', L: 'Lion', M: 'Monkey', N: 'Nest', O: 'Octopus',
  P: 'Penguin', Q: 'Queen', R: 'Rainbow', S: 'Sun', T: 'Tiger',
  U: 'Umbrella', V: 'Violin', W: 'Whale', X: 'Xylophone', Y: 'Yo-yo', Z: 'Zebra',
}

const alphabet: ThemeConfig = {
  id: 'alphabet',
  name: 'Alphabet',
  tier: 'free',
  priceInCents: 0,
  background: {
    type: 'gradient',
    value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  },
  palette: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#C7CEEA'],
  defaultSongs: ['abc-song'],
  vocabularyMap: VOCABULARY_MAP,
  items: LETTERS.map(letter => ({
    id: `letter-${letter.toLowerCase()}`,
    name: letter,
    svgComponent: `Letter${letter}Svg`,
    soundFile: `/audio/sfx/letter-${letter.toLowerCase()}.mp3`,
    pronunciationFile: `/audio/pronounce/letter-${letter.toLowerCase()}.mp3`,
    matchKey: letter,
  })),
}

export default alphabet
