import { useState, type FormEvent } from 'react';
import type { NewTask } from '../../lib/types';
import * as styles from './TaskInput.css';

interface TaskInputProps {
  onAdd: (task: NewTask) => void;
  isLoading?: boolean;
}

export const TaskInput = ({ onAdd, isLoading = false }: TaskInputProps) => {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();

    // Validation
    if (!trimmedTitle) {
      setError('Task title cannot be empty');
      return;
    }

    if (trimmedTitle.length > 500) {
      setError('Task title must be 500 characters or less');
      return;
    }

    // Clear error and submit
    setError('');
    onAdd({ title: trimmedTitle });
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError('');
          }}
          placeholder="What needs to be done?"
          className={styles.input}
          disabled={isLoading}
          maxLength={500}
          aria-label="Task title"
          aria-invalid={!!error}
          aria-describedby={error ? 'task-input-error' : undefined}
        />
        <button
          type="submit"
          disabled={isLoading || !title.trim()}
          className={styles.submitButton}
          aria-label="Add task"
        >
          {isLoading ? 'Adding...' : 'Add Task'}
        </button>
      </div>
      {error && (
        <div id="task-input-error" className={styles.error} role="alert">
          {error}
        </div>
      )}
    </form>
  );
};
