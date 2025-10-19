import * as styles from './loading-fallback.css'

interface LoadingFallbackProps {
  text: string
}

export const LoadingFallback = ({ text }: LoadingFallbackProps) => {
  return (
    <div className={styles.container}>
      <div /> {/* Loading */}
      <div className={styles.text}>{text}</div>
    </div>
  )
}
