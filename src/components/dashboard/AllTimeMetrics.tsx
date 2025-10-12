import { MetricsCard } from './MetricsCard';
import * as styles from './AllTimeMetrics.css';

interface AllTimeMetricsData {
  total_tasks: number;
  completed_tasks: number;
  active_tasks: number;
  completion_rate: number;
}

interface AllTimeMetricsProps {
  metrics: AllTimeMetricsData | null;
  isLoading?: boolean;
}

export const AllTimeMetrics = ({ metrics, isLoading }: AllTimeMetricsProps) => {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyText}>No statistics available</p>
      </div>
    );
  }

  const completionRate = metrics.completion_rate || 0;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>All-Time Statistics</h2>

      <div className={styles.grid}>
        <MetricsCard
          title="Total Tasks"
          value={metrics.total_tasks}
          subtitle="Tasks created"
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />

        <MetricsCard
          title="Completed"
          value={metrics.completed_tasks}
          subtitle="Tasks done"
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />

        <MetricsCard
          title="Active"
          value={metrics.active_tasks}
          subtitle="Remaining tasks"
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13 10V3L4 14h7v7l9-11h-7z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />

        <MetricsCard
          title="Completion Rate"
          value={`${completionRate.toFixed(1)}%`}
          subtitle="Overall progress"
          icon={
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
      </div>
    </div>
  );
};
