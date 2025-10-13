import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyMetric } from '../../lib/types'
import * as styles from './WeeklyChart.css'

interface WeeklyChartProps {
  data: DailyMetric[]
  isLoading?: boolean
}

export const WeeklyChart = ({ data, isLoading }: WeeklyChartProps) => {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading chart data...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyText}>No data available for the past week</p>
      </div>
    )
  }

  // Format data for Recharts
  const chartData = data.map((metric) => ({
    date: new Date(metric.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    created: metric.tasks_created,
    completed: metric.tasks_completed,
  }))

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Weekly Activity</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
            cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={(value) => (
              <span style={{ color: '#374151', fontSize: '14px' }}>
                {value === 'created' ? 'Created' : 'Completed'}
              </span>
            )}
          />
          <Bar dataKey="created" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          <Bar dataKey="completed" fill="#10b981" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
