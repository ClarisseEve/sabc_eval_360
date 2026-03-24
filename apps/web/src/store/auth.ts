import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/api/auth'

interface AuthState {
  user: AuthUser | null
  token: string | null
  setAuth: (token: string, user: AuthUser) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (token, user) => {
        localStorage.setItem('access_token', token)
        set({ token, user })
      },
      clearAuth: () => {
        localStorage.removeItem('access_token')
        set({ token: null, user: null })
      },
      isAuthenticated: () => !!get().token,
    }),
    { name: 'sabc-auth' },
  ),
)
