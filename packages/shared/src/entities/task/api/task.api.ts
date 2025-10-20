import { supabase } from '@onsaero-shared/shared/lib'
import type { CreateTask, NewTask, UpdateTask } from '../model/task.dto'
import type { Task } from '../model/task.model'

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

export const createTask = async (newTask: CreateTask): Promise<Task> => {
  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)

  const maxOrder = existingTasks?.[0]?.display_order ?? -1

  const insertData: NewTask = {
    ...newTask,
    user_id: null,
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
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`)
  }

  return data
}

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

export const deleteTask = async (id: string): Promise<void> => {
  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete task: ${error.message}`)
  }
}
