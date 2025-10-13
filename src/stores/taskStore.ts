import { create } from 'zustand'
import { getTasks, setTasks } from '../lib/storage'
import type { Task } from '../lib/types'

interface TaskStore {
  // State
  tasks: Task[]
  isLoading: boolean
  error: string | null
  showCompleted: boolean

  // Actions
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleCompleted: (id: string) => void
  setShowCompleted: (show: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Sync actions
  loadFromStorage: () => Promise<void>
  syncToStorage: () => Promise<void>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  // Initial state
  tasks: [],
  isLoading: false,
  error: null,
  showCompleted: false,

  // Set all tasks
  setTasks: (tasks) => set({ tasks }),

  // Add a new task
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),

  // Update an existing task
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task,
      ),
    })),

  // Delete a task
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),

  // Toggle task completion
  toggleCompleted: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              completed_at: !task.completed ? new Date().toISOString() : null,
            }
          : task,
      ),
    })),

  // Toggle show completed tasks
  setShowCompleted: (show) => set({ showCompleted: show }),

  // Set loading state
  setLoading: (loading) => set({ isLoading: loading }),

  // Set error state
  setError: (error) => set({ error }),

  // Load tasks from chrome.storage.sync
  loadFromStorage: async () => {
    set({ isLoading: true, error: null })
    try {
      const tasks = await getTasks()
      set({ tasks, isLoading: false })
    } catch (error) {
      console.error('Error loading tasks from storage:', error)
      set({
        error: 'Failed to load tasks from storage',
        isLoading: false,
      })
    }
  },

  // Sync tasks to chrome.storage.sync
  syncToStorage: async () => {
    try {
      const { tasks } = get()
      await setTasks(tasks)
    } catch (error) {
      console.error('Error syncing tasks to storage:', error)
      set({ error: 'Failed to sync tasks to storage' })
    }
  },
}))
