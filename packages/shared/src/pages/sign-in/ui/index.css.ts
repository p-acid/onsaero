import { style } from '@vanilla-extract/css'

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '20px',
  backgroundColor: 'var(--color-background, #f5f5f5)',
})

export const card = style({
  maxWidth: '400px',
  width: '100%',
  backgroundColor: 'var(--color-surface, white)',
  borderRadius: '8px',
  padding: '32px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
})

export const header = style({
  textAlign: 'center',
  marginBottom: '24px',
})

export const title = style({
  fontSize: '28px',
  fontWeight: 600,
  color: 'var(--color-text-primary, #1a1a1a)',
  margin: '0 0 8px 0',
})

export const subtitle = style({
  fontSize: '14px',
  color: 'var(--color-text-secondary, #666)',
  margin: 0,
})

export const buttonWrapper = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
})
