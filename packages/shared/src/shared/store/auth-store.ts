import type { Session, User } from '@supabase/supabase-js'
import { createStore, type StateCreator } from 'zustand'

interface AuthStateCreatorParams {
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export interface AuthState extends AuthStateCreatorParams {
  user: User | null
  session: Session | null
  updateAuth: (value: Pick<AuthState, 'user' | 'session'>) => void
}

export type AuthStateCreator = StateCreator<
  AuthState,
  [],
  [],
  AuthStateCreatorParams
>

export type AuthStore = ReturnType<typeof createAuthStore>

export const createAuthStore = (authStateCreator: AuthStateCreator) => {
  return createStore<AuthState>()((...params) => {
    const [set] = params
    return {
      ...authStateCreator(...params),
      user: null,
      session: null,
      updateAuth: ({ user, session }) => {
        set((state) => ({ ...state, user, session }))
      },
    }
  })
}
