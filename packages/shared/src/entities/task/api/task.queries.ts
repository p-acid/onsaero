import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { CreateTask, UpdateTask } from '../model/task.dto'
import type { Task } from '../model/task.model'
import {
  createTask,
  deleteTask,
  getTasks,
  toggleTaskCompletion,
  updateTask,
} from './task.api'

export const taskKeys = {
  all: ['tasks'],
  lists: () => [...taskKeys.all, 'list'],
  list: (filters?: Record<string, unknown>) => [...taskKeys.lists(), filters],
  details: () => [...taskKeys.all, 'detail'],
  detail: (id: string) => [...taskKeys.details(), id],
} as const

export const useTasksQuery = (userId: string | undefined) => {
  return useQuery({
    queryKey: taskKeys.list({ userId }),
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required to fetch tasks')
      }
      try {
        const tasks = await getTasks(userId)
        return tasks
      } catch (error) {
        console.error('[useTasksQuery] Error fetching tasks:', error)
        throw error
      }
    },
    enabled: !!userId,
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

      const previousTasks = queryClient.getQueryData<Task[]>(
        taskKeys.list({ userId: newTask.user_id }),
      )

      const tempTask: Task = {
        id: `temp-${Date.now()}`,
        user_id: newTask.user_id || null,
        title: newTask.title,
        description: newTask.description || null,
        status: 'pending',
        priority: null,
        due_date: null,
        started_at: null,
        created_at: new Date().toISOString(),
        completed_at: null,
        updated_at: new Date().toISOString(),
        display_order: previousTasks?.length || 0,
      }

      queryClient.setQueryData<Task[]>(
        taskKeys.list({ userId: newTask.user_id }),
        (old = []) => [...old, tempTask],
      )

      return { previousTasks }
    },

    onError: (_err, newTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          taskKeys.list({ userId: newTask.user_id }),
          context.previousTasks,
        )
      }
    },

    onSuccess: async (newTaskData) => {
      queryClient.setQueryData<Task[]>(
        taskKeys.list({ userId: newTaskData.user_id }),
        (old = []) => {
          return old
            .filter((task) => !task.id.startsWith('temp-'))
            .concat(newTaskData)
        },
      )
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

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTask,

    onMutate: async (updatedTask: UpdateTask) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() })

      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.lists(),
      })

      queryClient.setQueriesData<Task[]>(
        { queryKey: taskKeys.lists() },
        (old) => {
          if (!old) return old
          return old.map((task) =>
            task.id === updatedTask.id ? { ...task, ...updatedTask } : task,
          )
        },
      )

      return { previousTasks }
    },

    onError: (_err, _updatedTask, context) => {
      if (context?.previousTasks) {
        for (const [queryKey, data] of context.previousTasks) {
          queryClient.setQueryData(queryKey, data)
        }
      }
    },

    onSuccess: (updatedTask) => {
      queryClient.setQueriesData<Task[]>(
        { queryKey: taskKeys.lists() },
        (old) => {
          if (!old) return old
          return old.map((task) =>
            task.id === updatedTask.id ? updatedTask : task,
          )
        },
      )
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

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}
