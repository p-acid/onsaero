import type { AuthChangeAction, AuthSyncMessage } from '../shared/types'

const AUTH_CHANNEL_NAME = 'onsaero_auth'

function validateAuthSyncMessage(message: unknown): message is AuthSyncMessage {
  if (!message || typeof message !== 'object') return false

  const msg = message as Partial<AuthSyncMessage>
  if (msg.type !== 'AUTH_STATE_CHANGE') return false

  const now = Date.now()
  if (!msg.timestamp || Math.abs(now - msg.timestamp) > 10000) return false

  const validActions: AuthChangeAction[] = [
    'login',
    'logout',
    'refresh',
    'server_revoke',
  ]

  if (!msg.action || !validActions.includes(msg.action)) return false

  if (msg.sessionId !== null && typeof msg.sessionId !== 'string') return false

  return true
}

export function createAuthSyncChannel() {
  if (!('BroadcastChannel' in window)) return null

  const broadcastChannel = new BroadcastChannel(AUTH_CHANNEL_NAME)

  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      if (validateAuthSyncMessage(event.data)) {
        onMessage()
      }
    }
  } else {
    window.addEventListener('storage', (event) => {
      if (!event.key?.startsWith('onsaero_auth_sync_')) return
      if (!event.newValue) return

      try {
        const message = JSON.parse(event.newValue)
        if (validateAuthSyncMessage(message)) {
          onMessage()
        }
      } catch {}
    })
  }

  const broadcastAuthChange = ({
    sessionId,
    action,
  }: Pick<AuthSyncMessage, 'sessionId' | 'action'>) => {
    const message: AuthSyncMessage = {
      type: 'AUTH_STATE_CHANGE',
      sessionId,
      timestamp: Date.now(),
      action,
    }

    if (broadcastChannel) {
      broadcastChannel.postMessage(message)
    } else {
      const key = `onsaero_auth_sync_${Date.now()}`
      localStorage.setItem(key, JSON.stringify(message))

      setTimeout(() => localStorage.removeItem(key), 1000)
    }
  }

  return { broadcastChannel, broadcastAuthChange }
}
