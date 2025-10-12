import { supabase } from './supabase';
import type { DailyMetric } from '../lib/types';

/**
 * Fetch daily metrics for a date range
 */
export const getDailyMetrics = async (
  startDate: string,
  endDate: string
): Promise<DailyMetric[]> => {
  const { data, error } = await supabase
    .from('daily_metrics')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch daily metrics: ${error.message}`);
  }

  return data || [];
};

/**
 * Fetch weekly metrics (last 7 days)
 */
export const getWeeklyMetrics = async (): Promise<DailyMetric[]> => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  return getDailyMetrics(startDateStr, endDateStr);
};

/**
 * Fetch all-time metrics using Supabase RPC function
 */
export const getAllTimeMetrics = async (): Promise<{
  total_tasks: number;
  completed_tasks: number;
  active_tasks: number;
  completion_rate: number;
}> => {
  const { data, error } = await supabase.rpc('get_all_time_metrics');

  if (error) {
    throw new Error(`Failed to fetch all-time metrics: ${error.message}`);
  }

  if (!data || data.length === 0) {
    // Return default metrics if no data
    return {
      total_tasks: 0,
      completed_tasks: 0,
      active_tasks: 0,
      completion_rate: 0,
    };
  }

  // RPC returns array with single object, extract first element
  return data[0];
};

/**
 * Fetch monthly metrics (last 30 days)
 */
export const getMonthlyMetrics = async (): Promise<DailyMetric[]> => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  return getDailyMetrics(startDateStr, endDateStr);
};
