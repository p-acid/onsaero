import { style } from '@vanilla-extract/css'
import { recipe } from '@vanilla-extract/recipes'
import { vars } from '../../theme/theme.css'

const base = style({
  borderRadius: 4,
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
})

export const button = recipe({
  base,
  variants: {
    variant: {
      brandSolid: {
        backgroundColor: vars.colors.brand[500],
        color: vars.colors.neutral[50],
        border: 'none',
      },
      brandOutline: {
        backgroundColor: 'transparent',
        color: vars.colors.brand[500],
        border: `1px solid ${vars.colors.brand[500]}`,
      },
      neutralSolid: {
        backgroundColor: vars.colors.neutral[300],
        color: vars.colors.neutral[900],
        border: 'none',
      },
      neutralOutline: {
        backgroundColor: 'transparent',
        color: vars.colors.neutral[900],
        border: `1px solid ${vars.colors.neutral[900]}`,
      },
    },
    size: {
      small: { fontSize: 12, padding: '4px 8px' },
      medium: { fontSize: 14, padding: '8px 16px' },
      large: { fontSize: 16, padding: '12px 24px' },
    },
  },
  defaultVariants: {
    variant: 'brandSolid',
    size: 'medium',
  },
})
