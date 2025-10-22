import type { CreateTask } from '@onsaero-shared/entities/task'
import { Button, SheetTrigger } from '@onsaero-shared/shared/ui'
import { useState } from 'react'
import { TaskFormSheet, type TaskFormValues } from './task-form-sheet'

export interface AddTaskSheetProps {
  onAddTask: (
    taskData: Omit<CreateTask, 'user_id'>,
    onSuccess: () => void,
  ) => Promise<void>
  isAdding: boolean
}

export const AddTaskSheet = ({ onAddTask, isAdding }: AddTaskSheetProps) => {
  const [open, setOpen] = useState(false)

  const handleSubmit = async (data: TaskFormValues, onSuccess: () => void) => {
    const taskData: Omit<CreateTask, 'user_id'> = {
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      status: data.status || undefined,
      priority: data.priority || undefined,
      started_at: data.started_at || undefined,
      due_date: data.due_date || undefined,
    }

    await onAddTask(taskData, onSuccess)
  }

  return (
    <TaskFormSheet
      title="Add New Task"
      description="Create a new task to add to your list."
      submitText={isAdding ? 'Adding...' : 'Add Task'}
      onSubmit={handleSubmit}
      open={open}
      onOpenChange={setOpen}
      isSubmitting={isAdding}
      trigger={
        <SheetTrigger asChild>
          <Button variant="outline">Add Task</Button>
        </SheetTrigger>
      }
    />
  )
}
