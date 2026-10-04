import React from 'react';

/**
 * TeamFlow - Reusable Badge Component
 * 
 * Used for status tags, priority levels, category tags, and notification counts.
 */

export type BadgeVariant =
  | 'active'
  | 'in_progress'
  | 'planning'
  | 'todo'
  | 'in_review'
  | 'completed'
  | 'done'
  | 'on_hold'
  | 'urgent'
  | 'high'
  | 'medium'
  | 'low';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  showDot?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'planning',
  showDot = true,
  children,
  className = '',
  ...props
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()} {...props}>
      {showDot && <span className="badge-dot" />}
      <span>{children}</span>
    </span>
  );
};
