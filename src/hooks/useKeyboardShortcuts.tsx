import { useEffect, useCallback } from 'react'
import type React from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  handler: () => void
  description: string
}

/**
 * Hook to register keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in an input/textarea
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Exception: Allow Ctrl+Enter or Cmd+Enter in inputs
        if (
          (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) ||
          event.key === 'Escape'
        ) {
          // Allow these shortcuts even in inputs
        } else {
          return
        }
      }

      // Find matching shortcut
      const shortcut = shortcuts.find((s) => {
        return (
          s.key.toLowerCase() === event.key.toLowerCase() &&
          (s.ctrlKey === undefined || s.ctrlKey === event.ctrlKey) &&
          (s.shiftKey === undefined || s.shiftKey === event.shiftKey) &&
          (s.altKey === undefined || s.altKey === event.altKey) &&
          (s.metaKey === undefined || s.metaKey === event.metaKey)
        )
      })

      if (shortcut) {
        event.preventDefault()
        shortcut.handler()
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

/**
 * Common keyboard shortcuts for the task app
 */
export function useTaskKeyboardShortcuts({
  onNewTask,
  onToggleDashboard,
  onToggleCompleted,
  onFocusSearch,
  onSync,
}: {
  onNewTask?: () => void
  onToggleDashboard?: () => void
  onToggleCompleted?: () => void
  onFocusSearch?: () => void
  onSync?: () => void
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrlKey: true,
      handler: () => onNewTask?.(),
      description: 'Create new task',
    },
    {
      key: 'd',
      ctrlKey: true,
      handler: () => onToggleDashboard?.(),
      description: 'Toggle dashboard view',
    },
    {
      key: 'h',
      ctrlKey: true,
      handler: () => onToggleCompleted?.(),
      description: 'Toggle completed tasks',
    },
    {
      key: 'k',
      ctrlKey: true,
      handler: () => onFocusSearch?.(),
      description: 'Focus search',
    },
    {
      key: 's',
      ctrlKey: true,
      handler: () => onSync?.(),
      description: 'Sync now',
    },
    {
      key: '/',
      handler: () => onFocusSearch?.(),
      description: 'Focus search (alternate)',
    },
  ]

  useKeyboardShortcuts(shortcuts)

  return shortcuts
}

/**
 * Keyboard shortcuts help modal
 */
export function KeyboardShortcutsHelp({
  shortcuts,
  onClose,
}: {
  shortcuts: KeyboardShortcut[]
  onClose: () => void
}): React.ReactElement {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys: string[] = []

    if (shortcut.ctrlKey || shortcut.metaKey) {
      keys.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
    }
    if (shortcut.shiftKey) keys.push('Shift')
    if (shortcut.altKey) keys.push('Alt')
    keys.push(shortcut.key.toUpperCase())

    return keys.join(' + ')
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600 }}>
          Keyboard Shortcuts
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              <span style={{ fontSize: '14px' }}>{shortcut.description}</span>
              <kbd
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#F3F4F6',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  border: '1px solid #D1D5DB',
                }}
              >
                {formatShortcut(shortcut)}
              </kbd>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '20px',
            padding: '8px 16px',
            backgroundColor: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            width: '100%',
            fontSize: '14px',
            fontWeight: 500,
          }}
          type="button"
        >
          Close
        </button>
      </div>
    </div>
  )
}
