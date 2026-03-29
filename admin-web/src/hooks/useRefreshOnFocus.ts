import { useEffect, useRef } from 'react'
import { useSyncStore } from '../store/syncStore'

const POLL_INTERVAL_MS = 30_000

/**
 * Keeps page data fresh across all users by:
 *  1. Re-fetching when the browser tab becomes visible (tab switch).
 *  2. Polling every 30 seconds while the tab is visible.
 *  3. Responding to the global "Refresh All" button in the sidebar.
 *
 * Uses a ref so the latest `refresh` callback is always called without
 * needing useCallback at the call site.
 */
export function useRefreshOnFocus(refresh: () => void) {
  const ref = useRef(refresh)
  ref.current = refresh

  const seq = useSyncStore((s) => s.seq)
  const markSynced = useSyncStore((s) => s.markSynced)
  const prevSeq = useRef(seq)

  // Manual "Refresh All" from the sidebar — only fires when seq increments.
  useEffect(() => {
    if (seq === prevSeq.current) return
    prevSeq.current = seq
    ref.current()
    markSynced()
  }, [seq, markSynced])

  // Tab-focus refresh + 30-second polling.
  useEffect(() => {
    const doRefresh = () => {
      if (!document.hidden) {
        ref.current()
        markSynced()
      }
    }

    document.addEventListener('visibilitychange', doRefresh)
    const timer = setInterval(doRefresh, POLL_INTERVAL_MS)

    return () => {
      document.removeEventListener('visibilitychange', doRefresh)
      clearInterval(timer)
    }
  }, [markSynced])
}
