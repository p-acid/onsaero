import type { Task } from '../../lib/types'
import { TaskItem } from './TaskItem'
import * as styles from './TaskList.css'

interface TaskListProps {
  tasks: Task[]
  onToggle?: (id: string) => void
  onDelete?: (id: string) => void
  showCompleted?: boolean
}

export const TaskList = ({
  tasks,
  onToggle,
  onDelete,
  showCompleted = true,
}: TaskListProps) => {
  const filteredTasks = showCompleted
    ? tasks
    : tasks.filter((task) => !task.completed)

  if (filteredTasks.length === 0) {
    return null
  }

  return (
    <div className={styles.container}>
      <ul className={styles.list} role="list">
        {filteredTasks.map((task) => (
          <li key={task.id} className={styles.listItem}>
            <TaskItem task={task} onToggle={onToggle} onDelete={onDelete} />
          </li>
        ))}
      </ul>
    </div>
  )
}
