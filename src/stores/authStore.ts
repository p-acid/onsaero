import { create } from 'zustand'
import { supabase } from '../api/supabase'
import type {
  AuthChangeAction,
  AuthMessage,
  AuthState,
  AuthSyncMessage,
} from '../lib/types'

let broadcastChannel: BroadcastChannel | null = null
if ('BroadcastChannel' in window) {
  broadcastChannel = new BroadcastChannel('onsaero_auth_sync')
}

function validateAuthSyncMessage(message: unknown): message is AuthSyncMessage {
  if (!message || typeof message !== 'object') return false

  const msg = message as Partial<AuthSyncMessage>

  if (msg.type !== 'AUTH_STATE_CHANGE') return false

  const now = Date.now()
  if (!msg.timestamp || Math.abs(now - msg.timestamp) > 10000) return false

  const validActions: AuthChangeAction[] = [
    'login',
    'logout',
    'refresh',
    'server_revoke',
  ]
  if (!msg.action || !validActions.includes(msg.action)) return false

  if (msg.sessionId !== null && typeof msg.sessionId !== 'string') return false

  return true
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,
  errorType: undefined,

  get isAuthenticated() {
    return get().user !== null
  },

  broadcastAuthChange: (action: AuthChangeAction) => {
    const message: AuthSyncMessage = {
      type: 'AUTH_STATE_CHANGE',
      sessionId: get().session?.user?.id || null,
      timestamp: Date.now(),
      action,
    }

    if (broadcastChannel) {
      broadcastChannel.postMessage(message)
    } else {
      const key = `onsaero_auth_sync_${Date.now()}`
      localStorage.setItem(key, JSON.stringify(message))

      setTimeout(() => localStorage.removeItem(key), 1000)
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ loading: true, error: null })

      const redirectUrl = chrome.identity.getRedirectURL()
      console.log('[Auth] Chrome Identity Redirect URL:', redirectUrl)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: true,
        },
      })

      console.log('[Auth] Supabase OAuth response:', { data, error })

      if (error) {
        console.error('[Auth] Supabase OAuth error:', error)
        throw error
      }

      if (!data.url) {
        throw new Error('Failed to get OAuth URL from Supabase')
      }

      console.log('[Auth] OAuth URL:', data.url)
      console.log('[Auth] Expected redirect URL:', redirectUrl)

      chrome.identity.launchWebAuthFlow(
        {
          url: data.url,
          interactive: true,
        },
        async (callbackUrl) => {
          if (chrome.runtime.lastError) {
            const errorMessage = chrome.runtime.lastError.message || ''
            console.error('[Auth] OAuth flow error:', errorMessage)
            console.error('[Auth] Full error object:', chrome.runtime.lastError)

            let errorType: 'cancellation' | 'network' | 'unknown' = 'unknown'
            let displayMessage = 'Sign in failed'

            if (
              errorMessage.includes('canceled') ||
              errorMessage.includes('cancelled') ||
              errorMessage.includes('closed')
            ) {
              errorType = 'cancellation'
              displayMessage = 'Sign-in cancelled'
            } else if (
              errorMessage.includes('network') ||
              errorMessage.includes('could not be loaded')
            ) {
              errorType = 'network'
              displayMessage =
                'Authorization page could not be loaded. Please check Supabase configuration.'
            }

            set({
              error: displayMessage,
              errorType,
              loading: false,
            })
            return
          }

          if (!callbackUrl) {
            console.error('[Auth] No callback URL received')
            set({
              error: 'No callback URL received',
              errorType: 'unknown',
              loading: false,
            })
            return
          }

          try {
            console.log('[Auth] Processing OAuth callback URL:', callbackUrl)

            const url = new URL(callbackUrl)
            console.log('[Auth] Callback URL hash:', url.hash)
            console.log('[Auth] Callback URL search:', url.search)

            const searchParams = new URLSearchParams(url.search)
            const code = searchParams.get('code')

            const hashParams = new URLSearchParams(url.hash.replace('#', ''))
            const accessToken = hashParams.get('access_token')
            const refreshToken = hashParams.get('refresh_token')

            console.log('[Auth] Code present (PKCE):', !!code)
            console.log(
              '[Auth] Access token present (implicit):',
              !!accessToken,
            )
            console.log(
              '[Auth] Refresh token present (implicit):',
              !!refreshToken,
            )

            if (code) {
              console.log(
                '[Auth] Using PKCE flow - exchanging code for session...',
              )

              const { data: sessionData, error: sessionError } =
                await supabase.auth.exchangeCodeForSession(code)

              if (sessionError) {
                throw sessionError
              }

              if (sessionData.session && sessionData.user) {
                await chrome.storage.local.set({
                  supabaseSession: {
                    access_token: sessionData.session.access_token,
                    refresh_token: sessionData.session.refresh_token,
                    expires_at: sessionData.session.expires_at,
                    user: {
                      id: sessionData.user.id,
                      email: sessionData.user.email,
                      user_metadata: sessionData.user.user_metadata,
                    },
                  },
                })

                set({
                  user: sessionData.user,
                  session: sessionData.session,
                  loading: false,
                  error: null,
                })

                get().broadcastAuthChange('login')

                console.log(
                  '[Auth] Sign-in successful (PKCE):',
                  sessionData.user.email,
                )
              }

              return
            }

            if (accessToken && refreshToken) {
              console.log(
                '[Auth] Using implicit flow - setting session with tokens...',
              )

              const { data: sessionData, error: sessionError } =
                await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                })

              if (sessionError) {
                throw sessionError
              }

              if (sessionData.session && sessionData.user) {
                await chrome.storage.local.set({
                  supabaseSession: {
                    access_token: sessionData.session.access_token,
                    refresh_token: sessionData.session.refresh_token,
                    expires_at: sessionData.session.expires_at,
                    user: {
                      id: sessionData.user.id,
                      email: sessionData.user.email,
                      user_metadata: sessionData.user.user_metadata,
                    },
                  },
                })

                set({
                  user: sessionData.user,
                  session: sessionData.session,
                  loading: false,
                  error: null,
                })

                get().broadcastAuthChange('login')

                console.log(
                  '[Auth] Sign-in successful (implicit):',
                  sessionData.user.email,
                )
              }

              return
            }

            const error = hashParams.get('error') || searchParams.get('error')
            const errorDescription =
              hashParams.get('error_description') ||
              searchParams.get('error_description')

            if (error) {
              throw new Error(
                `OAuth error: ${error} - ${errorDescription || 'Unknown error'}`,
              )
            }

            throw new Error('Missing authentication data in callback URL')
          } catch (error) {
            console.error('[Auth] Callback processing error:', error)
            set({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to process authentication',
              errorType: 'unknown',
              loading: false,
            })
          }
        },
      )
    } catch (error) {
      console.error('[Auth] Sign in error:', error)

      let errorType: 'cancellation' | 'network' | 'unknown' = 'unknown'
      let errorMessage = 'Sign in failed'

      if (error instanceof Error) {
        errorMessage = error.message

        if (
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

  signOut: async () => {
    try {
      set({ loading: true, error: null })

      get().broadcastAuthChange('logout')

      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }

      await chrome.storage.local.remove('supabaseSession')

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

  setSession: (session) => {
    set({ session, user: session?.user || null })
    if (session) {
      get().broadcastAuthChange('login')
    }
  },

  initialize: async () => {
    try {
      set({ loading: true })

      const response = await chrome.runtime.sendMessage({ type: 'GET_SESSION' })

      if (response?.session) {
        const { data, error } = await supabase.auth.setSession({
          access_token: response.session.access_token,
          refresh_token: response.session.refresh_token,
        })

        if (error) {
          console.error('[Auth] Failed to restore session:', error)
          set({ loading: false })
          return
        }

        set({
          user: data.user,
          session: data.session,
          loading: false,
        })
      } else {
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

chrome.runtime.onMessage.addListener((message: AuthMessage) => {
  console.log('[AuthStore] Received message from background:', message)
  const { type, user, session, error } = message

  switch (type) {
    case 'AUTH_SUCCESS':
    case 'AUTH_STATE_CHANGE':
      console.log('[AuthStore] Processing AUTH_SUCCESS/STATE_CHANGE', {
        user,
        session,
      })
      if (user && session) {
        useAuthStore.setState({
          user,
          session,
          loading: false,
          error: null,
        })
        console.log('[AuthStore] Store updated with user:', user.email)
      } else {
        console.warn('[AuthStore] Missing user or session in message')
      }
      break

    case 'AUTH_ERROR':
      console.error('[AuthStore] Processing AUTH_ERROR:', error)
      useAuthStore.setState({
        error: error || 'Authentication error',
        loading: false,
      })
      break

    default:
      console.log('[AuthStore] Ignoring message type:', type)
  }
})

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (validateAuthSyncMessage(event.data)) {
      useAuthStore.getState().initialize()
    }
  }
} else {
  window.addEventListener('storage', (event) => {
    if (!event.key?.startsWith('onsaero_auth_sync_')) return
    if (!event.newValue) return

    try {
      const message = JSON.parse(event.newValue)
      if (validateAuthSyncMessage(message)) {
        useAuthStore.getState().initialize()
      }
    } catch {}
  })
}
