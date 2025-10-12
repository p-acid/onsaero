import { useEffect, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../api/supabase'
import { useTaskStore } from '../stores/taskStore'
import { setTasks, getTasks } from '../lib/storage'
import type { Task } from '../lib/types'

/**
 * React hook to setup Supabase Realtime subscriptions for cross-device sync
 * Listens for changes to the tasks table and updates local state
 */
export function useRealtimeSync() {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const setTasksInStore = useTaskStore((state) => state.setTasks)

  useEffect(() => {
    let mounted = true

    const setupRealtimeSubscription = async () => {
      try {
        // Check if user is authenticated
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          console.log('No active session - skipping realtime setup')
          return
        }

        // Create realtime channel for tasks table
        const channel = supabase
          .channel('tasks-changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'tasks',
              filter: `user_id=eq.${session.user.id}`, // Only listen to current user's tasks
            },
            async (payload) => {
              console.log('Realtime update received:', payload.eventType)

              // Fetch latest tasks from Supabase
              const { data: serverTasks, error } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false })

              if (error) {
                console.error('Error fetching tasks after realtime update:', error)
                return
              }

              // Get current local tasks
              const localTasks = await getTasks()

              // Merge with local tasks (server wins on conflict)
              const merged = mergeTasksWithServer(
                localTasks,
                serverTasks || []
              )

              // Update local storage
              await setTasks(merged)

              // Update Zustand store (triggers UI re-render)
              if (mounted) {
                setTasksInStore(merged)
              }

              console.log(
                `Synced ${merged.length} tasks from realtime update`
              )
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Realtime subscription active')
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Realtime subscription error')
            } else if (status === 'TIMED_OUT') {
              console.warn('Realtime subscription timed out')
            }
          })

        channelRef.current = channel
      } catch (error) {
        console.error('Error setting up realtime subscription:', error)
      }
    }

    setupRealtimeSubscription()

    // Cleanup function
    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        console.log('Realtime subscription cleaned up')
      }
    }
  }, [setTasksInStore])

  return {
    isSubscribed: !!channelRef.current,
  }
}

/**
 * Merge local tasks with server tasks (server wins on conflict)
 */
function mergeTasksWithServer(localTasks: Task[], serverTasks: Task[]): Task[] {
  const merged = new Map<string, Task>()

  // Add all server tasks (server is source of truth)
  for (const task of serverTasks) {
    merged.set(task.id, { ...task, sync_status: 'synced' })
  }

  // Add local-only tasks that don't exist on server (pending sync)
  for (const localTask of localTasks) {
    if (!merged.has(localTask.id)) {
      merged.set(localTask.id, { ...localTask, sync_status: 'pending' })
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => a.display_order - b.display_order
  )
}

/**
 * Hook to setup auth state change listener
 * Manages realtime subscriptions based on auth state
 */
export function useAuthStateSync() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)

      if (event === 'SIGNED_IN' && session) {
        // User signed in - trigger initial sync
        console.log('User signed in - triggering initial sync')

        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false })

        if (tasks) {
          await setTasks(tasks)
          useTaskStore.getState().setTasks(tasks)
        }
      } else if (event === 'SIGNED_OUT') {
        // User signed out - clear synced data
        console.log('User signed out - clearing synced data')
        // Note: We keep local storage for offline use
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])
}
