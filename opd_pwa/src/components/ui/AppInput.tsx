import React from 'react';
import { clsx } from 'clsx';

export interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  prefixText?: string;
}

export const AppInput = React.forwardRef<HTMLInputElement, AppInputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, prefixText, className, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[#16343C] tracking-wide">
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {prefixText && (
            <div className="absolute left-3.5 text-sm font-semibold text-[#16343C] select-none pointer-events-none">
              {prefixText}
            </div>
          )}

          {leftIcon && !prefixText && (
            <div className="absolute left-3.5 text-[#708188] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={clsx(
              'w-full h-12 text-sm text-[#16343C] bg-white border rounded-[14px] px-3.5 transition-all outline-none placeholder:text-[#708188]/60 focus:ring-2 focus:ring-[#0B6875]/20 focus:border-[#0B6875] disabled:bg-[#F7F9F8] disabled:text-[#BAC6C9]',
              prefixText ? 'pl-13' : leftIcon ? 'pl-10' : 'pl-3.5',
              rightIcon ? 'pr-10' : 'pr-3.5',
              error ? 'border-[#C94B4B] focus:border-[#C94B4B] focus:ring-[#C94B4B]/20' : 'border-[#DCE6E7]',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 text-[#708188] flex items-center">{rightIcon}</div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-[#C94B4B] font-medium mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#708188] mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

AppInput.displayName = 'AppInput';
