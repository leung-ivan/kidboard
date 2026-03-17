// PurchaseButton — initiates a Stripe Checkout session for a theme or the bundle.
// Checks auth state first: guests see LoginModal before proceeding.
// TODO (P1): call POST /api/payments/create-checkout-session, then redirect.

interface PurchaseButtonProps {
  themeId?: string
  isBundle?: boolean
  label: string
}

export default function PurchaseButton(_props: PurchaseButtonProps) {
  return null
}
