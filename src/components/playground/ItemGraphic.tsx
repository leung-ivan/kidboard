// ItemGraphic — renders the visual content inside a PlaygroundItem circle.
//
// Strategy per theme:
//   alphabet  → bold letter SVG text (A–Z)
//   numbers   → bold digit SVG text (0–9)
//   stars     → unique SVG shape per item ID (star, moon, planet, …)
//
// All graphics are pure SVG so they scale perfectly at every size
// (baby 110px / toddler 84px / preschool 68px).
// Color: white base tinted with glowColor when active.

import { memo } from 'react'

export interface ItemGraphicProps {
  themeId:   string
  itemId:    string
  label:     string      // display name / letter / digit
  size:      number      // circle diameter in px
  glowColor: string | null
}

const ItemGraphic = memo(({ themeId, itemId, label, size, glowColor }: ItemGraphicProps) => {
  if (themeId === 'alphabet') {
    return <LetterGraphic letter={label} size={size} glowColor={glowColor} />
  }
  if (themeId === 'numbers') {
    return <DigitGraphic digit={label} size={size} glowColor={glowColor} />
  }
  if (themeId === 'stars') {
    return <StarsItemGraphic itemId={itemId} size={size} glowColor={glowColor} />
  }
  // Fallback: first character of label as text
  return <LetterGraphic letter={label.charAt(0)} size={size} glowColor={glowColor} />
})

ItemGraphic.displayName = 'ItemGraphic'
export default ItemGraphic

// ---------------------------------------------------------------------------
// LetterGraphic — for A–Z (Alphabet theme)
// ---------------------------------------------------------------------------

