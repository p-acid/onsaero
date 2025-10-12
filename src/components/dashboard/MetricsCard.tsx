import type { ReactNode } from 'react';
import * as styles from './MetricsCard.css';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const MetricsCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
}: MetricsCardProps) => {
  return (
    <div className={styles.card}>
      {icon && <div className={styles.iconContainer}>{icon}</div>}

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.value}>{value}</div>

        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

        {trend && (
          <div
            className={`${styles.trend} ${
              trend.isPositive ? styles.trendPositive : styles.trendNegative
            }`}
          >
            <span className={styles.trendIcon}>
              {trend.isPositive ? '↑' : '↓'}
            </span>
            <span className={styles.trendValue}>
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
