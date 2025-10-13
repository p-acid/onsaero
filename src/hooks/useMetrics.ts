import { useQuery } from '@tanstack/react-query'
import {
  getAllTimeMetrics,
  getMonthlyMetrics,
  getWeeklyMetrics,
} from '../api/metrics'

/**
 * Query key factory for metrics
 */
export const metricsKeys = {
  all: ['metrics'] as const,
  weekly: () => [...metricsKeys.all, 'weekly'] as const,
  monthly: () => [...metricsKeys.all, 'monthly'] as const,
  allTime: () => [...metricsKeys.all, 'allTime'] as const,
}

/**
 * Hook to fetch weekly metrics (last 7 days)
 */
export const useWeeklyMetricsQuery = () => {
  return useQuery({
    queryKey: metricsKeys.weekly(),
    queryFn: getWeeklyMetrics,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  })
}

/**
 * Hook to fetch all-time metrics
 */
export const useAllTimeMetricsQuery = () => {
  return useQuery({
    queryKey: metricsKeys.allTime(),
    queryFn: getAllTimeMetrics,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  })
}

/**
 * Hook to fetch monthly metrics (last 30 days)
 */
export const useMonthlyMetricsQuery = () => {
  return useQuery({
    queryKey: metricsKeys.monthly(),
    queryFn: getMonthlyMetrics,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  })
}
