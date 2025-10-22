import type { Task } from '@onsaero-shared/entities/task'
import type { Database } from '@onsaero-shared/shared/types'
import { Button, Separator } from '@onsaero-shared/shared/ui'
import { CheckCircle2, Circle, Trash2, XCircle } from 'lucide-react'

type TaskStatus = Database['public']['Enums']['task_status']

interface TasksGroupActionsProps {
  selectedTasks: Task[]
  onUpdateStatus: (taskIds: string[], status: TaskStatus) => void
  onDelete: (taskIds: string[]) => void
  isUpdating?: boolean
  isDeleting?: boolean
}

export const TasksGroupActions = ({
  selectedTasks,
  onUpdateStatus,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}: TasksGroupActionsProps) => {
  const selectedCount = selectedTasks.length

  const handleDelete = () => {
    const taskIds = selectedTasks.map((task) => task.id)
    onDelete(taskIds)
  }

  const handleMarkAsCompleted = () => {
    const taskIds = selectedTasks.map((task) => task.id)
    onUpdateStatus(taskIds, 'completed')
  }

  const isDisabled = isUpdating || isDeleting

  return (
    <div className="mx-3 flex h-10 items-center rounded-lg border bg-muted/50 px-3.5 py-1">
      <span className="pr-3 font-medium text-muted-foreground text-sm">
        {selectedCount === 0 ? 'Not selected' : `${selectedCount} selected`}
      </span>
      {selectedCount > 0 && (
        <>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAsCompleted}
            disabled={isDisabled}
          >
            Complete
          </Button>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDisabled}
          >
            Delete
          </Button>
        </>
      )}
    </div>
  )
}
