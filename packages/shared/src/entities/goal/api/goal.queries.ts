import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { CreateOKR } from '../model/goal.dto'
import type { Goal, GoalWithDetails } from '../model/goal.model'
import {
  createGoal,
  createKeyResult,
  createObjective,
  createOKR,
  deleteGoal,
  deleteKeyResult,
  deleteObjective,
  getGoals,
  getGoalWithDetails,
  updateGoal,
  updateKeyResult,
  updateObjective,
} from './goal.api'

export const goalKeys = {
  all: ['goals'],
  lists: () => [...goalKeys.all, 'list'],
  list: (filters?: Record<string, unknown>) => [...goalKeys.lists(), filters],
  details: () => [...goalKeys.all, 'detail'],
  detail: (id: string) => [...goalKeys.details(), id],
} as const

// Goals Query
export const useGoalsQuery = (userId: string | undefined) => {
  return useQuery({
    queryKey: goalKeys.list({ userId }),
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required to fetch goals')
      }
      return getGoals(userId)
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })
}

export const useGoalWithDetailsQuery = (goalId: string | undefined) => {
  return useQuery({
    queryKey: goalKeys.detail(goalId || ''),
    queryFn: async () => {
      if (!goalId) {
        throw new Error('Goal ID is required')
      }
      return getGoalWithDetails(goalId)
    },
    enabled: !!goalId,
    staleTime: 1000 * 60 * 5,
  })
}

// Goal Mutations
export const useCreateGoalMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() })
    },
  })
}

export const useUpdateGoalMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateGoal,
    onSuccess: (updatedGoal) => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: goalKeys.detail(updatedGoal.id),
      })
    },
  })
}

export const useDeleteGoalMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() })
    },
  })
}

// Objective Mutations
export const useCreateObjectiveMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createObjective,
    onSuccess: (objective) => {
      queryClient.invalidateQueries({
        queryKey: goalKeys.detail(objective.goal_id),
      })
    },
  })
}

export const useUpdateObjectiveMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateObjective,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.details() })
    },
  })
}

export const useDeleteObjectiveMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteObjective,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.details() })
    },
  })
}

// KeyResult Mutations
export const useCreateKeyResultMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createKeyResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.details() })
    },
  })
}

export const useUpdateKeyResultMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateKeyResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.details() })
    },
  })
}

export const useDeleteKeyResultMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteKeyResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.details() })
    },
  })
}

export const useCreateOKRMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, okrData }: { userId: string; okrData: CreateOKR }) =>
      createOKR(userId, okrData),
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey: goalKeys.list({ userId }) })

      const previousGoals = queryClient.getQueryData<Goal[]>(
        goalKeys.list({ userId }),
      )

      return { previousGoals }
    },
    onError: (_err, { userId }, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(
          goalKeys.list({ userId }),
          context.previousGoals,
        )
      }
    },
    onSuccess: (newGoal) => {
      queryClient.setQueryData<Goal[]>(
        goalKeys.list({ userId: newGoal.user_id }),
        (old = []) => [newGoal, ...old],
      )
      queryClient.setQueryData<GoalWithDetails>(
        goalKeys.detail(newGoal.id),
        newGoal,
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() })
    },
  })
}
