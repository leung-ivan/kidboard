// router.tsx — only used for the Stripe success return URL.
// The main app mode transitions (landing → playground → settings) are handled
// entirely in-memory via the Zustand store, not via URL changes.

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import PurchaseSuccess from '@/components/payment/PurchaseSuccess'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/purchase/success',
    element: <PurchaseSuccess />,
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
