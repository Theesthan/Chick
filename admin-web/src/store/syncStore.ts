import { create } from 'zustand'

interface SyncState {
  /** Increments every time a manual refresh is requested from the sidebar button. */
  seq: number
  lastSyncAt: Date
  requestSync: () => void
  markSynced: () => void
}

export const useSyncStore = create<SyncState>((set) => ({
  seq: 0,
  lastSyncAt: new Date(),
  requestSync: () => set((s) => ({ seq: s.seq + 1 })),
  markSynced: () => set({ lastSyncAt: new Date() }),
}))
