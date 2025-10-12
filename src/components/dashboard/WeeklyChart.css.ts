import { style, keyframes } from '@vanilla-extract/css';
import theme from '../../styles/theme.css';

export const container = style({
  padding: theme.space.xl,
  backgroundColor: theme.colors.surface,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.lg,
});

export const title = style({
  fontSize: theme.fontSize.lg,
  fontWeight: theme.fontWeight.semibold,
  color: theme.colors.text,
  marginBottom: theme.space.md,
  margin: 0,
});

export const loadingContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '300px',
  gap: theme.space.md,
});

const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

export const spinner = style({
  width: '40px',
  height: '40px',
  border: `4px solid ${theme.colors.border}`,
  borderTop: `4px solid ${theme.colors.primary}`,
  borderRadius: '50%',
  animation: `${spin} 1s linear infinite`,
});

export const loadingText = style({
  fontSize: theme.fontSize.sm,
  color: theme.colors.textSecondary,
  margin: 0,
});

export const emptyText = style({
  textAlign: 'center',
  fontSize: theme.fontSize.base,
  color: theme.colors.textSecondary,
  padding: theme.space['2xl'],
  margin: 0,
});
