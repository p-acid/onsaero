import { style } from '@vanilla-extract/css'
import { theme } from '../styles/theme.css'

export const popupContainer = style({
  padding: theme.space.lg,
  backgroundColor: theme.color.background,
  color: theme.color.text,
  minHeight: '200px',
})

export const popupHeader = style({
  marginBottom: theme.space.lg,
  borderBottom: `1px solid ${theme.color.border}`,
  paddingBottom: theme.space.md,
})

export const popupTitle = style({
  fontSize: '18px',
  fontWeight: 600,
  margin: 0,
  color: theme.color.primary,
})

export const quickStats = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: theme.space.md,
  marginBottom: theme.space.lg,
})

export const statItem = style({
  textAlign: 'center',
  padding: theme.space.md,
  backgroundColor: theme.color.surface,
  borderRadius: theme.radius.md,
  border: `1px solid ${theme.color.border}`,
})

export const statValue = style({
  fontSize: '24px',
  fontWeight: 700,
  color: theme.color.primary,
  marginBottom: theme.space.xs,
})

export const statLabel = style({
  fontSize: '12px',
  color: theme.color.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
})

export const actionButtons = style({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.space.sm,
})

export const actionButton = style({
  padding: `${theme.space.sm} ${theme.space.md}`,
  backgroundColor: theme.color.primary,
  color: 'white',
  border: 'none',
  borderRadius: theme.radius.sm,
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s',

  ':hover': {
    backgroundColor: theme.color.primaryHover,
    transform: 'translateY(-1px)',
  },

  ':active': {
    transform: 'translateY(0)',
  },
})
