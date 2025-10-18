import * as styles from './index.css'

export const LandingPage = () => {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.title}>Onsaero</h1>
          <p className={styles.subtitle}>
            Stay productive with effortless task management
          </p>
          <p className={styles.description}>
            Capture your to-dos instantly every time you open a new tab. Track
            your progress, visualize your productivity, and stay focused on what
            matters most.
          </p>

          <div className={styles.featuresGrid}>
            <div>
              <h3 className={styles.featureTitle}>⚡ Instant Capture</h3>
              <p className={styles.featureText}>
                Add tasks quickly every time you open a new tab
              </p>
            </div>
            <div>
              <h3 className={styles.featureTitle}>📊 Track Progress</h3>
              <p className={styles.featureText}>
                Visualize your productivity with beautiful charts
              </p>
            </div>
            <div>
              <h3 className={styles.featureTitle}>🔄 Always Synced</h3>
              <p className={styles.featureText}>
                Access your tasks across all your devices
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
