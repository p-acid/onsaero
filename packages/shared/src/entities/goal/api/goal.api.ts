import { supabase } from '@onsaero-shared/shared/lib'
import type {
  CreateGoal,
  CreateKeyResult,
  CreateObjective,
  CreateOKR,
  UpdateGoal,
  UpdateKeyResult,
  UpdateObjective,
} from '../model/goal.dto'
import type {
  Goal,
  GoalWithDetails,
  KeyResult,
  Objective,
  ObjectiveWithKeyResults,
} from '../model/goal.model'

// Goal CRUD
export const getGoals = async (userId: string): Promise<Goal[]> => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch goals: ${error.message}`)
  }

  return data || []
}

export const getGoalWithDetails = async (
  goalId: string,
): Promise<GoalWithDetails | null> => {
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .single()

  if (goalError) {
    throw new Error(`Failed to fetch goal: ${goalError.message}`)
  }

  const { data: objectives, error: objectivesError } = await supabase
    .from('objectives')
    .select('*')
    .eq('goal_id', goalId)
    .order('created_at', { ascending: true })

  if (objectivesError) {
    throw new Error(`Failed to fetch objectives: ${objectivesError.message}`)
  }

  const objectivesWithKeyResults: ObjectiveWithKeyResults[] = await Promise.all(
    (objectives || []).map(async (objective) => {
      const { data: keyResults, error: keyResultsError } = await supabase
        .from('key_results')
        .select('*')
        .eq('objective_id', objective.id)
        .order('created_at', { ascending: true })

      if (keyResultsError) {
        throw new Error(
          `Failed to fetch key results: ${keyResultsError.message}`,
        )
      }

      return {
        ...objective,
        key_results: keyResults || [],
      }
    }),
  )

  return {
    ...goal,
    objectives: objectivesWithKeyResults,
  }
}

export const createGoal = async (newGoal: CreateGoal): Promise<Goal> => {
  const { data, error } = await supabase
    .from('goals')
    .insert(newGoal)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create goal: ${error.message}`)
  }

  return data
}

export const updateGoal = async ({
  id,
  ...updates
}: UpdateGoal): Promise<Goal> => {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update goal: ${error.message}`)
  }

  return data
}

export const deleteGoal = async (id: string): Promise<void> => {
  const { error } = await supabase.from('goals').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete goal: ${error.message}`)
  }
}

// Objective CRUD
export const createObjective = async (
  newObjective: CreateObjective,
): Promise<Objective> => {
  const { data, error } = await supabase
    .from('objectives')
    .insert(newObjective)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create objective: ${error.message}`)
  }

  return data
}

export const updateObjective = async ({
  id,
  ...updates
}: UpdateObjective): Promise<Objective> => {
  const { data, error } = await supabase
    .from('objectives')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update objective: ${error.message}`)
  }

  return data
}

export const deleteObjective = async (id: string): Promise<void> => {
  const { error } = await supabase.from('objectives').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete objective: ${error.message}`)
  }
}

// KeyResult CRUD
export const createKeyResult = async (
  newKeyResult: CreateKeyResult,
): Promise<KeyResult> => {
  const { data, error } = await supabase
    .from('key_results')
    .insert(newKeyResult)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create key result: ${error.message}`)
  }

  return data
}

export const updateKeyResult = async ({
  id,
  ...updates
}: UpdateKeyResult): Promise<KeyResult> => {
  const { data, error } = await supabase
    .from('key_results')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update key result: ${error.message}`)
  }

  return data
}

export const deleteKeyResult = async (id: string): Promise<void> => {
  const { error } = await supabase.from('key_results').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete key result: ${error.message}`)
  }
}

export const createOKR = async (
  userId: string,
  okrData: CreateOKR,
): Promise<GoalWithDetails> => {
  const goal = await createGoal({
    ...okrData.goal,
    user_id: userId,
    template_type: 'okr',
    status: 'active',
  })

  const objectivesWithKeyResults: ObjectiveWithKeyResults[] = await Promise.all(
    okrData.objectives.map(async (objectiveData) => {
      const objective = await createObjective({
        goal_id: goal.id,
        title: objectiveData.title,
        description: objectiveData.description,
        status: 'not_started',
      })

      const keyResults = await Promise.all(
        objectiveData.key_results.map((keyResultData) =>
          createKeyResult({
            objective_id: objective.id,
            title: keyResultData.title,
            target_value: keyResultData.target_value,
            current_value: keyResultData.current_value ?? 0,
            unit: keyResultData.unit,
            status: 'not_started',
          }),
        ),
      )

      return {
        ...objective,
        key_results: keyResults,
      }
    }),
  )

  return {
    ...goal,
    objectives: objectivesWithKeyResults,
  }
}
