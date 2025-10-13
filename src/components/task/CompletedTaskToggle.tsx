import * as styles from './CompletedTaskToggle.css'

interface CompletedTaskToggleProps {
  showCompleted: boolean
  onToggle: (show: boolean) => void
  completedCount: number
}

export const CompletedTaskToggle = ({
  showCompleted,
  onToggle,
  completedCount,
}: CompletedTaskToggleProps) => {
  if (completedCount === 0) {
    return null
  }

  return (
    <button
      onClick={() => onToggle(!showCompleted)}
      className={styles.toggle}
      aria-label={
        showCompleted ? 'Hide completed tasks' : 'Show completed tasks'
      }
      aria-expanded={showCompleted}
    >
      <span className={styles.icon}>{showCompleted ? '▼' : '▶'}</span>
      <span>
        Completed <span className={styles.count}>({completedCount})</span>
      </span>
    </button>
  )
}
