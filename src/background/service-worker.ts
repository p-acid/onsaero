/**
 * Background Service Worker for Chrome Extension
 * Handles extension lifecycle, alarms, background sync, and OAuth authentication
 *
 * Note: Manifest V3 service workers are ephemeral and can be terminated at any time
 * Use chrome.storage for persistent state, not global variables
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/database.types'
import type { Task } from '../lib/types'

// Initialize Supabase client for background script
const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: undefined, // No localStorage in service worker
      autoRefreshToken: true,
      persistSession: false, // We handle persistence manually
      detectSessionInUrl: false,
    },
  },
)

// Get redirect URL for OAuth
const REDIRECT_URL = chrome.identity.getRedirectURL()

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safely send a message to runtime listeners
 * Catches "Receiving end does not exist" errors when no listeners are present
 */
function safeSendMessage(message: unknown): void {
  try {
    chrome.runtime.sendMessage(message, () => {
      // Check for runtime errors (e.g., no listeners)
      if (chrome.runtime.lastError) {
        // This is expected when no tabs/popup are listening
        console.debug(
          '[Message] No listeners for message:',
          message,
          '- Error:',
          chrome.runtime.lastError.message,
        )
      }
    })
  } catch (error) {
    // Handle synchronous errors
    console.debug(
      '[Message] Failed to send message:',
      message,
      '- Error:',
      error,
    )
  }
}

// ============================================================================
// OAuth Authentication Handlers
// ============================================================================

/**
 * Listen for OAuth callback in tab URLs
 * Extracts tokens and establishes session
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  // Only process URL changes
  if (!changeInfo.url) return

  // Check if URL matches OAuth redirect
  if (
    !changeInfo.url.startsWith(REDIRECT_URL) &&
    !changeInfo.url.includes('#access_token=')
  ) {
    return
  }

  try {
    console.log('[Auth] OAuth callback detected at', new Date().toISOString())

    // Parse URL to extract tokens
    const url = new URL(changeInfo.url)
    const hashParams = new URLSearchParams(url.hash.replace('#', ''))

    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (!accessToken || !refreshToken) {
      console.error(
        '[Auth] Missing tokens in callback URL at',
        new Date().toISOString(),
      )
      return
    }

    console.log(
      '[Auth] Tokens extracted successfully, setting session at',
      new Date().toISOString(),
    )

    // Set session in Supabase
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (error) {
      console.error(
        '[Auth] Failed to set session at',
        new Date().toISOString(),
        '- Error:',
        error.message,
      )

      safeSendMessage({
        type: 'AUTH_ERROR',
        error: error.message,
      })
      return
    }

    if (data.session && data.user) {
      // Store session in chrome.storage.local
      // Note: chrome.storage works in both normal and incognito contexts
      await chrome.storage.local.set({
        supabaseSession: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          user: {
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata,
          },
        },
      })

      // Notify popup/tabs about successful authentication
      safeSendMessage({
        type: 'AUTH_SUCCESS',
        user: data.user,
        session: data.session,
      })

      console.log(
        '[Auth] Sign-in successful at',
        new Date().toISOString(),
        '- User:',
        data.user.email,
      )

      // Close the OAuth tab
      if (chrome.tabs?.remove) {
        chrome.tabs.remove(tabId)
      }
    }
  } catch (error) {
    console.error(
      '[Auth] OAuth callback error at',
      new Date().toISOString(),
      ':',
      error,
    )
    safeSendMessage({
      type: 'AUTH_ERROR',
      error: error instanceof Error ? error.message : 'Authentication failed',
    })
  }
})

/**
 * Restore session on service worker startup
 */
chrome.runtime.onStartup.addListener(async () => {
  try {
    console.log('[Auth] Extension startup at', new Date().toISOString())
    const { supabaseSession } =
      await chrome.storage.local.get('supabaseSession')

    if (supabaseSession) {
      console.log(
        '[Auth] Found stored session, attempting restore at',
        new Date().toISOString(),
      )

      const { data, error } = await supabase.auth.setSession({
        access_token: supabaseSession.access_token,
        refresh_token: supabaseSession.refresh_token,
      })

      if (error) {
        console.error(
          '[Auth] Failed to restore session at',
          new Date().toISOString(),
          '- Error:',
          error.message,
        )
        // Clear invalid session
        await chrome.storage.local.remove('supabaseSession')
        return
      }

      if (data.session) {
        console.log(
          '[Auth] Session restored successfully at',
          new Date().toISOString(),
          '- User:',
          data.session.user.email,
        )
      }
    } else {
      console.log('[Auth] No stored session found at', new Date().toISOString())
    }
  } catch (error) {
    console.error(
      '[Auth] Session restore error at',
      new Date().toISOString(),
      ':',
      error,
    )
  }
})

