import type { Database } from '@onsaero-shared/shared/types'

export type Goal = Database['public']['Tables']['goals']['Row']
export type Objective = Database['public']['Tables']['objectives']['Row']
export type KeyResult = Database['public']['Tables']['key_results']['Row']

export type GoalWithDetails = Goal & {
  objectives: ObjectiveWithKeyResults[]
}

export type ObjectiveWithKeyResults = Objective & {
  key_results: KeyResult[]
}
