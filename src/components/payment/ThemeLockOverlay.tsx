// ThemeLockOverlay — shown on top of locked theme cards in ThemeBrowser.
// Displays a lock icon and price badge (e.g. "$1.99").
// Tapping the overlay triggers PurchaseButton flow.

interface ThemeLockOverlayProps {
  priceInCents: number
  onTap: () => void
}

export default function ThemeLockOverlay(_props: ThemeLockOverlayProps) {
  return null
}
