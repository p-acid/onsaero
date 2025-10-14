/**
 * Cross-Tab Synchronization Contract
 *
 * This file defines the contract for synchronizing authentication state
 * across multiple browser tabs within 5 seconds (FR-009).
 *
 * @module contracts/cross-tab-sync-contract
 */

/**
 * Auth change action types
 */
export type AuthChangeAction = 'login' | 'logout' | 'refresh' | 'server_revoke'

/**
 * Auth sync message structure
 */
export interface AuthSyncMessage {
  type: 'AUTH_STATE_CHANGE'
  sessionId: string | null
  timestamp: number
  action: AuthChangeAction
}

/**
 * Broadcast mechanism interface
 */
export interface BroadcastMechanism {
  /**
   * Send message to other tabs
   */
  send: (message: AuthSyncMessage) => void

  /**
   * Subscribe to messages from other tabs
   * Returns unsubscribe function
   */
  subscribe: (callback: (message: AuthSyncMessage) => void) => () => void

  /**
   * Cleanup resources
   */
  cleanup: () => void
}

/**
 * Feature detection result
 */
export interface BroadcastSupport {
  hasBroadcastChannel: boolean
  hasLocalStorage: boolean
  recommendedMechanism: 'BroadcastChannel' | 'localStorage' | 'none'
}

/**
 * Expected behavior
 */
export const CrossTabSyncContract = {
  /**
   * Performance requirements (from spec)
   */
  performance: {
    maxLatency: '5 seconds',
    targetLatency: {
      BroadcastChannel: '<5ms',
      localStorage: '100-500ms',
    },
    syncTriggers: ['login', 'logout', 'session refresh', 'server-side revocation'],
  },

  /**
   * BroadcastChannel implementation
   */
  BroadcastChannelImpl: {
    channelName: 'onsaero_auth_sync',

    /**
     * Feature detection
     */
    detection: `'BroadcastChannel' in window`,

    /**
     * Initialization
     */
    initialization: `
      const channel = new BroadcastChannel('onsaero_auth_sync')
    `,

    /**
     * Sending messages
     */
    send: `
      channel.postMessage({
        type: 'AUTH_STATE_CHANGE',
        sessionId: session?.user?.id || null,
        timestamp: Date.now(),
        action: 'logout', // or 'login', 'refresh', 'server_revoke'
      })
    `,

    /**
     * Receiving messages
     */
    receive: `
      channel.onmessage = (event) => {
        const message = event.data
        if (validateAuthSyncMessage(message)) {
          callback(message)
        }
      }
    `,

    /**
     * Cleanup
     */
    cleanup: `channel.close()`,

    /**
     * Browser support
     */
    support: 'Chrome 54+, Firefox 38+, Safari 15.4+, Edge 79+',
  },

  /**
   * localStorage fallback implementation
   */
  localStorageFallback: {
    /**
     * Mechanism
     */
    mechanism: 'Write to localStorage, listen for storage event in other tabs',

    /**
     * Storage key pattern
     */
    storageKey: (timestamp: number) => `onsaero_auth_sync_${timestamp}`,

    /**
     * Sending messages
     */
    send: `
      const key = \`onsaero_auth_sync_\${Date.now()}\`
      localStorage.setItem(key, JSON.stringify(message))
      // Clean up old keys
      setTimeout(() => localStorage.removeItem(key), 1000)
    `,

    /**
     * Receiving messages
     */
    receive: `
      window.addEventListener('storage', (event) => {
        if (!event.key?.startsWith('onsaero_auth_sync_')) return
        if (!event.newValue) return // Ignore delete events

        const message = JSON.parse(event.newValue)
        if (validateAuthSyncMessage(message)) {
          callback(message)
        }
      })
    `,

    /**
     * Limitations
     */
    limitations: [
      'storage event does NOT fire in originating tab (only other tabs)',
      'Requires workaround: send message immediately in originating tab via direct callback',
      'Cleanup required: old keys accumulate, prune keys older than 10 seconds',
    ],

    /**
     * Browser support
     */
    support: 'All modern browsers (universal support)',
  },

  /**
   * Message validation
   */
  messageValidation: {
    /**
     * Validation function signature
     */
    signature: '(message: unknown) => message is AuthSyncMessage',

    /**
     * Validation rules
     */
    rules: [
      'message.type === "AUTH_STATE_CHANGE"',
      'message.timestamp is number',
      'Math.abs(Date.now() - message.timestamp) < 10000 // 10 seconds',
      'message.action in ["login", "logout", "refresh", "server_revoke"]',
      'message.sessionId is string | null',
    ],

    /**
     * Implementation example
     */
    implementation: `
      function validateAuthSyncMessage(message: unknown): message is AuthSyncMessage {
        if (!message || typeof message !== 'object') return false

        const msg = message as Partial<AuthSyncMessage>

        // Type check
        if (msg.type !== 'AUTH_STATE_CHANGE') return false

        // Timestamp check (prevent replay attacks)
        const now = Date.now()
        if (!msg.timestamp || Math.abs(now - msg.timestamp) > 10000) return false

        // Action check
        const validActions: AuthChangeAction[] = ['login', 'logout', 'refresh', 'server_revoke']
        if (!msg.action || !validActions.includes(msg.action)) return false

        // SessionId check
        if (msg.sessionId !== null && typeof msg.sessionId !== 'string') return false

        return true
      }
    `,

    /**
     * Security rationale
     */
    security: {
      timestampCheck: 'Prevent replay attacks (reject messages older than 10 seconds)',
      typeCheck: 'Prevent injection of malicious message types',
      actionValidation: 'Whitelist valid actions, reject unknown',
    },
  },

  /**
   * Integration with auth store
   */
  authStoreIntegration: {
    /**
     * When to broadcast
     */
    broadcastOn: [
      'signInWithGoogle() success → broadcast "login"',
      'signOut() called → broadcast "logout" BEFORE clearing state',
      'setSession() with new session → broadcast "refresh"',
      'Session revoked server-side → broadcast "server_revoke"',
    ],

    /**
     * When to listen
     */
    listenOn: 'Store initialization (useEffect in App.tsx or store middleware)',

    /**
     * Message handling
     */
    handleMessage: `
      subscribeToAuthChanges((message) => {
        // Re-initialize auth state from Supabase
        authStore.getState().initialize()

        // Result: Tab will either:
        // 1. Update to new session (if "login" or "refresh")
        // 2. Clear session and redirect (if "logout" or "server_revoke")
      })
    `,

    /**
     * Timing
     */
    timing: {
      broadcast: 'Immediately when action occurs (synchronous)',
      receive: 'Within 5ms (BroadcastChannel) or 100-500ms (localStorage)',
      reInitialize: 'Async, ~50-200ms to check Supabase session',
      totalLatency: '<500ms from broadcast to UI update',
    },
  },

  /**
   * Edge cases
   */
  edgeCases: {
    'Same tab login/logout': {
      issue: 'BroadcastChannel does fire in same tab, localStorage does NOT',
      solution: 'Call initialize() directly in same tab, rely on broadcast for other tabs',
    },

    'Multiple rapid logouts': {
      issue: 'User logs out in 3 tabs within 1 second',
      solution: 'Each tab broadcasts logout, others receive multiple messages, initialize() is idempotent',
    },

    'Tab opened after logout': {
      issue: 'New tab opened after logout message sent',
      solution: 'New tab runs initialize() on mount, no session found, redirects to login',
    },

    'Browser refresh during sync': {
      issue: 'Tab refreshes while receiving sync message',
      solution: 'initialize() runs on mount, fetches current auth state, no sync needed',
    },

    'Network offline': {
      issue: 'BroadcastChannel/localStorage work offline, but initialize() fails',
      solution: 'Fail closed: clear auth state, redirect to login (cannot verify session)',
    },
  },

  /**
   * Testing strategy
   */
  testing: {
    unit: [
      'validateAuthSyncMessage() with valid/invalid messages',
      'BroadcastChannel send/receive (mock BroadcastChannel API)',
      'localStorage send/receive (mock localStorage + storage event)',
    ],

    integration: [
      'Open 2 tabs, logout in tab A, verify tab B redirects within 5 seconds',
      'Open 2 tabs, login in tab A, verify tab B shows authenticated state',
      'Simulate Safari <15.4 (disable BroadcastChannel), verify localStorage fallback',
      'Simulate old message (timestamp 11 seconds ago), verify rejection',
    ],

    e2e: [
      'Real browser test: open 2 actual tabs, perform logout, measure latency',
    ],
  },

  /**
   * Monitoring
   */
  monitoring: {
    metrics: [
      'Cross-tab sync latency (p50, p95, p99)',
      'Message validation failures',
      'BroadcastChannel vs localStorage usage ratio',
    ],
    logging: [
      'Log when broadcasting message',
      'Log when receiving message (with latency)',
      'Log validation failures',
    ],
  },
}

