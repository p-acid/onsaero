import { style, keyframes } from '@vanilla-extract/css'
import { theme } from '../../styles/theme.css'

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
})

export const spinnerContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.space.md,
  padding: theme.space.xl,
})

export const spinner = style({
  border: `3px solid ${theme.color.border}`,
  borderTop: `3px solid ${theme.color.primary}`,
  borderRadius: theme.radius.full,
  animation: `${spin} 0.8s linear infinite`,

  selectors: {
    '&[data-size="small"]': {
      width: '20px',
      height: '20px',
    },
    '&[data-size="medium"]': {
      width: '40px',
      height: '40px',
    },
    '&[data-size="large"]': {
      width: '60px',
      height: '60px',
    },
  },
})

export const spinnerText = style({
  fontSize: theme.fontSize.sm,
  color: theme.color.textSecondary,
  margin: 0,
})
