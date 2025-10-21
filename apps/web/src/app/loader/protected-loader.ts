import { PAGE_ROUTES, supabase } from '@onsaero/shared'
import { redirect } from 'react-router'
import { webAuthStore } from '@/shared/store'

export const protectedLoader = async () => {
  const { session, updateAuth } = webAuthStore.getState()

  if (!session) {
    const { data } = await supabase.auth.getSession()

    if (data.session?.user) {
      updateAuth({
        user: data.session?.user,
        session: data.session,
      })
      return null
    }

    throw redirect(PAGE_ROUTES.SIGN_IN)
  }

  return null
}
