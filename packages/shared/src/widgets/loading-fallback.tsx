import { Loader } from '../shared/ui'
import * as styles from './loading-fallback.css'

interface LoadingFallbackProps {
  text: string
}

export const LoadingFallback = ({ text }: LoadingFallbackProps) => {
  return (
    <div className={styles.container}>
      <Loader />
      <div className={styles.text}>{text}</div>
    </div>
  )
}
