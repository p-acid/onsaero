import type { ChromeStorageData, Task, UserPreferences } from './types'

// Storage keys
const STORAGE_KEYS = {
  TASKS: 'tasks',
  LAST_SYNC: 'last_sync',
  USER_ID: 'user_id',
  PREFERENCES: 'preferences',
} as const

// Chrome storage quota constants
const QUOTA_BYTES = 102400 // 100KB
const QUOTA_WARNING_THRESHOLD = 0.8 // 80%

/**
 * Get data from chrome.storage.sync
 */
export const getFromStorage = async <T>(key: string): Promise<T | null> => {
  if (!chrome?.storage?.sync) {
    console.warn('Chrome storage API not available')
    return null
  }

  try {
    const result = await chrome.storage.sync.get(key)
    return result[key] ?? null
  } catch (error) {
    console.error(`Error reading from storage (${key}):`, error)
    return null
  }
}

/**
 * Set data in chrome.storage.sync
 */
export const setInStorage = async <T>(
  key: string,
  value: T,
): Promise<boolean> => {
  if (!chrome?.storage?.sync) {
    console.warn('Chrome storage API not available')
    return false
  }

  try {
    await chrome.storage.sync.set({ [key]: value })
    return true
  } catch (error) {
    console.error(`Error writing to storage (${key}):`, error)
    return false
  }
}

/**
 * Remove data from chrome.storage.sync
 */
export const removeFromStorage = async (key: string): Promise<boolean> => {
  if (!chrome?.storage?.sync) {
    console.warn('Chrome storage API not available')
    return false
  }

  try {
    await chrome.storage.sync.remove(key)
    return true
  } catch (error) {
    console.error(`Error removing from storage (${key}):`, error)
    return false
  }
}

/**
 * Clear all data from chrome.storage.sync
 */
export const clearStorage = async (): Promise<boolean> => {
  if (!chrome?.storage?.sync) {
    console.warn('Chrome storage API not available')
    return false
  }

  try {
    await chrome.storage.sync.clear()
    return true
  } catch (error) {
    console.error('Error clearing storage:', error)
    return false
  }
}

/**
 * Get storage quota usage
 */
export const getStorageUsage = async (): Promise<{
  bytes: number
  limit: number
  usage: number
  isNearLimit: boolean
}> => {
  if (!chrome?.storage?.sync) {
    return { bytes: 0, limit: QUOTA_BYTES, usage: 0, isNearLimit: false }
  }

  try {
    const bytes = await chrome.storage.sync.getBytesInUse()
    const usage = bytes / QUOTA_BYTES
    const isNearLimit = usage >= QUOTA_WARNING_THRESHOLD

    return {
      bytes,
      limit: QUOTA_BYTES,
      usage,
      isNearLimit,
    }
  } catch (error) {
    console.error('Error checking storage usage:', error)
    return { bytes: 0, limit: QUOTA_BYTES, usage: 0, isNearLimit: false }
  }
}

/**
 * Get all tasks from storage
 */
export const getTasks = async (): Promise<Task[]> => {
  const tasks = await getFromStorage<Task[]>(STORAGE_KEYS.TASKS)
  return tasks ?? []
}

/**
 * Set tasks in storage
 */
export const setTasks = async (tasks: Task[]): Promise<boolean> => {
  return setInStorage(STORAGE_KEYS.TASKS, tasks)
}

/**
 * Get user preferences from storage
 */
export const getPreferences = async (): Promise<UserPreferences | null> => {
  return getFromStorage<UserPreferences>(STORAGE_KEYS.PREFERENCES)
}

/**
 * Set user preferences in storage
 */
export const setPreferences = async (
  preferences: UserPreferences,
): Promise<boolean> => {
  return setInStorage(STORAGE_KEYS.PREFERENCES, preferences)
}

/**
 * Get last sync timestamp
 */
export const getLastSync = async (): Promise<string | null> => {
  return getFromStorage<string>(STORAGE_KEYS.LAST_SYNC)
}

/**
 * Set last sync timestamp
 */
export const setLastSync = async (timestamp: string): Promise<boolean> => {
  return setInStorage(STORAGE_KEYS.LAST_SYNC, timestamp)
}

/**
 * Get current user ID from storage
 */
export const getUserId = async (): Promise<string | null> => {
  return getFromStorage<string>(STORAGE_KEYS.USER_ID)
}

/**
 * Set current user ID in storage
 */
export const setUserId = async (userId: string): Promise<boolean> => {
  return setInStorage(STORAGE_KEYS.USER_ID, userId)
}

/**
 * Sync all storage data (tasks + preferences + metadata)
 */
export const syncStorageData = async (
  data: Partial<ChromeStorageData>,
): Promise<boolean> => {
  if (!chrome?.storage?.sync) {
    console.warn('Chrome storage API not available')
    return false
  }

  try {
    const updates: Record<string, unknown> = {}

    if (data.tasks !== undefined) {
      updates[STORAGE_KEYS.TASKS] = data.tasks
    }

    if (data.last_sync !== undefined) {
      updates[STORAGE_KEYS.LAST_SYNC] = data.last_sync
    }

    if (data.user_id !== undefined) {
      updates[STORAGE_KEYS.USER_ID] = data.user_id
    }

    await chrome.storage.sync.set(updates)
    return true
  } catch (error) {
    console.error('Error syncing storage data:', error)
    return false
  }
}

/**
 * Sync tasks to storage (used by TanStack Query hooks)
 */
export const syncTasksToStorage = async (tasks: Task[]): Promise<boolean> => {
  const success = await setTasks(tasks)
  if (success) {
    await setLastSync(new Date().toISOString())
  }
  return success
}

/**
 * Cleanup old completed tasks to free up storage
 * Removes completed tasks older than the specified number of days
 */
export const cleanupOldTasks = async (daysToKeep = 30): Promise<number> => {
  const tasks = await getTasks()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const filteredTasks = tasks.filter((task) => {
    if (!task.completed) return true // Keep all active tasks
    if (!task.completed_at) return true // Keep if no completion date

    const completedDate = new Date(task.completed_at)
    return completedDate >= cutoffDate // Keep if within retention period
  })

  const removedCount = tasks.length - filteredTasks.length

  if (removedCount > 0) {
    await setTasks(filteredTasks)
  }

  return removedCount
}

/**
 * Storage change listener callback type
 */
export type StorageChangeCallback = (
  changes: chrome.storage.StorageChange,
  key: string,
) => void

/**
 * Setup chrome.storage.onChanged listener for cross-tab sync
 * Returns a cleanup function to remove the listener
 */
export const setupStorageListener = (
  callback: StorageChangeCallback,
): (() => void) => {
  if (!chrome?.storage?.onChanged) {
    console.warn('Chrome storage API not available')
    return () => {}
  }

  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ) => {
    // Only respond to sync storage changes
    if (areaName !== 'sync') return

    // Call callback for each changed key
    Object.entries(changes).forEach(([key, change]) => {
      callback(change, key)
    })
  }

  chrome.storage.onChanged.addListener(listener)

  // Return cleanup function
  return () => {
    chrome.storage.onChanged.removeListener(listener)
  }
}
