import {
  createContext,
  type PropsWithChildren,
  useContext,
  useRef,
} from 'react'
import { useStore } from 'zustand'
import type { AuthState, AuthStore } from '../store'

const AuthContext = createContext<AuthStore | null>(null)

export interface AuthContextProviderProps extends PropsWithChildren {
  store: AuthStore
}

export const AuthContextProvider = ({
  children,
  store,
}: AuthContextProviderProps) => {
  const value = useRef(store).current
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = <T,>(selector: (state: AuthState) => T): T => {
  const context = useContext(AuthContext)

  if (!context)
    throw new Error(
      '[AuthContext] useAuthContext must be used within AuthContextProvider',
    )

  return useStore(context, selector)
}
