// AuthProvider — guest mode only for now.
// Will wrap app with auth context once OAuth (Apple/Google) is implemented (P1).
import React, { createContext, useContext } from 'react'

interface AuthContextValue {
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue>({ isAuthenticated: false })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // TODO (P1): initialise Apple/Google OAuth SDKs, verify session token on mount,
  // restore user profile from API, fall back to guest mode on failure.
  return (
    <AuthContext.Provider value={{ isAuthenticated: false }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
