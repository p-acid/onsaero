import type { Task } from '../../lib/types';
import * as styles from './TaskItem.css';

interface TaskItemProps {
  task: Task;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const TaskItem = ({ task, onToggle, onDelete }: TaskItemProps) => {
  const handleToggle = () => {
    onToggle?.(task.id);
  };

  const handleDelete = () => {
    onDelete?.(task.id);
  };

  return (
    <div className={`${styles.taskItem} ${task.completed ? styles.completed : ''}`}>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleToggle}
          className={styles.checkbox}
          aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
        />
        <span className={styles.customCheckbox} />
      </label>

      <span className={styles.title}>{task.title}</span>

      {onDelete && (
        <button
          onClick={handleDelete}
          className={styles.deleteButton}
          aria-label={`Delete task "${task.title}"`}
          title="Delete task"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 4L4 12M4 4L12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
