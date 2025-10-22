import type { Task, UpdateTask } from '@onsaero-shared/entities/task'
import { EditTaskSheet } from '@onsaero-shared/entities/task'
import { cn } from '@onsaero-shared/shared/lib'
import { Button, Input } from '@onsaero-shared/shared/ui'
import { PanelRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface TaskTitleCellProps {
  task: Task
  onUpdateTitle: (taskId: string, title: string) => void
  onUpdateTask: (taskData: UpdateTask, onSuccess: () => void) => Promise<void>
  isUpdating: boolean
  isCompleted?: boolean
}

export const TaskTitleCell = ({
  task,
  onUpdateTitle,
  onUpdateTask,
  isUpdating,
  isCompleted = false,
}: TaskTitleCellProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(task.title)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true)
      setEditValue(task.title)
    }
  }

  const handleBlur = () => {
    if (isEditing) {
      const trimmedValue = editValue.trim()
      if (trimmedValue && trimmedValue !== task.title) {
        onUpdateTitle(task.id, trimmedValue)
      } else {
        setEditValue(task.title)
      }
      setIsEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      setEditValue(task.title)
      setIsEditing(false)
    }
  }

  const handleEditButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsSheetOpen(true)
  }

  return (
    <div className="group relative flex items-center gap-2">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-7 w-full px-2 py-1"
          disabled={isUpdating}
        />
      ) : (
        <>
          <button
            type="button"
            onClick={handleClick}
            className={cn(
              'flex-1 cursor-text text-left transition-colors hover:text-foreground',
              isCompleted && 'text-muted-foreground line-through',
            )}
          >
            {task.title}
          </button>

          <Button
            className="hidden size-7 group-hover:inline-flex"
            variant="outline"
            size="icon-sm"
            title="Edit task"
            onClick={handleEditButtonClick}
          >
            <PanelRight className="size-3.5" />
          </Button>
        </>
      )}
      <EditTaskSheet
        task={task}
        onUpdateTask={onUpdateTask}
        isUpdating={isUpdating}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  )
}
