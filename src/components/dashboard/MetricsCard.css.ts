import { style } from '@vanilla-extract/css'
import theme from '../../styles/theme.css'

export const card = style({
  display: 'flex',
  gap: theme.space.md,
  padding: theme.space.xl,
  backgroundColor: theme.colors.surface,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.lg,
  transition: `all ${theme.transition.base}`,

  ':hover': {
    boxShadow: theme.shadow.md,
    borderColor: theme.colors.primary,
  },
})

export const iconContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: theme.radius.md,
  backgroundColor: theme.colors.primaryLight,
  color: theme.colors.primary,
  flexShrink: 0,
})

export const content = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.space.xs,
})

export const title = style({
  fontSize: theme.fontSize.sm,
  fontWeight: theme.fontWeight.medium,
  color: theme.colors.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  margin: 0,
})

export const value = style({
  fontSize: theme.fontSize['3xl'],
  fontWeight: theme.fontWeight.bold,
  color: theme.colors.text,
  lineHeight: theme.lineHeight.tight,
})

export const subtitle = style({
  fontSize: theme.fontSize.sm,
  color: theme.colors.textTertiary,
  margin: 0,
})

export const trend = style({
  display: 'flex',
  alignItems: 'center',
  gap: theme.space.xs,
  fontSize: theme.fontSize.sm,
  fontWeight: theme.fontWeight.medium,
  marginTop: theme.space.xs,
})

export const trendIcon = style({
  fontSize: theme.fontSize.lg,
  lineHeight: 1,
})

export const trendValue = style({
  fontVariantNumeric: 'tabular-nums',
})

export const trendPositive = style({
  color: theme.colors.success,
})

export const trendNegative = style({
  color: theme.colors.error,
})
