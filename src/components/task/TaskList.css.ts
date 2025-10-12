import { style } from '@vanilla-extract/css';
import theme from '../../styles/theme.css';

export const container = style({
  width: '100%',
});

export const list = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.space.md,
});

export const listItem = style({
  width: '100%',
});
