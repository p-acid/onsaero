import { style } from '@vanilla-extract/css'
import theme from '../../styles/theme.css'

export const toggle = style({
  display: 'flex',
  alignItems: 'center',
  gap: theme.space.sm,
  padding: `${theme.space.sm} ${theme.space.md}`,
  marginTop: theme.space.lg,
  marginBottom: theme.space.md,
  fontSize: theme.fontSize.sm,
  fontWeight: theme.fontWeight.medium,
  color: theme.colors.textSecondary,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: theme.radius.md,
  cursor: 'pointer',
  transition: `all ${theme.transition.fast}`,
  userSelect: 'none',

  selectors: {
    '&:hover': {
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },

    '&:focus-visible': {
      outline: `2px solid ${theme.colors.primary}`,
      outlineOffset: '2px',
    },
  },
})

export const icon = style({
  fontSize: theme.fontSize.xs,
  transition: `transform ${theme.transition.fast}`,
})

export const count = style({
  color: theme.colors.textTertiary,
  fontWeight: theme.fontWeight.normal,
})
