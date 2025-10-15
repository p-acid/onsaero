import type { RecipeVariants } from '@vanilla-extract/recipes'
import clsx from 'clsx'
import type { ComponentProps } from 'react'
import * as styles from './Button.css'

type VariantProps = Exclude<RecipeVariants<typeof styles.button>, undefined>

interface ButtonProps extends ComponentProps<'button'>, VariantProps {}

export const Button = ({
  children,
  className,
  size,
  variant,
  ...props
}: ButtonProps) => {
  return (
    <button
      type="button"
      className={clsx(styles.button({ size, variant }), className)}
      {...props}
    >
      {children}
    </button>
  )
}
