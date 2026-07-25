import { SyncRecord } from './emsTypes'

const SYNC_QUEUE_KEY = 'ems_sync_queue_v1'

export const emsSyncManager = {
  getQueue(): SyncRecord[] {
    try {
      const raw = localStorage.getItem(SYNC_QUEUE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  },

  enqueue(item: Omit<SyncRecord, 'id' | 'queuedAt' | 'status' | 'retryCount'>): SyncRecord {
    const queue = this.getQueue()
    const record: SyncRecord = {
      ...item,
      id: `SYNC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      queuedAt: new Date().toISOString(),
      status: 'QUEUED',
      retryCount: 0,
    }
    queue.push(record)
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
    return record
  },

  clearQueue(): void {
    localStorage.removeItem(SYNC_QUEUE_KEY)
  },

  async processSyncQueue(): Promise<{ processed: number; failed: number }> {
    const queue = this.getQueue()
    if (queue.length === 0) return { processed: 0, failed: 0 }

    let processed = 0
    let failed = 0
    const remaining: SyncRecord[] = []

    for (const record of queue) {
      try {
        // Simulating sync API call to server
        record.status = 'SYNCING'
        await new Promise((r) => setTimeout(r, 200))
        record.status = 'SYNCED'
        processed++
      } catch (err: any) {
        record.status = 'FAILED'
        record.retryCount++
        record.errorMessage = err?.message || 'Network sync error'
        remaining.push(record)
        failed++
      }
    }

    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining))
    return { processed, failed }
  },
}
