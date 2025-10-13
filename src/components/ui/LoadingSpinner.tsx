import { spinner, spinnerContainer, spinnerText } from './LoadingSpinner.css'

interface LoadingSpinnerProps {
  text?: string
  size?: 'small' | 'medium' | 'large'
}

export function LoadingSpinner({
  text = 'Loading...',
  size = 'medium',
}: LoadingSpinnerProps) {
  return (
    <div className={spinnerContainer}>
      <div className={spinner} data-size={size} />
      {text && <p className={spinnerText}>{text}</p>}
    </div>
  )
}