function LetterGraphic({
  letter,
  size,
  glowColor,
}: {
  letter:    string
  size:      number
  glowColor: string | null
}) {
  const fill    = glowColor ?? '#FFFFFF'
  const opacity = glowColor ? 0.92 : 0.80

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label={letter}
    >
      <text
        x="50"
        y="50"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="58"
        fontWeight="800"
        fontFamily="'Nunito', 'Fredoka One', ui-rounded, system-ui, sans-serif"
        fill={fill}
        opacity={opacity}
      >
        {letter}
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// DigitGraphic — for 0–9 (Numbers theme)
// ---------------------------------------------------------------------------

function DigitGraphic({
  digit,
  size,
  glowColor,
}: {
  digit:     string
  size:      number
  glowColor: string | null
}) {
  const fill    = glowColor ?? '#FFFFFF'
  const opacity = glowColor ? 0.95 : 0.82

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label={digit}
    >
      {/* Subtle background ring for numbers */}
      <circle
        cx="50" cy="50" r="38"
        fill="none"
        stroke={fill}
        strokeWidth="2.5"
        opacity={0.18}
      />
      <text
        x="50"
        y="50"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="56"
        fontWeight="900"
        fontFamily="'Nunito', ui-rounded, system-ui, sans-serif"
        fill={fill}
        opacity={opacity}
      >
        {digit}
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// StarsItemGraphic — unique shape per Stars theme item ID
// ---------------------------------------------------------------------------

function StarsItemGraphic({
  itemId,
  size,
  glowColor,
}: {
  itemId:    string
  size:      number
  glowColor: string | null
}) {
  const fill    = glowColor ?? '#FFFFFF'
  const opacity = glowColor ? 0.90 : 0.72

  const svgProps = {
    width:    size,
    height:   size,
    viewBox:  '0 0 100 100',
    fill:     'none',
    opacity,
  } as const

  if (itemId === 'star-1') {
    return (
      <svg {...svgProps}>
        <path
          d="M50 12 L56.5 33 L79 33 L61 47 L67.5 68 L50 55 L32.5 68 L39 47 L21 33 L43.5 33 Z"
          fill={fill}
        />
      </svg>
    )
  }

  if (itemId === 'moon-1') {
    return (
      <svg {...svgProps}>
        {/* Crescent: full circle minus offset circle */}
        <path
          d="M58 18 A32 32 0 1 0 58 82 A22 22 0 1 1 58 18 Z"
          fill={fill}
        />
      </svg>
    )
  }

  if (itemId === 'planet-1') {
    return (
      <svg {...svgProps}>
        <circle cx="50" cy="50" r="22" fill={fill} />
        {/* Ring */}
        <ellipse cx="50" cy="50" rx="40" ry="11"
          fill="none" stroke={fill} strokeWidth="4.5"
          transform="rotate(-18 50 50)" />
      </svg>
    )
  }

  if (itemId === 'comet-1') {
    return (
      <svg {...svgProps}>
        {/* Head */}
        <circle cx="65" cy="35" r="12" fill={fill} />
        {/* Tail streaks */}
        <line x1="58" y1="42" x2="20" y2="72" stroke={fill} strokeWidth="5" strokeLinecap="round" opacity="0.7" />
        <line x1="53" y1="44" x2="24" y2="80" stroke={fill} strokeWidth="3" strokeLinecap="round" opacity="0.4" />
        <line x1="62" y1="46" x2="16" y2="66" stroke={fill} strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
      </svg>
    )
  }

  if (itemId === 'rocket-1') {
    return (
      <svg {...svgProps}>
        {/* Body */}
        <path d="M50 15 C38 25 34 45 34 60 L50 68 L66 60 C66 45 62 25 50 15 Z" fill={fill} />
        {/* Nose */}
        <ellipse cx="50" cy="18" rx="8" ry="6" fill={fill} opacity="0.8" />
        {/* Fins */}
        <path d="M34 60 L22 74 L34 70 Z" fill={fill} opacity="0.75" />
        <path d="M66 60 L78 74 L66 70 Z" fill={fill} opacity="0.75" />
        {/* Window */}
        <circle cx="50" cy="44" r="7" fill="none" stroke={fill} strokeWidth="3" opacity="0.6" />
        {/* Exhaust */}
        <ellipse cx="50" cy="72" rx="7" ry="10" fill={fill} opacity="0.35" />
      </svg>
    )
  }

  if (itemId === 'sun-1') {
    return (
      <svg {...svgProps}>
        <circle cx="50" cy="50" r="20" fill={fill} />
        {/* 8 rays */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i * 45 * Math.PI) / 180
          const x1 = 50 + Math.cos(angle) * 25
          const y1 = 50 + Math.sin(angle) * 25
          const x2 = 50 + Math.cos(angle) * 38
          const y2 = 50 + Math.sin(angle) * 38
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={fill} strokeWidth="4.5" strokeLinecap="round" />
          )
        })}
      </svg>
    )
  }

  if (itemId === 'shooting-1') {
    return (
      <svg {...svgProps}>
        {/* Star head */}
        <path
          d="M72 22 L75 31 L84 31 L77 37 L80 46 L72 40 L64 46 L67 37 L60 31 L69 31 Z"
          fill={fill}
        />
        {/* Trail */}
        <line x1="65" y1="40" x2="20" y2="78" stroke={fill} strokeWidth="5" strokeLinecap="round" opacity="0.65" />
        <line x1="60" y1="42" x2="23" y2="86" stroke={fill} strokeWidth="3" strokeLinecap="round" opacity="0.38" />
        <line x1="68" y1="44" x2="16" y2="72" stroke={fill} strokeWidth="2" strokeLinecap="round" opacity="0.28" />
      </svg>
    )
  }

  if (itemId === 'sparkle-1') {
    return (
      <svg {...svgProps}>
        {/* 4-point sparkle */}
        <path
          d="M50 14 L54 44 L84 48 L54 52 L50 82 L46 52 L16 48 L46 44 Z"
          fill={fill}
        />
        {/* Small accent sparkles */}
        <path d="M75 20 L77 28 L85 30 L77 32 L75 40 L73 32 L65 30 L73 28 Z"
          fill={fill} opacity="0.55" />
        <path d="M22 62 L24 68 L30 70 L24 72 L22 78 L20 72 L14 70 L20 68 Z"
          fill={fill} opacity="0.45" />
      </svg>
    )
  }

  // Fallback generic star shape
  return (
    <svg {...svgProps}>
      <path
        d="M50 18 L55 38 L76 38 L59 51 L65 71 L50 58 L35 71 L41 51 L24 38 L45 38 Z"
        fill={fill}
      />
    </svg>
  )
}
