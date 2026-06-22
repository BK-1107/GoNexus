import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  username: string | null
  setAuth: (token: string, username: string) => void
  logout: () => void
  isAuthenticated: () => boolean
}

function hasUsableToken(token: string | null) {
  if (!token) return false

  try {
    const encodedPayload = token.split('.')[1]
    const payload = JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp !== 'number' || payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      username: null,
      setAuth: (token, username) => set({ token, username }),
      logout: () => set({ token: null, username: null }),
      isAuthenticated: () => hasUsableToken(get().token),
    }),
    {
      name: 'gonexus-auth',
    }
  )
)
