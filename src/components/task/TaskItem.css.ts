import { style } from '@vanilla-extract/css';
import theme from '../../styles/theme.css';

export const taskItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: theme.space.md,
  padding: theme.space.lg,
  backgroundColor: theme.colors.taskActive,
  border: `1px solid ${theme.colors.taskBorder}`,
  borderRadius: theme.radius.lg,
  transition: `all ${theme.transition.base}`,

  ':hover': {
    backgroundColor: theme.colors.taskHover,
    boxShadow: theme.shadow.sm,
  },
});

export const completed = style({
  backgroundColor: theme.colors.taskCompleted,
  opacity: 0.7,
});

export const checkboxLabel = style({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  position: 'relative',
  flexShrink: 0,
});

export const checkbox = style({
  position: 'absolute',
  opacity: 0,
  cursor: 'pointer',
  width: '20px',
  height: '20px',
});

export const customCheckbox = style({
  width: '20px',
  height: '20px',
  border: `2px solid ${theme.colors.border}`,
  borderRadius: theme.radius.sm,
  backgroundColor: theme.colors.background,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: `all ${theme.transition.fast}`,

  selectors: {
    [`${checkbox}:checked + &`]: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },

    [`${checkbox}:checked + &::after`]: {
      content: '""',
      display: 'block',
      width: '5px',
      height: '10px',
      border: 'solid white',
      borderWidth: '0 2px 2px 0',
      transform: 'rotate(45deg)',
      marginBottom: '2px',
    },

    [`${checkbox}:focus-visible + &`]: {
      outline: `2px solid ${theme.colors.primary}`,
      outlineOffset: '2px',
    },

    [`${checkboxLabel}:hover &`]: {
      borderColor: theme.colors.primary,
    },
  },
});

export const title = style({
  flex: 1,
  fontSize: theme.fontSize.base,
  fontWeight: theme.fontWeight.normal,
  lineHeight: theme.lineHeight.normal,
  color: theme.colors.text,
  wordBreak: 'break-word',
  transition: `all ${theme.transition.fast}`,

  selectors: {
    [`${completed} &`]: {
      textDecoration: 'line-through',
      color: theme.colors.textSecondary,
    },
  },
});

export const deleteButton = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  padding: theme.space.sm,
  color: theme.colors.textSecondary,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: theme.radius.md,
  cursor: 'pointer',
  transition: `all ${theme.transition.fast}`,
  flexShrink: 0,

  ':hover': {
    color: theme.colors.error,
    backgroundColor: theme.colors.errorLight,
  },

  ':focus-visible': {
    outline: `2px solid ${theme.colors.error}`,
    outlineOffset: '2px',
  },
});
