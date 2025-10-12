import { AllTimeMetrics } from '../components/dashboard/AllTimeMetrics';
import { WeeklyChart } from '../components/dashboard/WeeklyChart';
import { EmptyState } from '../components/ui/EmptyState';
import { useWeeklyMetricsQuery, useAllTimeMetricsQuery } from '../hooks/useMetrics';
import * as styles from './Dashboard.css';

export const Dashboard = () => {
  const {
    data: weeklyMetrics,
    isLoading: isWeeklyLoading,
    error: weeklyError,
  } = useWeeklyMetricsQuery();

  const {
    data: allTimeMetrics,
    isLoading: isAllTimeLoading,
    error: allTimeError,
  } = useAllTimeMetricsQuery();

  const isLoading = isWeeklyLoading || isAllTimeLoading;
  const hasError = weeklyError || allTimeError;

  // Check if there's any data at all
  const hasNoData =
    !isLoading &&
    (!allTimeMetrics || allTimeMetrics.total_tasks === 0) &&
    (!weeklyMetrics || weeklyMetrics.length === 0);

  if (hasError) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2 className={styles.errorTitle}>Failed to load dashboard</h2>
          <p className={styles.errorMessage}>
            {hasError instanceof Error
              ? hasError.message
              : 'An unknown error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (hasNoData) {
    return (
      <div className={styles.container}>
        <EmptyState
          title="No data yet"
          description="Create and complete tasks to see your productivity dashboard"
          icon={
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M28 44h8v8h-8v-8zM28 12h8v24h-8V12zM32 4C16.536 4 4 16.536 4 32s12.536 28 28 28 28-12.536 28-28S47.464 4 32 4z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your Dashboard</h1>
        <p className={styles.subtitle}>
          Track your productivity and task completion trends
        </p>
      </header>

      <div className={styles.content}>
        <AllTimeMetrics metrics={allTimeMetrics || null} isLoading={isAllTimeLoading} />

        <div className={styles.chartSection}>
          <WeeklyChart data={weeklyMetrics || []} isLoading={isWeeklyLoading} />
        </div>
      </div>
    </div>
  );
};
