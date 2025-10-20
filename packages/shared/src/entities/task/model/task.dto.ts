import type { Database, SetRequired } from '@onsaero-shared/shared/types'

type InsertTask = Database['public']['Tables']['tasks']['Insert']

export type NewTask = Omit<
  InsertTask,
  'id' | 'created_at' | 'updated_at' | 'completed_at'
>

export type CreateTask = Omit<
  Database['public']['Tables']['tasks']['Insert'],
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'completed'
  | 'completed_at'
  | 'display_order'
>

export type UpdateTask = SetRequired<
  Database['public']['Tables']['tasks']['Update'],
  'id'
>
