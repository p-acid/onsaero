import { style, keyframes } from '@vanilla-extract/css';
import theme from '../styles/theme.css';

export const container = style({
  minHeight: '100vh',
  backgroundColor: theme.colors.background,
  padding: theme.space.xl,
  display: 'flex',
  justifyContent: 'center',
});

export const content = style({
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto',
});

export const header = style({
  textAlign: 'center',
  marginBottom: theme.space['3xl'],
  paddingTop: theme.space['2xl'],
});

export const headerContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.space.xl,
  alignItems: 'center',

  '@media': {
    '(min-width: 768px)': {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
  },
});

export const viewToggle = style({
  display: 'flex',
  gap: theme.space.xs,
  padding: theme.space.xs,
  backgroundColor: theme.colors.surface,
  borderRadius: theme.radius.lg,
  border: `1px solid ${theme.colors.border}`,
});

export const viewToggleButton = style({
  display: 'flex',
  alignItems: 'center',
  gap: theme.space.sm,
  padding: `${theme.space.sm} ${theme.space.md}`,
  fontSize: theme.fontSize.sm,
  fontWeight: theme.fontWeight.medium,
  color: theme.colors.textSecondary,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: theme.radius.md,
  cursor: 'pointer',
  transition: `all ${theme.transition.fast}`,
  whiteSpace: 'nowrap',

  ':hover': {
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },

  ':focus-visible': {
    outline: `2px solid ${theme.colors.primary}`,
    outlineOffset: '2px',
  },
});

export const viewToggleButtonActive = style({
  color: theme.colors.primary,
  backgroundColor: theme.colors.background,
  fontWeight: theme.fontWeight.semibold,
  boxShadow: theme.shadow.sm,
});

export const title = style({
  margin: 0,
  marginBottom: theme.space.md,
  fontSize: theme.fontSize['3xl'],
  fontWeight: theme.fontWeight.bold,
  color: theme.colors.text,
  letterSpacing: '-0.025em',
});

export const subtitle = style({
  margin: 0,
  fontSize: theme.fontSize.lg,
  fontWeight: theme.fontWeight.normal,
  color: theme.colors.textSecondary,
});

export const main = style({
  width: '100%',
});

export const taskSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.space['2xl'],
});

export const activeTasks = style({
  width: '100%',
});

export const completedTasks = style({
  width: '100%',
});

export const sectionTitle = style({
  margin: 0,
  marginBottom: theme.space.lg,
  fontSize: theme.fontSize.lg,
  fontWeight: theme.fontWeight.semibold,
  color: theme.colors.text,
});

// Loading state
const spin = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

export const loadingContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.space['4xl'],
  gap: theme.space.xl,
});

export const spinner = style({
  width: '48px',
  height: '48px',
  border: `4px solid ${theme.colors.surface}`,
  borderTop: `4px solid ${theme.colors.primary}`,
  borderRadius: '50%',
  animation: `${spin} 1s linear infinite`,
});

export const loadingText = style({
  margin: 0,
  fontSize: theme.fontSize.base,
  color: theme.colors.textSecondary,
});

// Error state
export const errorContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.space['4xl'],
  gap: theme.space.xl,
  textAlign: 'center',
});

export const errorTitle = style({
  margin: 0,
  fontSize: theme.fontSize['2xl'],
  fontWeight: theme.fontWeight.semibold,
  color: theme.colors.error,
});

export const errorMessage = style({
  margin: 0,
  fontSize: theme.fontSize.base,
  color: theme.colors.textSecondary,
  maxWidth: '400px',
});

export const retryButton = style({
  padding: `${theme.space.md} ${theme.space.xl}`,
  fontSize: theme.fontSize.base,
  fontWeight: theme.fontWeight.semibold,
  color: theme.colors.background,
  backgroundColor: theme.colors.primary,
  border: 'none',
  borderRadius: theme.radius.lg,
  cursor: 'pointer',
  transition: `all ${theme.transition.base}`,

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
});

// Toast notifications
const slideIn = keyframes({
  '0%': {
    transform: 'translateX(100%)',
    opacity: 0,
  },
  '100%': {
    transform: 'translateX(0)',
    opacity: 1,
  },
});

export const toast = style({
  position: 'fixed',
  bottom: theme.space.xl,
  right: theme.space.xl,
  padding: `${theme.space.md} ${theme.space.xl}`,
  backgroundColor: theme.colors.error,
  color: theme.colors.background,
  borderRadius: theme.radius.lg,
  boxShadow: theme.shadow.lg,
  fontSize: theme.fontSize.sm,
  fontWeight: theme.fontWeight.medium,
  animation: `${slideIn} 0.3s ease-out`,
  zIndex: theme.zIndex.popover,
});