/**
 * Listen for auth state changes from Supabase
 */
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log(
    '[Auth] State change at',
    new Date().toISOString(),
    '- Event:',
    event,
  )

  switch (event) {
    case 'SIGNED_IN':
      console.log(
        '[Auth] User signed in at',
        new Date().toISOString(),
        '- User:',
        session?.user.email,
      )
      if (session) {
        // Update stored session
        await chrome.storage.local.set({
          supabaseSession: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            user: {
              id: session.user.id,
              email: session.user.email,
              user_metadata: session.user.user_metadata,
            },
          },
        })

        // Notify tabs
        safeSendMessage({
          type: 'AUTH_STATE_CHANGE',
          event,
          session,
        })
      }
      break

    case 'TOKEN_REFRESHED':
      console.log(
        '[Auth] Token refreshed at',
        new Date().toISOString(),
        '- User:',
        session?.user.email,
      )
      if (session) {
        // Update stored session
        await chrome.storage.local.set({
          supabaseSession: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            user: {
              id: session.user.id,
              email: session.user.email,
              user_metadata: session.user.user_metadata,
            },
          },
        })

        // Notify tabs
        safeSendMessage({
          type: 'AUTH_STATE_CHANGE',
          event,
          session,
        })
      }
      break

    case 'SIGNED_OUT':
      console.log('[Auth] User signed out at', new Date().toISOString())
      // Clear stored session
      await chrome.storage.local.remove('supabaseSession')

      // Notify tabs
      safeSendMessage({
        type: 'AUTH_STATE_CHANGE',
        event,
        session: null,
      })
      break
  }
})

// ============================================================================
// Extension Lifecycle Handlers
// ============================================================================

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
        updated_at: new Date().toISOString(),
      },
    })

    // Open new tab to show the extension
    // Check if chrome.tabs is available (defensive programming for dev mode)
    if (chrome.tabs?.create) {
      chrome.tabs.create({ url: 'chrome://newtab' })
    } else {
      console.warn('[Extension] chrome.tabs.create not available yet')
    }
  } else if (details.reason === 'update') {
    console.log(
      'Extension updated to version',
      chrome.runtime.getManifest().version,
    )
  }
})

// Setup periodic sync alarm (every 15 minutes)
chrome.alarms.create('sync-tasks', {
  periodInMinutes: 15,
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
    if (chrome.tabs?.query) {
      chrome.tabs.query({ active: true }, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id && chrome.tabs?.sendMessage) {
            chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_SYNC' })
          }
        })
      })
    }
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

    const filteredTasks = tasks.filter((task: Task) => {
      if (!task.completed) return true // Keep all active tasks

      const completedDate = task.completed_at
        ? new Date(task.completed_at)
        : new Date(0)
      return completedDate > thirtyDaysAgo // Keep recent completed tasks
    })

    if (filteredTasks.length < tasks.length) {
      await chrome.storage.sync.set({ tasks: filteredTasks })
      console.log(
        `Cleaned up ${tasks.length - filteredTasks.length} old completed tasks`,
      )
    }
  } catch (error) {
    console.error('Cleanup error:', error)
  }
}

// Setup cleanup alarm (once per day)
chrome.alarms.create('cleanup-storage', {
  periodInMinutes: 24 * 60, // Once per day
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
      if (chrome.notifications?.create) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '/icons/icon48.png',
          title: 'Storage Nearly Full',
          message: `Your task storage is ${usage.toFixed(0)}% full. Consider archiving old completed tasks.`,
          priority: 1,
        })
      }

      // Trigger cleanup
      await cleanupOldTasks()
    }
  } catch (error) {
    console.error('Storage quota check error:', error)
  }
}

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Auth: Get current session
  if (message.type === 'GET_SESSION') {
    chrome.storage.local.get('supabaseSession').then(({ supabaseSession }) => {
      sendResponse({ session: supabaseSession || null })
    })
    return true
  }

  // Storage: Check quota
  if (message.type === 'CHECK_STORAGE_QUOTA') {
    checkStorageQuota().then(() => sendResponse({ success: true }))
    return true // Keep message channel open for async response
  }

  // Storage: Trigger cleanup
  if (message.type === 'TRIGGER_CLEANUP') {
    cleanupOldTasks().then(() => sendResponse({ success: true }))
    return true
  }

  // Sync: Sync now
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
