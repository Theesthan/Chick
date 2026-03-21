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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
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
      const user = await getMe()
      set({ user, token })
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({ token: null, user: null })
    }
  },
}))
