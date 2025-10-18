import type { Database, SetRequired } from '@/shared/types'

export type NewTask = Omit<
  Database['public']['Tables']['tasks']['Insert'],
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
