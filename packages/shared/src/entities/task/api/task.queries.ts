import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { CreateTask } from '../model/task.dto'
import type { Task } from '../model/task.model'
import {
  createTask,
  deleteTask,
  getTasks,
  toggleTaskCompletion,
} from './task.api'

export const taskKeys = {
  all: ['tasks'],
  lists: () => [...taskKeys.all, 'list'],
  list: (filters?: Record<string, unknown>) => [...taskKeys.lists(), filters],
  details: () => [...taskKeys.all, 'detail'],
  detail: (id: string) => [...taskKeys.details(), id],
} as const

export const useTasksQuery = () => {
  return useQuery({
    queryKey: taskKeys.lists(),
    queryFn: async () => {
      try {
        const tasks = await getTasks()
        return tasks
      } catch (error) {
        console.error('[useTasksQuery] Error fetching tasks:', error)
        throw error
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
    retryDelay: 1000,
  })
}

export const useAddTaskMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,

    onMutate: async (newTask: CreateTask) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() })

      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists())

      const tempTask: Task = {
        id: `temp-${Date.now()}`,
        user_id: newTask.user_id || null,
        title: newTask.title,
        completed: false,
        created_at: new Date().toISOString(),
        completed_at: null,
        updated_at: new Date().toISOString(),
        display_order: previousTasks?.length || 0,
        sync_status: 'pending',
      }

      queryClient.setQueryData<Task[]>(taskKeys.lists(), (old = []) => [
        ...old,
        tempTask,
      ])

      return { previousTasks }
    },

    onError: (_err, _newTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks)
      }
    },

    onSuccess: async (newTaskData) => {
      queryClient.setQueryData<Task[]>(taskKeys.lists(), (old = []) => {
        return old
          .filter((task) => !task.id.startsWith('temp-'))
          .concat(newTaskData)
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

export const useToggleTaskMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      toggleTaskCompletion(id, completed),

    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() })
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists())

      queryClient.setQueryData<Task[]>(taskKeys.lists(), (old = []) =>
        old.map((task) =>
          task.id === id
            ? {
                ...task,
                completed,
                completed_at: completed ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
              }
            : task,
        ),
      )

      return { previousTasks }
    },

    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTask,

    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() })
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists())

      queryClient.setQueryData<Task[]>(taskKeys.lists(), (old = []) =>
        old.filter((task) => task.id !== taskId),
      )

      return { previousTasks }
    },

    onError: (_err, _taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}
