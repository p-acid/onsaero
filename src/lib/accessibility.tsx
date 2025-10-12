/**
 * Accessibility utilities and helpers
 */

/**
 * Announce message to screen readers using ARIA live region
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const liveRegion = document.getElementById('aria-live-region') || createLiveRegion(priority)
  liveRegion.textContent = message

  // Clear after announcement
  setTimeout(() => {
    liveRegion.textContent = ''
  }, 1000)
}

function createLiveRegion(priority: 'polite' | 'assertive'): HTMLElement {
  const existing = document.getElementById('aria-live-region')
  if (existing) return existing

  const liveRegion = document.createElement('div')
  liveRegion.id = 'aria-live-region'
  liveRegion.setAttribute('aria-live', priority)
  liveRegion.setAttribute('aria-atomic', 'true')
  liveRegion.setAttribute('role', 'status')
  liveRegion.style.position = 'absolute'
  liveRegion.style.left = '-10000px'
  liveRegion.style.width = '1px'
  liveRegion.style.height = '1px'
  liveRegion.style.overflow = 'hidden'
  document.body.appendChild(liveRegion)

  return liveRegion
}

/**
 * Focus trap for modal dialogs
 */
export function createFocusTrap(element: HTMLElement) {
  const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

  const focusableElements = Array.from(element.querySelectorAll<HTMLElement>(focusableSelector))
  const firstFocusable = focusableElements[0]
  const lastFocusable = focusableElements[focusableElements.length - 1]

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault()
        lastFocusable?.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault()
        firstFocusable?.focus()
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown)

  // Focus first element
  firstFocusable?.focus()

  // Cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Generate accessible label for task completion status
 */
export function getTaskStatusLabel(completed: boolean, title: string): string {
  return completed
    ? `Completed task: ${title}. Press space to mark as incomplete.`
    : `Task: ${title}. Press space to mark as complete.`
}

import type React from 'react'

/**
 * Skip to main content link (for keyboard navigation)
 */
export function SkipToMainContent({ targetId = 'main-content' }: { targetId?: string }): React.ReactElement {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: '-10000px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        padding: '8px 16px',
        backgroundColor: '#4F46E5',
        color: 'white',
        borderRadius: '4px',
        textDecoration: 'none',
        fontWeight: 500,
        zIndex: 9999,
      }}
      onFocus={(e) => {
        e.currentTarget.style.left = '8px'
        e.currentTarget.style.top = '8px'
        e.currentTarget.style.width = 'auto'
        e.currentTarget.style.height = 'auto'
      }}
      onBlur={(e) => {
        e.currentTarget.style.left = '-10000px'
        e.currentTarget.style.top = 'auto'
        e.currentTarget.style.width = '1px'
        e.currentTarget.style.height = '1px'
      }}
    >
      Skip to main content
    </a>
  )
}

/**
 * Hook to manage focus when modals open/close
 */
import { useEffect, useRef } from 'react'

export function useModalFocus(isOpen: boolean) {
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Save currently focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement

      // Create focus trap when modal opens
      if (modalRef.current) {
        const cleanup = createFocusTrap(modalRef.current)
        return cleanup
      }
    } else {
      // Restore focus when modal closes
      previouslyFocusedElement.current?.focus()
    }
  }, [isOpen])

  return modalRef
}

/**
 * Accessible button props generator
 */
export function getAccessibleButtonProps({
  label,
  disabled = false,
  pressed,
}: {
  label: string
  disabled?: boolean
  pressed?: boolean
}) {
  return {
    'aria-label': label,
    'aria-disabled': disabled,
    'aria-pressed': pressed,
    role: 'button',
    tabIndex: disabled ? -1 : 0,
  }
}
