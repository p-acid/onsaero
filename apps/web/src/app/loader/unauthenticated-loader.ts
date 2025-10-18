import { PAGE_ROUTES } from '@onsaero/shared'
import { redirect } from 'react-router'
import { webAuthStore } from '@/shared/store'

export const unauthenticatedLoader = async () => {
  const { user, session } = webAuthStore.getState()

  if (user && session) {
    throw redirect(PAGE_ROUTES.DASHBOARD)
  }

  return null
}
