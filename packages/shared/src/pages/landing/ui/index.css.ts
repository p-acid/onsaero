import { style } from '@vanilla-extract/css'

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: 'var(--color-background, #f5f5f5)',
})

export const main = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
})

export const contentWrapper = style({
  maxWidth: '600px',
  textAlign: 'center',
})

export const title = style({
  fontSize: '48px',
  fontWeight: 700,
  color: 'var(--color-text-primary, #1a1a1a)',
  margin: '0 0 16px 0',
  letterSpacing: '-0.02em',
})

export const subtitle = style({
  fontSize: '20px',
  color: 'var(--color-text-secondary, #666)',
  margin: '0 0 32px 0',
  lineHeight: 1.6,
})

export const description = style({
  fontSize: '16px',
  color: 'var(--color-text-secondary, #666)',
  margin: '0 0 40px 0',
  lineHeight: 1.6,
})

export const featuresGrid = style({
  marginTop: '64px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '24px',
  textAlign: 'left',
})

export const featureTitle = style({
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--color-text-primary, #1a1a1a)',
  margin: '0 0 8px 0',
})

export const featureText = style({
  fontSize: '14px',
  color: 'var(--color-text-secondary, #666)',
  margin: 0,
  lineHeight: 1.5,
})
