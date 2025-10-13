import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'

/**
 * Custom hook for authentication
 * Provides convenient access to auth state and actions
 * Automatically initializes auth state on mount
 */
export function useAuth() {
  const {
    user,
    session,
    loading,
    error,
    signInWithGoogle,
    signOut,
    initialize,
  } = useAuthStore()

  // Initialize auth state on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user,
    signInWithGoogle,
    signOut,
  }
}
