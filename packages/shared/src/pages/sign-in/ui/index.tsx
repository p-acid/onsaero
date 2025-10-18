import * as styles from './index.css'
import { LoginButton } from './login-button'

export const SignInPage = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Onsaero</h1>
          <p className={styles.subtitle}>Task management for productivity</p>
        </div>

        <div className={styles.buttonWrapper}>
          <LoginButton />
        </div>
      </div>
    </div>
  )
}
