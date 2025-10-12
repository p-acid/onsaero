import { globalStyle } from '@vanilla-extract/css'
import { theme } from './theme.css'

// Reset and base styles
globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
})

globalStyle('html, body', {
  height: '100%',
  width: '100%',
})

globalStyle('body', {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: theme.fontSize.base,
  fontWeight: theme.fontWeight.normal,
  lineHeight: theme.lineHeight.normal,
  color: theme.color.text,
  backgroundColor: theme.color.background,
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
})

globalStyle('#root', {
  height: '100%',
  width: '100%',
})

globalStyle('button', {
  fontFamily: 'inherit',
  cursor: 'pointer',
})

globalStyle('input, textarea', {
  fontFamily: 'inherit',
})

globalStyle('a', {
  color: theme.color.primary,
  textDecoration: 'none',
})

globalStyle('a:hover', {
  color: theme.color.primaryHover,
})
