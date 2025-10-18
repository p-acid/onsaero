import { style } from '@vanilla-extract/css'

export const container = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: '32px',
  minHeight: '100vh',
  backgroundColor: 'var(--color-background, #f5f5f5)',
})

export const text = style({
  fontSize: '14px',
  color: 'var(--color-text-secondary, #666)',
})
