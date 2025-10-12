import { style } from '@vanilla-extract/css'
import { theme } from '../../styles/theme.css'

export const errorContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.space['3xl'],
  minHeight: '400px',
  textAlign: 'center',
})

export const errorTitle = style({
  fontSize: theme.fontSize.xl,
  fontWeight: theme.fontWeight.semibold,
  color: theme.color.error,
  marginBottom: theme.space.md,
})

export const errorMessage = style({
  fontSize: theme.fontSize.base,
  color: theme.color.textSecondary,
  marginBottom: theme.space.xl,
  maxWidth: '500px',
})

export const errorButton = style({
  padding: `${theme.space.md} ${theme.space.xl}`,
  fontSize: theme.fontSize.base,
  fontWeight: theme.fontWeight.medium,
  color: theme.color.background,
  backgroundColor: theme.color.primary,
  border: 'none',
  borderRadius: theme.radius.md,
  cursor: 'pointer',
  transition: theme.transition.base,

  ':hover': {
    backgroundColor: theme.color.primaryHover,
  },
})
