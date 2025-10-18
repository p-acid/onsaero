import { keyframes, style } from '@vanilla-extract/css'

const move = keyframes({
  '0%, 5%': { left: '-32px', width: '16px' },
  '15%, 20%': { left: '-32px', width: '48px' },
  '30%, 35%': { left: '0px', width: '16px' },
  '45%, 50%': { left: '0px', width: '48px' },
  '60%, 65%': { left: '32px', width: '16px' },
  '75%, 80%': { left: '32px', width: '48px' },
  '95%, 100%': { left: '64px', width: '16px' },
})

export const loader = style({
  width: '16px',
  height: '16px',
  position: 'relative',
  left: '-32px',
  borderRadius: '50%',
  color: '#fff',
  background: 'currentColor',
  boxShadow: '32px 0, -32px 0, 64px 0',

  selectors: {
    '&::after': {
      content: "''",
      position: 'absolute',
      left: '-32px',
      top: 0,
      width: '16px',
      height: '16px',
      borderRadius: '10px',
      background: '#FF3D00',
      animation: `${move} 3s linear infinite alternate`,
    },
  },
})
