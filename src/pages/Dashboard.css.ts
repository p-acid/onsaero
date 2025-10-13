import { style } from '@vanilla-extract/css'
import theme from '../styles/theme.css'

export const container = style({
  minHeight: '100vh',
  backgroundColor: theme.colors.background,
  padding: theme.space.xl,

  '@media': {
    '(min-width: 768px)': {
      padding: theme.space['2xl'],
    },
  },
})

export const header = style({
  marginBottom: theme.space['2xl'],
})

export const title = style({
  fontSize: theme.fontSize['3xl'],
  fontWeight: theme.fontWeight.bold,
  color: theme.colors.text,
  marginBottom: theme.space.sm,
  margin: 0,

  '@media': {
    '(min-width: 768px)': {
      fontSize: theme.fontSize['4xl'],
    },
  },
})

export const subtitle = style({
  fontSize: theme.fontSize.lg,
  color: theme.colors.textSecondary,
  margin: 0,
})

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.space['2xl'],
  maxWidth: '1400px',
})

export const chartSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.space.xl,
})

export const errorContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '400px',
  gap: theme.space.md,
  padding: theme.space.xl,
  textAlign: 'center',
})

export const errorTitle = style({
  fontSize: theme.fontSize['2xl'],
  fontWeight: theme.fontWeight.semibold,
  color: theme.colors.error,
  margin: 0,
})

export const errorMessage = style({
  fontSize: theme.fontSize.base,
  color: theme.colors.textSecondary,
  maxWidth: '500px',
  margin: 0,
})

export const retryButton = style({
  padding: `${theme.space.md} ${theme.space.xl}`,
  fontSize: theme.fontSize.base,
  fontWeight: theme.fontWeight.medium,
  color: '#ffffff',
  backgroundColor: theme.colors.primary,
  border: 'none',
  borderRadius: theme.radius.md,
  cursor: 'pointer',
  transition: `all ${theme.transition.fast}`,

  ':hover': {
    backgroundColor: theme.colors.primaryHover,
    transform: 'translateY(-1px)',
    boxShadow: theme.shadow.md,
  },

  ':active': {
    transform: 'translateY(0)',
  },

  ':focus-visible': {
    outline: `2px solid ${theme.colors.primary}`,
    outlineOffset: '2px',
  },
})
