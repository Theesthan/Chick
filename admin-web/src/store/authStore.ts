import { create } from 'zustand'
import type { User } from '../types'
import { login as apiLogin, getMe } from '../api'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hydrate: () => Promise<void>
}

function restoreUser(): User | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  // Restore both token AND user synchronously so pages render correctly
  // without waiting for the async hydrate() network call to complete.
  user: restoreUser(),
  token: localStorage.getItem('token'),
  loading: false,

  login: async (email, password) => {
    set({ loading: true })
    const { access_token } = await apiLogin(email, password)
    localStorage.setItem('token', access_token)
    const user = await getMe()
    localStorage.setItem('user', JSON.stringify(user))
    set({ token: access_token, user, loading: false })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },

  hydrate: async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      // Re-validate token with server and refresh user data
      const user = await getMe()
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, token })
    } catch {
      // Token invalid or expired — clear everything
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({ token: null, user: null })
    }
  },
}))
