import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="font-label-md text-on-surface-variant font-medium">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 text-outline text-[20px] pointer-events-none">
              {icon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full min-h-[44px] px-3.5 ${
              icon ? 'pl-10' : ''
            } py-2.5 bg-surface-container-lowest border rounded-xl font-body-md text-on-surface placeholder:text-outline/70 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
              error ? 'border-error focus:ring-error/30' : 'border-outline-variant/60 hover:border-outline'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <span className="font-label-md text-error text-[12px]">{error}</span>}
        {helperText && !error && (
          <span className="font-label-md text-on-surface-variant/80 text-[12px]">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
