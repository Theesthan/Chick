import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const requestUrl: string = err.config?.url ?? ''

      // Do NOT redirect when:
      //  1. The failing request IS the login endpoint — wrong credentials should be
      //     handled by the catch block in LoginPage, not a hard page reload.
      //  2. We are already on /login — nothing to redirect to, and doing so would
      //     interrupt a login attempt that's currently in-flight.
      const isLoginEndpoint = requestUrl.includes('/auth/login')
      const alreadyOnLogin = window.location.pathname === '/login'

      if (!isLoginEndpoint && !alreadyOnLogin) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  },
)
