import { style } from '@vanilla-extract/css'
import { theme } from '../../styles/theme.css'

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: theme.color.background,
})

export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.space['2xl'],
  borderBottom: `1px solid ${theme.color.border}`,
  backgroundColor: theme.color.surface,
})

export const errorContainer = style({
  maxWidth: '800px',
  width: '100%',
  margin: '0 auto',
  padding: `0 ${theme.space['2xl']}`,
})

export const main = style({
  flex: 1,
  padding: theme.space['2xl'],
  maxWidth: '800px',
  width: '100%',
  margin: '0 auto',
})

export const footer = style({
  padding: theme.space.xl,
  borderTop: `1px solid ${theme.color.border}`,
  backgroundColor: theme.color.surface,
  textAlign: 'center',
})
