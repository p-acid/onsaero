import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../api/supabase'
import { getPreferences, setPreferences } from '../lib/storage'
import type { UserPreferences } from '../lib/types'

const DEFAULT_PREFERENCES: UserPreferences = {
  user_id: '',
  show_completed_by_default: false,
  theme: 'auto',
  default_view: 'list',
  updated_at: new Date().toISOString(),
}

/**
 * React hook to manage user preferences
 * Syncs between chrome.storage.sync and Supabase
 */
export function usePreferences() {
  const [preferences, setPreferencesState] =
    useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true)

      // Check if user is authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        // Not authenticated - use local storage only
        const localPrefs = await getPreferences()
        if (localPrefs) {
          setPreferencesState(localPrefs)
        } else {
          setPreferencesState(DEFAULT_PREFERENCES)
        }
        setIsLoading(false)
        return
      }

      // Try to fetch from Supabase first
      const { data: serverPrefs, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows found (expected for new users)
        throw fetchError
      }

      if (serverPrefs) {
        // Server preferences exist - use them
        await setPreferences(serverPrefs)
        setPreferencesState(serverPrefs)
      } else {
        // No server preferences - check local storage
        const localPrefs = await getPreferences()

        if (localPrefs) {
          // Migrate local preferences to server
          const prefsToSave = { ...localPrefs, user_id: session.user.id }
          const { error: insertError } = await supabase
            .from('user_preferences')
            .insert(prefsToSave)

          if (insertError) {
            console.error('Error saving preferences to server:', insertError)
          } else {
            console.log('Migrated local preferences to server')
          }

          setPreferencesState(prefsToSave)
        } else {
          // No preferences anywhere - create defaults
          const defaultPrefs = {
            ...DEFAULT_PREFERENCES,
            user_id: session.user.id,
          }

          const { error: insertError } = await supabase
            .from('user_preferences')
            .insert(defaultPrefs)

          if (insertError) {
            console.error('Error creating default preferences:', insertError)
          }

          await setPreferences(defaultPrefs)
          setPreferencesState(defaultPrefs)
        }
      }

      setIsLoading(false)
    } catch (err) {
      console.error('Error loading preferences:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsLoading(false)
    }
  }, [])

  // Load preferences on mount
  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  const updatePreferences = async (
    updates: Partial<Omit<UserPreferences, 'user_id'>>,
  ) => {
    try {
      const updated = {
        ...preferences,
        ...updates,
        updated_at: new Date().toISOString(),
      }

      // Update local storage immediately (optimistic update)
      await setPreferences(updated)
      setPreferencesState(updated)

      // Sync to Supabase if authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        const { error: updateError } = await supabase
          .from('user_preferences')
          .upsert(updated, { onConflict: 'user_id' })

        if (updateError) {
          console.error('Error updating preferences on server:', updateError)
          setError(updateError.message)
        }
      }
    } catch (err) {
      console.error('Error updating preferences:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return {
    preferences,
    updatePreferences,
    isLoading,
    error,
    reload: loadPreferences,
  }
}

/**
 * Hook for specific preference toggles
 */
export function useShowCompleted() {
  const { preferences, updatePreferences } = usePreferences()

  const toggle = () => {
    updatePreferences({
      show_completed_by_default: !preferences.show_completed_by_default,
    })
  }

  return {
    showCompleted: preferences.show_completed_by_default,
    toggle,
  }
}

export function useTheme() {
  const { preferences, updatePreferences } = usePreferences()

  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    updatePreferences({ theme })
  }

  return {
    theme: preferences.theme,
    setTheme,
  }
}

export function useDefaultView() {
  const { preferences, updatePreferences } = usePreferences()

  const setDefaultView = (view: 'list' | 'dashboard') => {
    updatePreferences({ default_view: view })
  }

  return {
    defaultView: preferences.default_view,
    setDefaultView,
  }
}
