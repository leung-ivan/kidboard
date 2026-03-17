// BackgroundScene — themed background + decorative ambient star field.
// Renders the ThemeConfig's gradient/SVG background and 30 twinkling star dots
// to give the dark sky life. Stars are purely decorative (pointer-events: none).

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'

interface StarDot {
  id: number
  x: number      // % of viewport
  y: number      // % of viewport
  size: number   // px
  opacity: number
  twinkleDuration: number
  twinkleDelay: number
}

function seededRand(seed: number): number {
  // Deterministic pseudo-random (no Math.random so positions stay stable)
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function buildStarField(count: number): StarDot[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: seededRand(i * 3) * 100,
    y: seededRand(i * 7) * 100,
    size: 1 + seededRand(i * 11) * 2.5,       // 1–3.5 px
    opacity: 0.3 + seededRand(i * 13) * 0.5,  // 0.3–0.8
    twinkleDuration: 2.5 + seededRand(i * 17) * 3,  // 2.5–5.5 s
    twinkleDelay: seededRand(i * 19) * 4,             // 0–4 s
  }))
}

// 30 background stars + 8 slightly brighter accent stars near the edges
const BG_STARS = buildStarField(30)
const ACCENT_STARS = buildStarField(8).map((s, i) => ({
  ...s,
  id: 100 + i,
  size: 3 + seededRand(i * 23) * 3,    // 3–6 px — larger accent stars
  opacity: 0.6 + seededRand(i * 29) * 0.3,
}))

interface BackgroundSceneProps {
  gradient: string
}

const StarDotComponent = memo(({ star }: { star: StarDot }) => (
  <motion.div
    key={star.id}
    className="absolute rounded-full pointer-events-none"
    style={{
      left: `${star.x}%`,
      top: `${star.y}%`,
      width: star.size,
      height: star.size,
      backgroundColor: 'white',
    }}
    animate={{ opacity: [star.opacity, star.opacity * 0.25, star.opacity] }}
    transition={{
      duration: star.twinkleDuration,
      delay: star.twinkleDelay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
))
StarDotComponent.displayName = 'StarDot'

const BackgroundScene = memo(({ gradient }: BackgroundSceneProps) => {
  // Memoize star field — never changes at runtime
  const allStars = useMemo(() => [...BG_STARS, ...ACCENT_STARS], [])

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
      style={{ background: gradient }}
    >
      {/* Subtle radial vignette to darken corners */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* Twinkling star dots */}
      {allStars.map(star => (
        <StarDotComponent key={star.id} star={star} />
      ))}

      {/* Faint nebula glow — adds depth without competing with items */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '60vw',
          height: '40vh',
          left: '20%',
          top: '30%',
          background:
            'radial-gradient(ellipse, rgba(100,120,200,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
})
BackgroundScene.displayName = 'BackgroundScene'

export default BackgroundScene
