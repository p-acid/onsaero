import type { CreateTask } from '@onsaero-shared/entities/task'
import {
  AddTaskSheet,
  useAddTaskMutation,
  useDeleteTaskMutation,
  useTasksQuery,
  useUpdateTaskMutation,
} from '@onsaero-shared/entities/task'
import { useAuthContext } from '@onsaero-shared/shared/context'
import type { Database } from '@onsaero-shared/shared/types'
import { useMemo, useState } from 'react'
import { TasksGroupActions } from './tasks-group-actions'
import { TasksTable } from './tasks-table'

type TaskStatus = Database['public']['Enums']['task_status']

export const TasksPage = () => {
  const user = useAuthContext((state) => state.user)
  const { data: tasks = [], isLoading } = useTasksQuery(user?.id)
  const addTaskMutation = useAddTaskMutation()
  const updateTaskMutation = useUpdateTaskMutation()
  const deleteTaskMutation = useDeleteTaskMutation()
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])

  const selectedTasks = useMemo(
    () => tasks.filter((task) => selectedTaskIds.includes(task.id)),
    [tasks, selectedTaskIds],
  )

  const handleAddTask = async (
    taskData: Omit<CreateTask, 'user_id'>,
    onSuccess?: () => void,
  ): Promise<void> => {
    if (!taskData.title.trim() || !user?.id) {
      throw new Error('Title and user ID are required')
    }

    return addTaskMutation
      .mutateAsync({
        ...taskData,
        user_id: user.id,
      })
      .then(() => {
        onSuccess?.()
      })
  }

  const handleBulkUpdateStatus = (taskIds: string[], status: TaskStatus) => {
    for (const id of taskIds) {
      updateTaskMutation.mutate({ id, status })
    }
    setSelectedTaskIds([])
  }

  const handleBulkDelete = (taskIds: string[]) => {
    for (const id of taskIds) {
      deleteTaskMutation.mutate(id)
    }
    setSelectedTaskIds([])
  }

  if (!user) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Please sign in to view tasks.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between px-5 pt-5">
        <h1 className="font-semibold text-2xl text-foreground">Tasks</h1>
        <AddTaskSheet
          onAddTask={handleAddTask}
          isAdding={addTaskMutation.isPending}
        />
      </div>

      {isLoading ? (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="mx-4 rounded-lg border py-12 text-center">
          <p className="text-muted-foreground">
            No tasks yet. Create your first task above!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <TasksGroupActions
            selectedTasks={selectedTasks}
            onUpdateStatus={handleBulkUpdateStatus}
            onDelete={handleBulkDelete}
            isUpdating={updateTaskMutation.isPending}
            isDeleting={deleteTaskMutation.isPending}
          />

          <TasksTable
            tasks={tasks}
            selectedTaskIds={selectedTaskIds}
            onSelectionChange={setSelectedTaskIds}
          />
        </div>
      )}
    </div>
  )
}
