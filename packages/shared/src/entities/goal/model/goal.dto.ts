import type { Database, SetRequired } from '@onsaero-shared/shared/types'

// Goal DTOs
type InsertGoal = Database['public']['Tables']['goals']['Insert']

export type CreateGoal = Omit<InsertGoal, 'id' | 'created_at' | 'updated_at'>

export type UpdateGoal = SetRequired<
  Database['public']['Tables']['goals']['Update'],
  'id'
>

// Objective DTOs
type InsertObjective = Database['public']['Tables']['objectives']['Insert']

export type CreateObjective = Omit<
  InsertObjective,
  'id' | 'created_at' | 'updated_at'
>

export type UpdateObjective = SetRequired<
  Database['public']['Tables']['objectives']['Update'],
  'id'
>

// KeyResult DTOs
type InsertKeyResult = Database['public']['Tables']['key_results']['Insert']

export type CreateKeyResult = Omit<
  InsertKeyResult,
  'id' | 'created_at' | 'updated_at'
>

export type UpdateKeyResult = SetRequired<
  Database['public']['Tables']['key_results']['Update'],
  'id'
>

// OKR 생성을 위한 복합 DTO
export type CreateOKR = {
  goal: Omit<CreateGoal, 'template_type'>
  objectives: Array<{
    title: string
    description?: string
    key_results: Array<{
      title: string
      target_value?: number
      current_value?: number
      unit?: string
    }>
  }>
}
