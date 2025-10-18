import type { Session, User } from '@supabase/supabase-js'
import { createStore } from 'zustand'
import type { OptionalKeys } from '../types'

export interface CreateAuthStoreParams {
  signInWithGoogle: () => Promise<void>
}

export interface AuthState extends CreateAuthStoreParams {
  user: User | null
  session: Session | null
  updateAuth: (value: Pick<AuthState, 'user' | 'session'>) => void
}

export type AuthStore = ReturnType<typeof createAuthStore>

export const createAuthStore = (initProps: CreateAuthStoreParams) => {
  const DEFAULT_PROPS: Pick<
    CreateAuthStoreParams,
    OptionalKeys<CreateAuthStoreParams>
  > = {}

  return createStore<AuthState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    user: null,
    session: null,
    updateAuth: ({ user, session }) => {
      set((state) => ({ ...state, user, session }))
    },
  }))
}
