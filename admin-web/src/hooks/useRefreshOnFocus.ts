import { useEffect, useRef } from 'react'

/**
 * Re-runs `refresh` whenever the browser tab becomes visible again.
 * Uses a ref so the latest `refresh` callback is always called, even if the
 * function reference changes between renders (no need for useCallback).
 */
export function useRefreshOnFocus(refresh: () => void) {
  const ref = useRef(refresh)
  ref.current = refresh

  useEffect(() => {
    const handler = () => {
      if (!document.hidden) ref.current()
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])
}
