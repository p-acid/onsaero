import { lazy, Suspense, useState } from "react";
import { NewTabLayout } from "../components/layout/NewTabLayout";
import { CompletedTaskToggle } from "../components/task/CompletedTaskToggle";
import { TaskInput } from "../components/task/TaskInput";
import { TaskList } from "../components/task/TaskList";
import { EmptyState } from "../components/ui/EmptyState";
import {
  useAddTaskMutation,
  useDeleteTaskMutation,
  useTasksQuery,
  useToggleTaskMutation,
} from "../hooks/useTaskQuery";
import type { NewTask } from "../lib/types";
import * as styles from "./NewTab.css";

const Dashboard = lazy(() =>
  import("./Dashboard").then((module) => ({ default: module.Dashboard }))
);

type ViewMode = "tasks" | "dashboard";

export const NewTab = () => {
  console.log("[NewTab] Component render");

  const [showCompleted, setShowCompleted] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("tasks");

  const { data: tasks = [], isLoading, error } = useTasksQuery();

  console.log("[NewTab] Query state:", {
    taskCount: tasks.length,
    isLoading,
    hasError: !!error,
  });

  const addTaskMutation = useAddTaskMutation();
  const toggleTaskMutation = useToggleTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  const handleAddTask = async (newTask: NewTask) => {
    try {
      await addTaskMutation.mutateAsync(newTask);
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      await toggleTaskMutation.mutateAsync({
        id: taskId,
        completed: !task.completed,
      });
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) return;

    try {
      await deleteTaskMutation.mutateAsync(taskId);
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.errorContainer}>
            <h2 className={styles.errorTitle}>Failed to load tasks</h2>
            <p className={styles.errorMessage}>
              {error instanceof Error
                ? error.message
                : "An unknown error occurred"}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={styles.retryButton}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Loading your tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveTasks = tasks.some((task) => !task.completed);
  const showEmptyState = tasks.length === 0;

  return (
    <NewTabLayout>
      <div className={styles.container}>
        <div className={styles.content}>
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <div>
                <h1 className={styles.title}>Onsaero Tasks</h1>
                <p className={styles.subtitle}>
                  {viewMode === "tasks"
                    ? "Capture your to-dos instantly, every time you open a new tab"
                    : "Track your productivity and task completion trends"}
                </p>
              </div>
              <div className={styles.viewToggle}>
                <button
                  type="button"
                  onClick={() => setViewMode("tasks")}
                  className={`${styles.viewToggleButton} ${
                    viewMode === "tasks" ? styles.viewToggleButtonActive : ""
                  }`}
                  aria-label="Switch to tasks view"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                      fill="currentColor"
                    />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 000 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Tasks</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("dashboard")}
                  className={`${styles.viewToggleButton} ${
                    viewMode === "dashboard"
                      ? styles.viewToggleButtonActive
                      : ""
                  }`}
                  aria-label="Switch to dashboard view"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Dashboard</span>
                </button>
              </div>
            </div>
          </header>

          <main className={styles.main}>
            {viewMode === "dashboard" ? (
              <Suspense
                fallback={
                  <div className={styles.loadingContainer}>
                    <div className={styles.spinner} />
                    <p className={styles.loadingText}>Loading dashboard...</p>
                  </div>
                }
              >
                <Dashboard />
              </Suspense>
            ) : (
              <>
                <TaskInput
                  onAdd={handleAddTask}
                  isLoading={addTaskMutation.isPending}
                />

                {showEmptyState ? (
                  <EmptyState
                    title="No tasks yet"
                    description="Add your first task to get started"
                    icon={
                      <svg
                        width="64"
                        height="64"
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="12"
                          y="12"
                          width="40"
                          height="40"
                          rx="4"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M20 30 L28 38 L44 22"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    }
                  />
                ) : (
                  <div className={styles.taskSection}>
                    {hasActiveTasks && (
                      <div className={styles.activeTasks}>
                        <h2 className={styles.sectionTitle}>Active Tasks</h2>
                        <TaskList
                          tasks={tasks.filter((task) => !task.completed)}
                          onToggle={handleToggleTask}
                          onDelete={handleDeleteTask}
                          showCompleted={false}
                        />
                      </div>
                    )}

                    {tasks.some((task) => task.completed) && (
                      <div className={styles.completedTasks}>
                        <CompletedTaskToggle
                          showCompleted={showCompleted}
                          onToggle={setShowCompleted}
                          completedCount={
                            tasks.filter((task) => task.completed).length
                          }
                        />
                        {showCompleted && (
                          <TaskList
                            tasks={tasks.filter((task) => task.completed)}
                            onToggle={handleToggleTask}
                            onDelete={handleDeleteTask}
                            showCompleted={true}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </main>

          {addTaskMutation.isError && (
            <div className={styles.toast} role="alert">
              Failed to add task. Please try again.
            </div>
          )}

          {deleteTaskMutation.isError && (
            <div className={styles.toast} role="alert">
              Failed to delete task. Please try again.
            </div>
          )}

          {toggleTaskMutation.isError && (
            <div className={styles.toast} role="alert">
              Failed to update task. Please try again.
            </div>
          )}
        </div>
      </div>
    </NewTabLayout>
  );
};
