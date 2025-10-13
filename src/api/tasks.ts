import type { Database } from '../lib/database.types'
import type { NewTask, Task, UpdateTask } from '../lib/types'
import { supabase } from './supabase'

/**
 * Fetch all tasks for the current user
 */
export const getTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`)
  }

  return data || []
}

/**
 * Create a new task
 */
export const createTask = async (newTask: NewTask): Promise<Task> => {
  // Get the max display_order to append new task at the end
  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)

  const maxOrder = existingTasks?.[0]?.display_order ?? -1

  const insertData: Database['public']['Tables']['tasks']['Insert'] = {
    ...newTask,
    user_id: null, // Anonymous user for MVP
    display_order: maxOrder + 1,
    completed: false,
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`)
  }

  return data
}

/**
 * Update an existing task
 */
export const updateTask = async ({
  id,
  ...updates
}: UpdateTask): Promise<Task> => {
  const updateData: Database['public']['Tables']['tasks']['Update'] = updates

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`)
  }

  return data
}

/**
 * Toggle task completion status
 */
export const toggleTaskCompletion = async (
  id: string,
  completed: boolean,
): Promise<Task> => {
  return updateTask({
    id,
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  })
}

/**
 * Delete a task
 */
export const deleteTask = async (id: string): Promise<void> => {
  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete task: ${error.message}`)
  }
}
