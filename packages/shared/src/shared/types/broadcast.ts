export type AuthChangeAction = 'login' | 'logout' | 'refresh' | 'server_revoke'

export interface AuthSyncMessage {
  type: 'AUTH_STATE_CHANGE'
  sessionId: string | null
  timestamp: number
  action: AuthChangeAction
}