/**
 * Usage example
 *
 * ```typescript
 * // Initialize in authStore.ts
 * let broadcastChannel: BroadcastChannel | null = null
 *
 * if ('BroadcastChannel' in window) {
 *   broadcastChannel = new BroadcastChannel('onsaero_auth_sync')
 *   broadcastChannel.onmessage = (event) => {
 *     const message = event.data
 *     if (validateAuthSyncMessage(message)) {
 *       // Re-initialize auth state
 *       useAuthStore.getState().initialize()
 *     }
 *   }
 * } else {
 *   // localStorage fallback
 *   window.addEventListener('storage', (event) => {
 *     if (!event.key?.startsWith('onsaero_auth_sync_')) return
 *     const message = JSON.parse(event.newValue || '{}')
 *     if (validateAuthSyncMessage(message)) {
 *       useAuthStore.getState().initialize()
 *     }
 *   })
 * }
 *
 * // In signOut()
 * function broadcastAuthChange(action: AuthChangeAction) {
 *   const message: AuthSyncMessage = {
 *     type: 'AUTH_STATE_CHANGE',
 *     sessionId: get().session?.user?.id || null,
 *     timestamp: Date.now(),
 *     action,
 *   }
 *
 *   if (broadcastChannel) {
 *     broadcastChannel.postMessage(message)
 *   } else {
 *     const key = `onsaero_auth_sync_${Date.now()}`
 *     localStorage.setItem(key, JSON.stringify(message))
 *     setTimeout(() => localStorage.removeItem(key), 1000)
 *   }
 * }
 * ```
 */
