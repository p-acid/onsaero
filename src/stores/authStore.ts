import { create } from 'zustand'
import { supabase } from '../api/supabase'
import type {
  AuthChangeAction,
  AuthMessage,
  AuthState,
  AuthSyncMessage,
} from '../lib/types'

/**
 * BroadcastChannel for cross-tab auth sync
 * Fallback to localStorage for Safari < 15.4
 */
let broadcastChannel: BroadcastChannel | null = null
if ('BroadcastChannel' in window) {
  broadcastChannel = new BroadcastChannel('onsaero_auth_sync')
}

/**
 * Validate auth sync message for security
 * Prevents replay attacks and invalid messages
 */
function validateAuthSyncMessage(message: unknown): message is AuthSyncMessage {
  if (!message || typeof message !== 'object') return false

  const msg = message as Partial<AuthSyncMessage>

  // Type check
  if (msg.type !== 'AUTH_STATE_CHANGE') return false

  // Timestamp check (prevent replay - reject messages older than 10 seconds)
  const now = Date.now()
  if (!msg.timestamp || Math.abs(now - msg.timestamp) > 10000) return false

  // Action check
  const validActions: AuthChangeAction[] = [
    'login',
    'logout',
    'refresh',
    'server_revoke',
  ]
  if (!msg.action || !validActions.includes(msg.action)) return false

  // SessionId check
  if (msg.sessionId !== null && typeof msg.sessionId !== 'string') return false

  return true
}

/**
 * Authentication store using Zustand
 * Manages user authentication state, OAuth flow, and cross-tab sync
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,
  errorType: undefined,

  /**
   * Computed property: true if user is authenticated
   * Derived from: user !== null
   */
  get isAuthenticated() {
    return get().user !== null
  },

  /**
   * Broadcast auth state change to other tabs
   * Uses BroadcastChannel or localStorage fallback
   */
  broadcastAuthChange: (action: AuthChangeAction) => {
    const message: AuthSyncMessage = {
      type: 'AUTH_STATE_CHANGE',
      sessionId: get().session?.user?.id || null,
      timestamp: Date.now(),
      action,
    }

    if (broadcastChannel) {
      // Use BroadcastChannel for modern browsers
      broadcastChannel.postMessage(message)
    } else {
      // localStorage fallback for Safari < 15.4
      const key = `onsaero_auth_sync_${Date.now()}`
      localStorage.setItem(key, JSON.stringify(message))
      // Clean up after 1 second
      setTimeout(() => localStorage.removeItem(key), 1000)
    }
  },

  /**
   * Initiate Google OAuth sign-in flow
   * Opens OAuth consent screen in a new tab
   */
  signInWithGoogle: async () => {
    try {
      set({ loading: true, error: null })

      // Get redirect URL using Chrome Identity API
      const redirectUrl = chrome.identity.getRedirectURL()

      // Initiate OAuth flow with Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        throw error
      }

      // Open OAuth URL in new tab
      if (data?.url) {
        await chrome.tabs.create({ url: data.url })
      }

      set({ loading: false })
    } catch (error) {
      console.error('[Auth] Sign in error:', error)

      // Determine error type
      let errorType: 'cancellation' | 'network' | 'unknown' = 'unknown'
      let errorMessage = 'Sign in failed'

      if (error instanceof Error) {
        errorMessage = error.message

        // Check for cancellation errors
        if (
          errorMessage.includes('popup_closed') ||
          errorMessage.includes('cancelled') ||
          errorMessage.includes('canceled')
        ) {
          errorType = 'cancellation'
          errorMessage = 'Sign-in cancelled'
        }
        // Check for network errors
        else if (
          errorMessage.includes('network') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('connection')
        ) {
          errorType = 'network'
          errorMessage = 'Network error. Check your connection and try again.'
        }
      }

      set({
        error: errorMessage,
        errorType,
        loading: false,
      })
    }
  },

  /**
   * Sign out current user
   * Broadcasts logout BEFORE clearing state for cross-tab sync
   * Clears session from Supabase and Chrome storage
   */
  signOut: async () => {
    try {
      set({ loading: true, error: null })

      // CRITICAL: Broadcast logout BEFORE clearing state
      // This ensures other tabs detect the logout before session is gone
      get().broadcastAuthChange('logout')

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }

      // Clear session from Chrome storage
      await chrome.storage.local.remove('supabaseSession')

      // Clear local state
      set({
        user: null,
        session: null,
        loading: false,
      })
    } catch (error) {
      console.error('[Auth] Sign out error:', error)
      set({
        error: error instanceof Error ? error.message : 'Sign out failed',
        loading: false,
      })
    }
  },

  /**
   * Set session and broadcast login event
   * Used for manual session updates (e.g., OAuth callback)
   */
  setSession: (session) => {
    set({ session, user: session?.user || null })
    if (session) {
      get().broadcastAuthChange('login')
    }
  },

  /**
   * Initialize auth state from stored session
   * Called on app startup to restore authentication
   */
  initialize: async () => {
    try {
      set({ loading: true })

      // Request session from background service worker
      const response = await chrome.runtime.sendMessage({ type: 'GET_SESSION' })

      if (response?.session) {
        // Restore session in Supabase client
        const { data, error } = await supabase.auth.setSession({
          access_token: response.session.access_token,
          refresh_token: response.session.refresh_token,
        })

        if (error) {
          console.error('[Auth] Failed to restore session:', error)
          set({ loading: false })
          return
        }

        // Update state with restored session
        set({
          user: data.user,
          session: data.session,
          loading: false,
        })
      } else {
        // No stored session
        set({ loading: false })
      }
    } catch (error) {
      console.error('[Auth] Initialize error:', error)
      set({ loading: false })
    }
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null, errorType: undefined })
  },
}))

/**
 * Listen for auth state changes from background script
 * Updates store when authentication events occur
 */
chrome.runtime.onMessage.addListener((message: AuthMessage) => {
  const { type, user, session, error } = message

  switch (type) {
    case 'AUTH_SUCCESS':
    case 'AUTH_STATE_CHANGE':
      if (user && session) {
        useAuthStore.setState({
          user,
          session,
          loading: false,
          error: null,
        })
      }
      break

    case 'AUTH_ERROR':
      useAuthStore.setState({
        error: error || 'Authentication error',
        loading: false,
      })
      break
  }
})

/**
 * Setup cross-tab synchronization listener
 * Detects auth changes in other tabs and re-initializes state
 */
if (broadcastChannel) {
  // Use BroadcastChannel for modern browsers
  broadcastChannel.onmessage = (event) => {
    if (validateAuthSyncMessage(event.data)) {
      // Re-initialize auth state when another tab changes auth
      useAuthStore.getState().initialize()
    }
  }
} else {
  // localStorage fallback for Safari < 15.4
  window.addEventListener('storage', (event) => {
    if (!event.key?.startsWith('onsaero_auth_sync_')) return
    if (!event.newValue) return // Ignore delete events

    try {
      const message = JSON.parse(event.newValue)
      if (validateAuthSyncMessage(message)) {
        // Re-initialize auth state when another tab changes auth
        useAuthStore.getState().initialize()
      }
    } catch {
      // Ignore parse errors
    }
  })
}
