import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'live' | 'confirmed' | 'pending' | 'completed' | 'error' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'confirmed',
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'px-2.5 py-1 rounded-md font-label-caps text-label-caps inline-flex items-center gap-1.5 font-semibold';

  const variantStyles = {
    live: 'bg-white/20 text-on-primary-container',
    confirmed: 'bg-secondary-container text-primary',
    pending: 'bg-amber-100 text-amber-900 border border-amber-200',
    completed: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
    error: 'bg-error-container text-on-error-container',
    neutral: 'bg-surface-container-high text-on-surface-variant',
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {variant === 'live' && (
        <span className="w-2 h-2 rounded-full bg-[#a4eefd] animate-pulse"></span>
      )}
      {icon && <span className="flex items-center justify-center">{icon}</span>}
      {children}
    </span>
  );
};
