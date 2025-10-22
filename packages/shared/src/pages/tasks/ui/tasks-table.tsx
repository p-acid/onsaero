import type { Task, UpdateTask } from '@onsaero-shared/entities/task'
import {
  TaskDatePicker,
  TaskPrioritySelect,
  TaskStatusSelect,
  useUpdateTaskMutation,
} from '@onsaero-shared/entities/task'
import { cn } from '@onsaero-shared/shared/lib'
import type { Database } from '@onsaero-shared/shared/types'
import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@onsaero-shared/shared/ui'
import { useEffect, useState } from 'react'
import { TaskTitleCell } from './task-title-cell'

type TaskStatus = Database['public']['Enums']['task_status']
type TaskPriority = Database['public']['Enums']['task_priority']

interface TasksTableProps {
  tasks: Task[]
  selectedTaskIds?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

export const TasksTable = ({
  tasks,
  selectedTaskIds = [],
  onSelectionChange,
}: TasksTableProps) => {
  const [internalSelectedIds, setInternalSelectedIds] =
    useState<string[]>(selectedTaskIds)
  const updateTaskMutation = useUpdateTaskMutation()

  useEffect(() => {
    setInternalSelectedIds(selectedTaskIds)
  }, [selectedTaskIds])

  const selectedIds = onSelectionChange ? selectedTaskIds : internalSelectedIds
  const setSelectedIds = onSelectionChange || setInternalSelectedIds

  const isAllSelected = tasks.length > 0 && selectedIds.length === tasks.length
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(tasks.map((task) => task.id))
    }
  }

  const handleSelectRow = (taskId: string) => {
    if (selectedIds.includes(taskId)) {
      setSelectedIds(selectedIds.filter((id) => id !== taskId))
    } else {
      setSelectedIds([...selectedIds, taskId])
    }
  }

  const handleUpdateStatus = (taskId: string, status: TaskStatus) => {
    updateTaskMutation.mutate({ id: taskId, status })
  }

  const handleUpdatePriority = (
    taskId: string,
    priority: TaskPriority | null,
  ) => {
    updateTaskMutation.mutate({ id: taskId, priority })
  }

  const handleUpdateStartDate = (taskId: string, startDate: string | null) => {
    updateTaskMutation.mutate({ id: taskId, started_at: startDate })
  }

  const handleUpdateDueDate = (taskId: string, dueDate: string | null) => {
    updateTaskMutation.mutate({ id: taskId, due_date: dueDate })
  }

  const handleUpdateTitle = (taskId: string, title: string) => {
    updateTaskMutation.mutate({ id: taskId, title })
  }

  const handleUpdateTask = async (
    taskData: UpdateTask,
    onSuccess: () => void,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      updateTaskMutation.mutate(taskData, {
        onSuccess: () => {
          onSuccess()
          resolve()
        },
        onError: (error) => {
          reject(error)
        },
      })
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-t">
          <TableHead className="w-12 pl-5">
            <Checkbox
              checked={isSomeSelected ? 'indeterminate' : isAllSelected}
              onCheckedChange={handleSelectAll}
            />
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="w-32 px-4">Status</TableHead>
          <TableHead className="w-24 px-4">Priority</TableHead>
          <TableHead className="w-36 px-4">Start Date</TableHead>
          <TableHead className="w-36 px-4">Due Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const isSelected = selectedIds.includes(task.id)
          const isCompleted = task.status === 'completed'
          return (
            <TableRow
              key={task.id}
              className={cn('h-10', { 'bg-muted/50': isSelected })}
            >
              <TableCell className="pl-5">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleSelectRow(task.id)}
                />
              </TableCell>
              <TableCell>
                <TaskTitleCell
                  task={task}
                  onUpdateTitle={handleUpdateTitle}
                  onUpdateTask={handleUpdateTask}
                  isUpdating={updateTaskMutation.isPending}
                  isCompleted={isCompleted}
                />
              </TableCell>
              <TableCell>
                <TaskStatusSelect
                  value={task.status}
                  onChange={(status) => handleUpdateStatus(task.id, status)}
                  disabled={updateTaskMutation.isPending}
                  variant="table-cell"
                />
              </TableCell>
              <TableCell>
                <TaskPrioritySelect
                  value={task.priority}
                  onChange={(priority) =>
                    handleUpdatePriority(task.id, priority)
                  }
                  disabled={updateTaskMutation.isPending}
                  variant="table-cell"
                />
              </TableCell>
              <TableCell>
                <TaskDatePicker
                  value={task.started_at}
                  onChange={(date) => handleUpdateStartDate(task.id, date)}
                  disabled={updateTaskMutation.isPending}
                  variant="table-cell"
                />
              </TableCell>
              <TableCell>
                <TaskDatePicker
                  value={task.due_date}
                  onChange={(date) => handleUpdateDueDate(task.id, date)}
                  disabled={updateTaskMutation.isPending}
                  variant="table-cell"
                />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
