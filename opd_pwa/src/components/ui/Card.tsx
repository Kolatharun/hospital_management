import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'surface' | 'container' | 'queue';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'surface',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-[20px] transition-shadow duration-200 overflow-hidden';

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-container-padding',
    lg: 'p-6',
  };

  const variantStyles = {
    surface: 'bg-surface-container-lowest border border-outline-variant/30 shadow-[0px_4px_12px_rgba(22,52,60,0.04)]',
    elevated: 'bg-surface-container-lowest border border-outline-variant/40 shadow-[0px_8px_24px_rgba(22,52,60,0.08)]',
    container: 'bg-surface-container-low border border-outline-variant/20',
    queue: 'bg-primary-container text-on-primary-container shadow-[0px_8px_24px_rgba(22,52,60,0.08)] relative',
  };

  return (
    <div
      className={`${baseStyles} ${paddingStyles[padding]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
