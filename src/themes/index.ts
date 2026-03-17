// Central theme registry — maps theme ID to ThemeConfig.
// Add paid themes here as they are implemented.

import type { ThemeConfig } from './types'
import stars from './stars'
import alphabet from './alphabet'
import numbers from './numbers'

export const THEMES: ThemeConfig[] = [
  stars,
  alphabet,
  numbers,
  // Paid themes (P1/P2) — uncomment as assets + configs are added:
  // solarSystem,
  // petAnimals,
  // farmAnimals,
  // transportation,
  // constructionFarm,
  // flowersGarden,
  // weather,
  // dinosaurs,
  // fruitsVegetables,
  // shapesColors,
  // marineAnimals,
  // musicalInstruments,
]

export const THEMES_BY_ID: Record<string, ThemeConfig> = Object.fromEntries(
  THEMES.map(t => [t.id, t])
)

export const FREE_THEME_IDS = THEMES.filter(t => t.tier === 'free').map(t => t.id)
