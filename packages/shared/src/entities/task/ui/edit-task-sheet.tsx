import type { Task, UpdateTask } from '@onsaero-shared/entities/task'
import type { ReactNode } from 'react'
import { TaskFormSheet, type TaskFormValues } from './task-form-sheet'

export interface EditTaskSheetProps {
  task: Task
  onUpdateTask: (taskData: UpdateTask, onSuccess: () => void) => Promise<void>
  isUpdating: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger?: ReactNode
}

export const EditTaskSheet = ({
  task,
  onUpdateTask,
  isUpdating,
  open,
  onOpenChange,
  trigger,
}: EditTaskSheetProps) => {
  const handleSubmit = async (data: TaskFormValues, onSuccess: () => void) => {
    const taskData: UpdateTask = {
      id: task.id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      status: data.status || null,
      priority: data.priority || null,
      started_at: data.started_at || null,
      due_date: data.due_date || null,
    }

    await onUpdateTask(taskData, onSuccess)
  }

  return (
    <TaskFormSheet
      title="Edit Task"
      description="Update the task information."
      submitText={isUpdating ? 'Updating...' : 'Update Task'}
      onSubmit={handleSubmit}
      open={open}
      onOpenChange={onOpenChange}
      isSubmitting={isUpdating}
      trigger={trigger}
      defaultValues={{
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        started_at: task.started_at,
        due_date: task.due_date,
      }}
    />
  )
}
