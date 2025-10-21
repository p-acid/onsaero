import {
  type AuthStateCreator,
  createAuthStore,
  supabase,
} from '@onsaero/shared'
import { WEB_PAGE_ROUTES } from '../config'

export const CREATE_AUTH_STORE_PARAMS: AuthStateCreator = (set) => ({
  signInWithGoogle: async () => {
    const redirectUrl = window.location.origin + WEB_PAGE_ROUTES.REDIRECT

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
        },
      },
    })

    if (error) throw error
  },
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      set({
        user: null,
        session: null,
      })
    } catch (error) {
      console.error('[Auth] Sign out error:', error)
    }
  },
})

export const webAuthStore = createAuthStore(CREATE_AUTH_STORE_PARAMS)
