import * as styles from './EmptyState.css'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
}

export const EmptyState = ({
  title = 'No tasks yet',
  description = 'Add your first task to get started',
  icon,
}: EmptyStateProps) => {
  return (
    <div className={styles.container} role="status" aria-live="polite">
      {icon && <div className={styles.icon}>{icon}</div>}
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
    </div>
  )
}
