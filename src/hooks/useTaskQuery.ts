import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask, deleteTask, toggleTaskCompletion } from '../api/tasks';
import { syncTasksToStorage } from '../lib/storage';
import type { Task, NewTask } from '../lib/types';

/**
 * Query key factory for tasks
 */
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

/**
 * Hook to fetch all tasks
 */
export const useTasksQuery = () => {
  return useQuery({
    queryKey: taskKeys.lists(),
    queryFn: async () => {
      const tasks = await getTasks();
      // Sync to chrome.storage after fetching
      await syncTasksToStorage(tasks);
      return tasks;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to add a new task with optimistic updates
 */
export const useAddTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,

    // Optimistic update
    onMutate: async (newTask: NewTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());

      // Optimistically update with temporary task
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
      };

      queryClient.setQueryData<Task[]>(taskKeys.lists(), (old = []) => [...old, tempTask]);

      return { previousTasks };
    },

    // On error, roll back to previous value
    onError: (_err, _newTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
      }
    },

    // On success, refetch to get server data
    onSuccess: async (newTaskData) => {
      queryClient.setQueryData<Task[]>(taskKeys.lists(), (old = []) => {
        // Replace temp task with real task from server
        return old
          .filter((task) => !task.id.startsWith('temp-'))
          .concat(newTaskData);
      });

      // Sync to chrome.storage
      const tasks = queryClient.getQueryData<Task[]>(taskKeys.lists()) || [];
      await syncTasksToStorage(tasks);
    },

    // Always refetch after mutation completes
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

/**
 * Hook to toggle task completion status
 */
export const useToggleTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      toggleTaskCompletion(id, completed),

    // Optimistic update
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());

      queryClient.setQueryData<Task[]>(taskKeys.lists(), (old = []) =>
        old.map((task) =>
          task.id === id
            ? {
                ...task,
                completed,
                completed_at: completed ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
              }
            : task
        )
      );

      return { previousTasks };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
      }
    },

    onSuccess: async () => {
      const tasks = queryClient.getQueryData<Task[]>(taskKeys.lists()) || [];
      await syncTasksToStorage(tasks);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};

/**
 * Hook to delete a task
 */
export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,

    // Optimistic update
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.lists());

      queryClient.setQueryData<Task[]>(taskKeys.lists(), (old = []) =>
        old.filter((task) => task.id !== taskId)
      );

      return { previousTasks };
    },

    onError: (_err, _taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
      }
    },

    onSuccess: async () => {
      const tasks = queryClient.getQueryData<Task[]>(taskKeys.lists()) || [];
      await syncTasksToStorage(tasks);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
};
