import {
  type CreateAuthStoreParams,
  createAuthStore,
  supabase,
} from '@onsaero/shared'
import { WEB_PAGE_ROUTES } from '../config'

export const CREATE_AUTH_STORE_PARAMS: CreateAuthStoreParams = {
  signInWithGoogle: async () => {
    const redirectUrl = window.location.origin + WEB_PAGE_ROUTES.REDIRECT

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) throw error
  },
}

export const webAuthStore = createAuthStore(CREATE_AUTH_STORE_PARAMS)
