import { style } from '@vanilla-extract/css';
import theme from '../../styles/theme.css';

export const form = style({
  width: '100%',
  marginBottom: theme.space.xl,
});

export const inputWrapper = style({
  display: 'flex',
  gap: theme.space.md,
  alignItems: 'stretch',
});

export const input = style({
  flex: 1,
  padding: `${theme.space.md} ${theme.space.lg}`,
  fontSize: theme.fontSize.base,
  fontWeight: theme.fontWeight.normal,
  lineHeight: theme.lineHeight.normal,
  color: theme.colors.text,
  backgroundColor: theme.colors.background,
  border: `2px solid ${theme.colors.border}`,
  borderRadius: theme.radius.lg,
  outline: 'none',
  transition: `all ${theme.transition.base}`,

  '::placeholder': {
    color: theme.colors.textTertiary,
  },

  ':focus': {
    borderColor: theme.colors.primary,
    boxShadow: `0 0 0 3px ${theme.colors.primaryLight}`,
  },

  ':disabled': {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textSecondary,
    cursor: 'not-allowed',
  },
});

export const submitButton = style({
  padding: `${theme.space.md} ${theme.space.xl}`,
  fontSize: theme.fontSize.sm,
  fontWeight: theme.fontWeight.semibold,
  color: theme.colors.background,
  backgroundColor: theme.colors.primary,
  border: 'none',
  borderRadius: theme.radius.lg,
  cursor: 'pointer',
  transition: `all ${theme.transition.base}`,
  whiteSpace: 'nowrap',

  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: theme.colors.primaryHover,
      transform: 'translateY(-1px)',
      boxShadow: theme.shadow.md,
    },

    '&:active:not(:disabled)': {
      transform: 'translateY(0)',
    },

    '&:disabled': {
      backgroundColor: theme.colors.border,
      color: theme.colors.textSecondary,
      cursor: 'not-allowed',
    },

    '&:focus-visible': {
      outline: `2px solid ${theme.colors.primary}`,
      outlineOffset: '2px',
    },
  },
});

export const error = style({
  marginTop: theme.space.sm,
  padding: theme.space.sm,
  fontSize: theme.fontSize.sm,
  color: theme.colors.error,
  backgroundColor: theme.colors.errorLight,
  border: `1px solid ${theme.colors.error}`,
  borderRadius: theme.radius.md,
});
