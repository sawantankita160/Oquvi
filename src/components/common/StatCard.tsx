import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * TeamFlow - StatCard Component
 * Displays workspace performance metrics, counts, and velocity.
 */

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  isPositive = true,
  icon,
  className = ''
}) => {
  return (
    <div className={`stat-card ${className}`.trim()}>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {change && (
          <span className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change}
          </span>
        )}
      </div>

      {icon && <div className="stat-icon">{icon}</div>}
    </div>
  );
};
