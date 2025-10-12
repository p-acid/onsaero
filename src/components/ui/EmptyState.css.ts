import { style } from '@vanilla-extract/css';
import theme from '../../styles/theme.css';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.space['4xl'],
  textAlign: 'center',
});

export const icon = style({
  marginBottom: theme.space.xl,
  fontSize: theme.fontSize['4xl'],
  color: theme.colors.textTertiary,
});

export const title = style({
  margin: 0,
  marginBottom: theme.space.md,
  fontSize: theme.fontSize.xl,
  fontWeight: theme.fontWeight.semibold,
  color: theme.colors.textSecondary,
});

export const description = style({
  margin: 0,
  fontSize: theme.fontSize.base,
  color: theme.colors.textTertiary,
  maxWidth: '400px',
});
