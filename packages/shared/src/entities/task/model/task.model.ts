import type { Database } from '@/shared/types'

export type Task = Database['public']['Tables']['tasks']['Row'] & {
  sync_status?: 'synced' | 'pending' | 'error'
}
