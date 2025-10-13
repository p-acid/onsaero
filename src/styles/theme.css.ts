import { createTheme } from '@vanilla-extract/css'

// Color palette
export const colors = {
  // Primary
  primary: '#4F46E5',
  primaryHover: '#4338CA',
  primaryLight: '#EEF2FF',

  // Neutral
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceHover: '#F3F4F6',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  // Task states
  taskActive: '#FFFFFF',
  taskCompleted: '#F3F4F6',
  taskBorder: '#E5E7EB',
  taskHover: '#F9FAFB',
}

// Spacing scale (rem units)
export const space = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '0.75rem', // 12px
  lg: '1rem', // 16px
  xl: '1.5rem', // 24px
  '2xl': '2rem', // 32px
  '3xl': '3rem', // 48px
  '4xl': '4rem', // 64px
}

// Typography
export const fontSize = {
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  base: '1rem', // 16px
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
}

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
}

export const lineHeight = {
  tight: '1.25',
  normal: '1.5',
  relaxed: '1.75',
}

// Border radius
export const radius = {
  none: '0',
  sm: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  full: '9999px',
}

// Shadows
export const shadow = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
}

// Transitions
export const transition = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
}

// Z-index scale
export const zIndex = {
  base: '0',
  dropdown: '1000',
  sticky: '1100',
  overlay: '1200',
  modal: '1300',
  popover: '1400',
  tooltip: '1500',
}

// Breakpoints (for media queries)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

// Create default theme
export const [themeClass, theme] = createTheme({
  color: colors,
  space,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  shadow,
  transition,
  zIndex,
})

// Export theme variables for consumption
export default {
  colors,
  space,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  shadow,
  transition,
  zIndex,
  breakpoints,
}
