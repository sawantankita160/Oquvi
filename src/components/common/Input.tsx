import React from 'react';

/**
 * TeamFlow - Form Input Component
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="input-group">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}

      <div className="input-container">
        {icon && <span className="input-icon-left">{icon}</span>}
        <input
          id={inputId}
          className={`input-field ${icon ? 'has-icon-left' : ''} ${className}`.trim()}
          {...props}
        />
      </div>

      {error ? (
        <span className="input-error">{error}</span>
      ) : helperText ? (
        <span className="input-helper">{helperText}</span>
      ) : null}
    </div>
  );
};
