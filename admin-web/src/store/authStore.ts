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
    // Snapshot the token at the moment hydrate starts.
    // If login() completes and replaces it with a fresh token while this
    // async function is in-flight, we must NOT overwrite or clear the new token.
    const snapshotToken = localStorage.getItem('token')
    if (!snapshotToken) return
    try {
      const user = await getMe()
      localStorage.setItem('user', JSON.stringify(user))
      // Only apply if the token hasn't been replaced by a fresh login since we started
      set((state) =>
        state.token === snapshotToken ? { user, token: snapshotToken } : state,
      )
    } catch {
      // Token is invalid/expired — but only clear if a fresh login hasn't already
      // replaced it with a valid token during this async window.
      set((state) => {
        if (state.token !== snapshotToken) return state
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        return { token: null, user: null }
      })
    }
  },
}))
