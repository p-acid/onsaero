/**
 * Background Service Worker for Chrome Extension
 * Handles extension lifecycle, alarms, and background sync
 *
 * Note: Manifest V3 service workers are ephemeral and can be terminated at any time
 * Use chrome.storage for persistent state, not global variables
 */

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed')

    // Set default preferences on first install
    chrome.storage.sync.set({
      preferences: {
        show_completed_by_default: false,
        theme: 'auto',
        default_view: 'list',
        updated_at: new Date().toISOString()
      }
    })

    // Open new tab to show the extension
    chrome.tabs.create({ url: 'chrome://newtab' })
  } else if (details.reason === 'update') {
    console.log('Extension updated to version', chrome.runtime.getManifest().version)
  }
})

// Setup periodic sync alarm (every 15 minutes)
chrome.alarms.create('sync-tasks', {
  periodInMinutes: 15
})

// Handle alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync-tasks') {
    // Trigger background sync
    syncTasksWithSupabase().catch(console.error)
  } else if (alarm.name === 'cleanup-storage') {
    // Cleanup old completed tasks from local storage
    cleanupOldTasks().catch(console.error)
  }
})

// Background sync function
async function syncTasksWithSupabase() {
  try {
    // Get current storage data
    const data = await chrome.storage.sync.get(['tasks', 'last_sync'])

    // Only sync if we have tasks and haven't synced recently (< 5 min ago)
    const lastSync = data.last_sync ? new Date(data.last_sync) : new Date(0)
    const now = new Date()
    const timeSinceLastSync = now.getTime() - lastSync.getTime()

    if (timeSinceLastSync < 5 * 60 * 1000) {
      console.log('Skipping sync - too recent')
      return
    }

    console.log('Background sync triggered')

    // Note: Actual Supabase sync happens in the app context
    // Service worker just triggers the sync via message to active tabs
    chrome.tabs.query({ active: true }, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_SYNC' })
        }
      })
    })
  } catch (error) {
    console.error('Background sync error:', error)
  }
}

// Cleanup old completed tasks from chrome.storage.sync
async function cleanupOldTasks() {
  try {
    const { tasks } = await chrome.storage.sync.get('tasks')

    if (!tasks || tasks.length === 0) return

    // Keep only:
    // - All active tasks
    // - Completed tasks from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const filteredTasks = tasks.filter((task: any) => {
      if (!task.completed) return true // Keep all active tasks

      const completedDate = task.completed_at ? new Date(task.completed_at) : new Date(0)
      return completedDate > thirtyDaysAgo // Keep recent completed tasks
    })

    if (filteredTasks.length < tasks.length) {
      await chrome.storage.sync.set({ tasks: filteredTasks })
      console.log(`Cleaned up ${tasks.length - filteredTasks.length} old completed tasks`)
    }
  } catch (error) {
    console.error('Cleanup error:', error)
  }
}

// Setup cleanup alarm (once per day)
chrome.alarms.create('cleanup-storage', {
  periodInMinutes: 24 * 60 // Once per day
})

// Monitor storage quota
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.tasks) {
    checkStorageQuota().catch(console.error)
  }
})

async function checkStorageQuota() {
  try {
    const bytesInUse = await chrome.storage.sync.getBytesInUse()
    const limit = chrome.storage.sync.QUOTA_BYTES // 102400 bytes (100KB)
    const usage = (bytesInUse / limit) * 100

    if (usage > 80) {
      console.warn(`Storage usage at ${usage.toFixed(1)}%`)

      // Notify user if approaching limit
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon48.png',
        title: 'Storage Nearly Full',
        message: `Your task storage is ${usage.toFixed(0)}% full. Consider archiving old completed tasks.`,
        priority: 1
      })

      // Trigger cleanup
      await cleanupOldTasks()
    }
  } catch (error) {
    console.error('Storage quota check error:', error)
  }
}

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CHECK_STORAGE_QUOTA') {
    checkStorageQuota().then(() => sendResponse({ success: true }))
    return true // Keep message channel open for async response
  }

  if (message.type === 'TRIGGER_CLEANUP') {
    cleanupOldTasks().then(() => sendResponse({ success: true }))
    return true
  }

  if (message.type === 'SYNC_NOW') {
    syncTasksWithSupabase().then(() => sendResponse({ success: true }))
    return true
  }
})

// Handle extension context invalidation (for development)
chrome.runtime.onSuspend.addListener(() => {
  console.log('Service worker suspending...')
})

console.log('Service worker initialized')
