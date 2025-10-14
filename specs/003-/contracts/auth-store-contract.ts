/**
 * Authentication Store Contract
 *
 * This file defines the contract for the Zustand auth store that manages
 * authentication state and cross-tab synchronization.
 *
 * @module contracts/auth-store-contract
 */

import type { Session, User } from '@supabase/supabase-js'

/**
 * Auth change action types for cross-tab communication
 */
export type AuthChangeAction = 'login' | 'logout' | 'refresh' | 'server_revoke'

/**
 * Auth sync message structure for BroadcastChannel/localStorage
 */
export interface AuthSyncMessage {
  type: 'AUTH_STATE_CHANGE'
  sessionId: string | null
  timestamp: number
  action: AuthChangeAction
}

/**
 * Authentication state
 */
export interface AuthState {
  /**
   * Current authenticated user, null if not authenticated
   */
  user: User | null

  /**
   * Current session with tokens and expiry, null if not authenticated
   */
  session: Session | null

  /**
   * Loading state during auth operations (initialize, login, logout)
   */
  loading: boolean

  /**
   * Error state from failed auth operations
   */
  error: Error | null

  /**
   * Computed property: true if user is authenticated
   * Derived from: user !== null
   */
  isAuthenticated: boolean
}

/**
 * Authentication actions
 */
export interface AuthActions {
  /**
   * Initiate Google OAuth sign-in flow
   *
   * @throws {Error} If OAuth initialization fails
   * @returns {Promise<void>}
   *
   * Side effects:
   * - Redirects to Google OAuth consent page
   * - On success: sets user, session, broadcasts 'login' message
   * - On error: sets error state
   */
  signInWithGoogle: () => Promise<void>

  /**
   * Sign out current user
   *
   * @returns {Promise<void>}
   *
   * Side effects:
   * - Broadcasts 'logout' message to other tabs BEFORE clearing state
   * - Clears user and session from store
   * - Revokes session on backend (Supabase)
   * - Redirects to login page
   */
  signOut: () => Promise<void>

  /**
   * Initialize auth state from Supabase session
   * Called on app mount and when receiving auth change messages
   *
   * @returns {Promise<void>}
   *
   * Side effects:
   * - Checks for existing session in HTTP-only cookie
   * - If valid session: sets user and session
   * - If no session: clears user and session
   * - Sets loading state during check
   */
  initialize: () => Promise<void>

  /**
   * Manually set session (used by OAuth callback handler)
   *
   * @param {Session | null} session - Session object or null to clear
   *
   * Side effects:
   * - Updates session state
   * - Broadcasts 'login' or 'logout' message based on session value
   */
  setSession: (session: Session | null) => void

  /**
   * Set error state
   *
   * @param {Error | null} error - Error object or null to clear
   */
  setError: (error: Error | null) => void

  /**
   * Broadcast auth state change to other tabs
   *
   * @param {AuthChangeAction} action - Type of auth change
   *
   * Implementation:
   * - Uses BroadcastChannel if available (preferred)
   * - Falls back to localStorage event for Safari < 15.4
   * - Message includes timestamp for replay protection
   */
  broadcastAuthChange: (action: AuthChangeAction) => void

  /**
   * Subscribe to auth changes from other tabs
   *
   * @param {Function} callback - Called when auth change message received
   * @returns {Function} Unsubscribe function
   *
   * Behavior:
   * - Validates message timestamp (must be < 10 seconds old)
   * - Calls callback with validated message
   * - Callback typically calls initialize() to re-sync state
   */
  subscribeToAuthChanges: (callback: (message: AuthSyncMessage) => void) => () => void
}

/**
 * Complete auth store type combining state and actions
 */
export type AuthStore = AuthState & AuthActions

/**
 * Expected store behavior
 */
export const AuthStoreContract = {
  /**
   * Initial state when store is created
   */
  initialState: {
    user: null,
    session: null,
    loading: true, // true initially until initialize() completes
    error: null,
    isAuthenticated: false,
  },

  /**
   * State transitions
   */
  transitions: {
    'signInWithGoogle()': {
      from: { loading: false, user: null },
      to: { loading: true },
      onSuccess: { loading: false, user: 'User object', session: 'Session object', isAuthenticated: true },
      onError: { loading: false, error: 'Error object' },
    },
    'signOut()': {
      from: { loading: false, user: 'User object' },
      to: { loading: true },
      onSuccess: { loading: false, user: null, session: null, isAuthenticated: false },
      onError: { loading: false, error: 'Error object' },
    },
    'initialize()': {
      from: { loading: true },
      to: { loading: true },
      onSuccess: [
        { loading: false, user: 'User object', session: 'Session object', isAuthenticated: true }, // has session
        { loading: false, user: null, session: null, isAuthenticated: false }, // no session
      ],
      onError: { loading: false, error: 'Error object' },
    },
  },

  /**
   * Cross-tab sync requirements
   */
  crossTabSync: {
    mechanism: 'BroadcastChannel or localStorage fallback',
    latency: '<5 seconds',
    messageValidation: [
      'type === "AUTH_STATE_CHANGE"',
      'timestamp within 10 seconds of Date.now()',
      'action in ["login", "logout", "refresh", "server_revoke"]',
      'sessionId is string | null',
    ],
    retryPolicy: 'No retry - messages are fire-and-forget',
  },

  /**
   * Error handling
   */
  errorStates: {
    'OAuth initialization fails': 'Set error, display in UI',
    'Network error during sign out': 'Set error, but still clear local state',
    'Session invalid on initialize': 'Clear user/session, no error (expected state)',
    'Supabase service unavailable': 'Set error, fail closed (redirect to login)',
  },
}

/**
 * Usage example
 *
 * ```typescript
 * import { create } from 'zustand'
 * import type { AuthStore } from './contracts/auth-store-contract'
 *
 * export const useAuthStore = create<AuthStore>((set, get) => ({
 *   // State
 *   user: null,
 *   session: null,
 *   loading: true,
 *   error: null,
 *   isAuthenticated: false,
 *
 *   // Actions
 *   signInWithGoogle: async () => {
 *     // Implementation
 *   },
 *   // ... other actions
 * }))
 * ```
 */
