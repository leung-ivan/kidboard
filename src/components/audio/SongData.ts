// SongData — static registry of all public-domain songs used in KidBoard.
// filePath references assets under /src/assets/audio/songs/.
// BPM is hardcoded (no runtime detection).

export interface SongMetadata {
  id: string
  title: string
  category: 'lullaby' | 'nursery' | 'learning'
  filePath: string
  bpm: number
  duration: number       // seconds
  defaultForThemes: string[]
}

export const SONGS: SongMetadata[] = [
  {
    id: 'twinkle-twinkle',
    title: 'Twinkle Twinkle Little Star',
    category: 'lullaby',
    filePath: '/audio/songs/twinkle-twinkle.wav',
    bpm: 80,
    duration: 60,
    defaultForThemes: ['stars', 'solar-system'],
  },
  {
    id: 'abc-song',
    title: 'ABC Song',
    category: 'learning',
    filePath: '/audio/songs/abc-song.wav',
    bpm: 110,
    duration: 55,
    defaultForThemes: ['alphabet', 'musical-instruments'],
  },
  {
    id: 'counting-song',
    title: 'Counting Song',
    category: 'learning',
    filePath: '/audio/songs/counting-song.wav',
    bpm: 115,
    duration: 50,
    defaultForThemes: ['numbers', 'dinosaurs', 'fruits-vegetables'],
  },
  {
    id: 'old-macdonald',
    title: "Old MacDonald Had a Farm",
    category: 'nursery',
    filePath: '/audio/songs/old-macdonald.mp3',
    bpm: 105,
    duration: 70,
    defaultForThemes: ['farm-animals'],
  },
  {
    id: 'mary-little-lamb',
    title: 'Mary Had a Little Lamb',
    category: 'nursery',
    filePath: '/audio/songs/mary-little-lamb.mp3',
    bpm: 100,
    duration: 45,
    defaultForThemes: [],
  },
  {
    id: 'bingo',
    title: 'Bingo',
    category: 'nursery',
    filePath: '/audio/songs/bingo.mp3',
    bpm: 112,
    duration: 55,
    defaultForThemes: ['pet-animals'],
  },
  {
    id: 'wheels-on-the-bus',
    title: 'Wheels on the Bus',
    category: 'nursery',
    filePath: '/audio/songs/wheels-on-the-bus.mp3',
    bpm: 108,
    duration: 65,
    defaultForThemes: ['transportation'],
  },
]

export const SONGS_BY_ID = Object.fromEntries(SONGS.map(s => [s.id, s]))
