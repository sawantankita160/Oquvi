import React, { useState } from 'react';
import type { UserStatus } from '../../types';

/**
 * Oquvi - Collaborative Avatar Component
 * 
 * Shows a user picture or calculated initials, along with their real-time presence dot.
 */

export interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: UserStatus;
  showStatus?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUrl,
  size = 'md',
  status,
  showStatus = false,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);

  // Extract initials from full name (e.g. "Alex Rivera" -> "AR")
  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`avatar-container ${className}`.trim()}>
      <div className={`avatar avatar-${size}`}>
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={name}
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {showStatus && status && (
        <span
          className={`avatar-status avatar-status-${status}`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
