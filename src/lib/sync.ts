/**
 * Hybrid Sync Strategy
 * Coordinates synchronization between chrome.storage.sync (local cache) and Supabase (source of truth)
 */

import type { Task } from './types'
import { supabase } from '../api/supabase'
import {
  getTasks,
  setTasks,
  getLastSync,
  setLastSync,
} from './storage'

/**
 * Merge tasks using server-wins conflict resolution
 * Server (Supabase) is the source of truth
 */
export function mergeTasks(
  localTasks: Task[],
  serverTasks: Task[]
): { merged: Task[]; conflicts: number } {
  const merged = new Map<string, Task>()
  let conflicts = 0

  // Add all server tasks (server is source of truth)
  for (const task of serverTasks) {
    merged.set(task.id, task)
  }

  // Merge local tasks (only if newer based on updated_at)
  for (const localTask of localTasks) {
    const serverTask = merged.get(localTask.id)

    if (!serverTask) {
      // Local-only task (not yet synced to server) - keep it
      merged.set(localTask.id, { ...localTask, sync_status: 'pending' })
      continue
    }

    // Compare timestamps to determine which is newer
    const localDate = new Date(localTask.updated_at)
    const serverDate = new Date(serverTask.updated_at)

    if (localDate > serverDate) {
      // Local is newer - mark for sync to server
      merged.set(localTask.id, { ...localTask, sync_status: 'pending' })
      conflicts++
    } else if (localDate < serverDate) {
      // Server is newer - use server version
      merged.set(serverTask.id, { ...serverTask, sync_status: 'synced' })
      if (localDate.getTime() !== serverDate.getTime()) {
        conflicts++
      }
    } else {
      // Same timestamp - server wins (tie-breaker)
      merged.set(serverTask.id, { ...serverTask, sync_status: 'synced' })
    }
  }

  return {
    merged: Array.from(merged.values()).sort(
      (a, b) => a.display_order - b.display_order
    ),
    conflicts,
  }
}

/**
 * Initial sync: Load from local storage, then fetch from server and merge
 */
export async function initialSync(): Promise<{
  tasks: Task[]
  synced: boolean
  error?: string
}> {
  try {
    // 1. Load from chrome.storage.sync (instant UI)
    const localTasks = await getTasks()

    // 2. Check if user is authenticated
    const { data: session } = await supabase.auth.getSession()
    if (!session?.session) {
      console.log('No active session - using local storage only')
      return { tasks: localTasks, synced: false }
    }

    // 3. Fetch from Supabase
    const { data: serverTasks, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase fetch error:', error)
      return { tasks: localTasks, synced: false, error: error.message }
    }

    // 4. Merge tasks (server wins on conflict)
    const { merged, conflicts } = mergeTasks(localTasks, serverTasks || [])

    if (conflicts > 0) {
      console.log(`Resolved ${conflicts} sync conflicts`)
    }

    // 5. Update chrome.storage.sync with merged data
    await setTasks(merged)
    await setLastSync(new Date().toISOString())

    return { tasks: merged, synced: true }
  } catch (error) {
    console.error('Initial sync error:', error)
    const localTasks = await getTasks()
    return {
      tasks: localTasks,
      synced: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Sync pending local changes to Supabase
 */
export async function syncPendingToServer(tasks: Task[]): Promise<{
  success: boolean
  synced: number
  failed: number
}> {
  const pendingTasks = tasks.filter((t) => t.sync_status === 'pending')

  if (pendingTasks.length === 0) {
    return { success: true, synced: 0, failed: 0 }
  }

  let synced = 0
  let failed = 0

  for (const task of pendingTasks) {
    try {
      // Remove sync_status before sending to Supabase (it's not a DB column)
      const { sync_status, ...taskData } = task

      const { error } = await supabase
        .from('tasks')
        .upsert(taskData, { onConflict: 'id' })

      if (error) {
        console.error(`Failed to sync task ${task.id}:`, error)
        failed++
      } else {
        synced++
        // Update local sync status
        task.sync_status = 'synced'
      }
    } catch (error) {
      console.error(`Error syncing task ${task.id}:`, error)
      failed++
    }
  }

  // Update local storage with new sync statuses
  await setTasks(tasks)

  return { success: failed === 0, synced, failed }
}

/**
 * Full bidirectional sync
 * 1. Fetch server tasks
 * 2. Merge with local tasks
 * 3. Push pending local changes to server
 */
export async function fullSync(): Promise<{
  success: boolean
  taskCount: number
  conflicts: number
  error?: string
}> {
  try {
    // Check authentication
    const { data: session } = await supabase.auth.getSession()
    if (!session?.session) {
      return {
        success: false,
        taskCount: 0,
        conflicts: 0,
        error: 'Not authenticated',
      }
    }

    // Get local tasks
    const localTasks = await getTasks()

    // Fetch server tasks
    const { data: serverTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      return {
        success: false,
        taskCount: localTasks.length,
        conflicts: 0,
        error: fetchError.message,
      }
    }

    // Merge tasks
    const { merged, conflicts } = mergeTasks(localTasks, serverTasks || [])

    // Sync pending changes to server
    const syncResult = await syncPendingToServer(merged)

    // Update local storage
    await setTasks(merged)
    await setLastSync(new Date().toISOString())

    return {
      success: syncResult.success,
      taskCount: merged.length,
      conflicts,
    }
  } catch (error) {
    console.error('Full sync error:', error)
    return {
      success: false,
      taskCount: 0,
      conflicts: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if sync is needed
 * Returns true if:
 * - Never synced before
 * - Last sync was more than 5 minutes ago
 * - There are pending tasks
 */
export async function shouldSync(): Promise<boolean> {
  const lastSync = await getLastSync()

  if (!lastSync) {
    return true // Never synced
  }

  const lastSyncDate = new Date(lastSync)
  const now = new Date()
  const minutesSinceSync =
    (now.getTime() - lastSyncDate.getTime()) / (1000 * 60)

  if (minutesSinceSync > 5) {
    return true // More than 5 minutes since last sync
  }

  // Check for pending tasks
  const tasks = await getTasks()
  const hasPending = tasks.some((t) => t.sync_status === 'pending')

  return hasPending
}

/**
 * Setup automatic sync interval
 * Returns cleanup function
 */
export function setupAutoSync(intervalMinutes = 5): () => void {
  const intervalId = setInterval(
    async () => {
      const needsSync = await shouldSync()
      if (needsSync) {
        console.log('Auto-sync triggered')
        const result = await fullSync()
        if (result.success) {
          console.log(
            `Auto-sync complete: ${result.taskCount} tasks, ${result.conflicts} conflicts`
          )
        } else {
          console.error('Auto-sync failed:', result.error)
        }
      }
    },
    intervalMinutes * 60 * 1000
  )

  return () => clearInterval(intervalId)
}
