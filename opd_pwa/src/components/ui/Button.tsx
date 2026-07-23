import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'white';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-headline-sm rounded-xl transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 min-h-[44px]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs min-h-[38px]',
    md: 'px-4 py-2.5 text-sm min-h-[44px]',
    lg: 'px-6 py-3.5 text-base min-h-[50px]',
  };

  const variantStyles = {
    primary: 'bg-primary text-on-primary hover:bg-surface-tint shadow-sm',
    secondary: 'bg-secondary-container text-primary hover:bg-surface-dim shadow-xs',
    outline: 'border border-outline-variant text-primary hover:bg-surface-container-low',
    ghost: 'text-on-surface-variant hover:bg-surface-container-low',
    white: 'bg-white text-primary hover:bg-surface shadow-sm',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="mr-2 flex items-center justify-center text-[20px]">{icon}</span>}
      {children}
    </button>
  );
};
