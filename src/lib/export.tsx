/**
 * Data export utilities for tasks and metrics
 * Supports CSV and JSON formats
 */

import type { Task, DailyMetric } from './types'

/**
 * Export tasks to CSV format
 */
export function exportTasksToCSV(tasks: Task[]): string {
  // CSV headers
  const headers = [
    'ID',
    'Title',
    'Completed',
    'Created At',
    'Completed At',
    'Display Order',
  ]

  // Convert tasks to CSV rows
  const rows = tasks.map((task) => [
    task.id,
    `"${task.title.replace(/"/g, '""')}"`, // Escape quotes
    task.completed ? 'Yes' : 'No',
    task.created_at,
    task.completed_at || '',
    task.display_order,
  ])

  // Combine headers and rows
  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')

  return csv
}

/**
 * Export tasks to JSON format
 */
export function exportTasksToJSON(tasks: Task[]): string {
  // Remove sync_status before export (internal state)
  const exportTasks = tasks.map(({ sync_status, ...task }) => task)
  return JSON.stringify(exportTasks, null, 2)
}

/**
 * Export metrics to CSV format
 */
export function exportMetricsToCSV(metrics: DailyMetric[]): string {
  const headers = [
    'Date',
    'Tasks Created',
    'Tasks Completed',
  ]

  const rows = metrics.map((metric) => [
    metric.date,
    metric.tasks_created,
    metric.tasks_completed,
  ])

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')

  return csv
}

/**
 * Export metrics to JSON format
 */
export function exportMetricsToJSON(metrics: DailyMetric[]): string {
  return JSON.stringify(metrics, null, 2)
}

/**
 * Download data as file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()

  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export tasks with download
 */
export function downloadTasks(tasks: Task[], format: 'csv' | 'json' = 'csv') {
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `onsaero-tasks-${timestamp}.${format}`

  if (format === 'csv') {
    const csv = exportTasksToCSV(tasks)
    downloadFile(csv, filename, 'text/csv')
  } else {
    const json = exportTasksToJSON(tasks)
    downloadFile(json, filename, 'application/json')
  }
}

/**
 * Export metrics with download
 */
export function downloadMetrics(
  metrics: DailyMetric[],
  format: 'csv' | 'json' = 'csv'
) {
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `onsaero-metrics-${timestamp}.${format}`

  if (format === 'csv') {
    const csv = exportMetricsToCSV(metrics)
    downloadFile(csv, filename, 'text/csv')
  } else {
    const json = exportMetricsToJSON(metrics)
    downloadFile(json, filename, 'application/json')
  }
}

/**
 * Export all data (tasks + metrics)
 */
export function downloadAllData(
  tasks: Task[],
  metrics: DailyMetric[],
  format: 'json' = 'json'
) {
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `onsaero-export-${timestamp}.${format}`

  const exportData = {
    export_date: new Date().toISOString(),
    version: '1.0',
    tasks: tasks.map(({ sync_status, ...task }) => task),
    metrics,
  }

  const json = JSON.stringify(exportData, null, 2)
  downloadFile(json, filename, 'application/json')
}

/**
 * React hook for data export
 */
import { useState } from 'react'
import { useTaskStore } from '../stores/taskStore'

export function useDataExport() {
  const [isExporting, setIsExporting] = useState(false)
  const tasks = useTaskStore((state) => state.tasks)

  const exportTasks = async (format: 'csv' | 'json' = 'csv') => {
    setIsExporting(true)
    try {
      downloadTasks(tasks, format)
    } finally {
      setIsExporting(false)
    }
  }

  const exportAll = async () => {
    setIsExporting(true)
    try {
      // Fetch metrics from Supabase
      const { supabase } = await import('../api/supabase')
      const { data: metrics } = await supabase
        .from('daily_metrics')
        .select('*')
        .order('date', { ascending: false })

      downloadAllData(tasks, metrics || [], 'json')
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return {
    exportTasks,
    exportAll,
    isExporting,
  }
}


/**
 * Export button component
 */
interface ExportButtonProps {
  variant?: 'tasks' | 'all'
  format?: 'csv' | 'json'
  className?: string
}

export function ExportButton({
  variant = 'tasks',
  format = 'csv',
  className,
}: ExportButtonProps) {
  const { exportTasks, exportAll, isExporting } = useDataExport()

  const handleClick = () => {
    if (variant === 'all') {
      exportAll()
    } else {
      exportTasks(format)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isExporting}
      className={className}
      type="button"
      aria-label={`Export ${variant === 'all' ? 'all data' : 'tasks'} as ${format.toUpperCase()}`}
    >
      {isExporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
    </button>
  )
}
