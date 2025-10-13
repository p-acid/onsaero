import { create } from 'zustand'
import { supabase } from '../api/supabase'
import type { AuthMessage, AuthState } from '../lib/types'

/**
 * Authentication store using Zustand
 * Manages user authentication state and OAuth flow
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,
  errorType: undefined,

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
   * Clears session from Supabase and Chrome storage
   */
  signOut: async () => {
    try {
      set({ loading: true, error: null })

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
