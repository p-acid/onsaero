import { QueryClient } from '@tanstack/react-query'

// Create a client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 1000 * 60 * 5,

      // Cache time: 10 minutes
      gcTime: 1000 * 60 * 10,

      // Retry configuration
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,

      // Error handling
      throwOnError: false,
    },
    mutations: {
      // Retry configuration for mutations
      retry: 1,
      retryDelay: 1000,

      // Error handling
      throwOnError: false,
    },
  },
})
