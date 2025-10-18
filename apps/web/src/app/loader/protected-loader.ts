import { PAGE_ROUTES } from '@onsaero/shared'
import { redirect } from 'react-router'
import { webAuthStore } from '@/shared/store'

export const protectedLoader = async () => {
  const { session } = webAuthStore.getState()

  if (!session) {
    throw redirect(PAGE_ROUTES.SIGN_IN)
  }

  return null
}
